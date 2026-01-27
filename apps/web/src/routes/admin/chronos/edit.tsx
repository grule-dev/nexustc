import { Upload01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useBlocker } from "@tanstack/react-router";
import MDEditor from "@uiw/react-md-editor";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMultipleFileUpload } from "@/hooks/use-multiple-file-upload";
import { orpcClient, queryClient } from "@/lib/orpc";
import {
  convertImage,
  getBucketUrl,
  uploadBlobWithProgress,
} from "@/lib/utils";

type ChronosData = {
  stickyImageKey: string | null;
  carouselImageKeys: string[];
  markdownContent: string;
  markdownImageKeys: string[];
};

export const Route = createFileRoute("/admin/chronos/edit")({
  component: RouteComponent,
  loader: async () => {
    const data = await orpcClient.chronos.getForEdit();
    return {
      initialData: {
        stickyImageKey: data.stickyImageKey,
        carouselImageKeys: data.carouselImageKeys ?? [],
        markdownContent: data.markdownContent,
        markdownImageKeys: data.markdownImageKeys ?? [],
      },
    };
  },
  staleTime: 0,
});

function RouteComponent() {
  const { initialData } = Route.useLoaderData();
  const [currentData, setCurrentData] = useState<ChronosData>(initialData);
  const [savedData, setSavedData] = useState<ChronosData>(initialData);
  const [blockerDialogOpen, setBlockerDialogOpen] = useState(false);
  const [stickyImageFile, setStickyImageFile] = useState<File | null>(null);
  const [stickyImagePreview, setStickyImagePreview] = useState<string | null>(
    null
  );
  const [uploadingStickyImage, setUploadingStickyImage] = useState(false);
  const [uploadingCarouselImages, setUploadingCarouselImages] = useState(false);

  const carousel = useMultipleFileUpload();

  const hasChanges = useMemo(() => {
    return (
      currentData.stickyImageKey !== savedData.stickyImageKey ||
      JSON.stringify(currentData.carouselImageKeys) !==
        JSON.stringify(savedData.carouselImageKeys) ||
      currentData.markdownContent !== savedData.markdownContent ||
      JSON.stringify(currentData.markdownImageKeys) !==
        JSON.stringify(savedData.markdownImageKeys) ||
      stickyImageFile !== null ||
      carousel.selectedFiles.length > 0
    );
  }, [currentData, savedData, stickyImageFile, carousel.selectedFiles]);

  const blocker = useBlocker({
    shouldBlockFn: () => hasChanges,
    enableBeforeUnload: true,
    withResolver: true,
  });

  useEffect(() => {
    if (blocker.status === "blocked") {
      setBlockerDialogOpen(true);
    }
  }, [blocker.status]);

  const handleStickyImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files?.[0]) {
      const file = event.target.files[0];
      const converted = await convertImage(file, "webp", 0.8);
      setStickyImageFile(converted);
      setStickyImagePreview(URL.createObjectURL(converted));
    }
  };

  const uploadStickyImage = async (): Promise<string | null> => {
    if (!stickyImageFile) {
      return currentData.stickyImageKey;
    }

    setUploadingStickyImage(true);
    try {
      const [presignedUrl] = await orpcClient.chronos.getPresignedUrls({
        type: "sticky",
        objects: [
          {
            contentLength: stickyImageFile.size,
            extension: "webp",
          },
        ],
      });

      await uploadBlobWithProgress(
        stickyImageFile,
        presignedUrl.presignedUrl,
        // Empty progress callback - progress not displayed for sticky image
        () => {
          // Intentionally empty
        }
      );

      return presignedUrl.objectKey;
    } finally {
      setUploadingStickyImage(false);
    }
  };

  const uploadCarouselImages = async (): Promise<string[]> => {
    if (carousel.selectedFiles.length === 0) {
      return currentData.carouselImageKeys;
    }

    setUploadingCarouselImages(true);
    try {
      const presignedUrls = await orpcClient.chronos.getPresignedUrls({
        type: "carousel",
        objects: carousel.selectedFiles.map((file) => ({
          contentLength: file.size,
          extension: file.name.split(".").pop() ?? "webp",
        })),
      });

      await Promise.all(
        presignedUrls.map((url, index) => {
          const file = carousel.selectedFiles[index];
          carousel.setUploadProgress((prev) => ({
            ...prev,
            [file.name]: { ...prev[file.name], status: "uploading" },
          }));

          return uploadBlobWithProgress(file, url.presignedUrl, (progress) => {
            carousel.setUploadProgress((prev) => ({
              ...prev,
              [file.name]: { ...prev[file.name], progress },
            }));
          }).then(() => {
            carousel.setUploadProgress((prev) => ({
              ...prev,
              [file.name]: { ...prev[file.name], status: "uploaded" },
            }));
          });
        })
      );

      const newKeys = presignedUrls.map((url) => url.objectKey);
      return [...currentData.carouselImageKeys, ...newKeys];
    } finally {
      setUploadingCarouselImages(false);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const [stickyKey, carouselKeys] = await Promise.all([
        uploadStickyImage(),
        uploadCarouselImages(),
      ]);

      return orpcClient.chronos.update({
        stickyImageKey: stickyKey ?? undefined,
        carouselImageKeys: carouselKeys,
        markdownContent: currentData.markdownContent,
        markdownImageKeys: currentData.markdownImageKeys,
      });
    },
    onSuccess: async (data) => {
      const newData = {
        stickyImageKey: data.stickyImageKey,
        carouselImageKeys: data.carouselImageKeys ?? [],
        markdownContent: data.markdownContent,
        markdownImageKeys: data.markdownImageKeys ?? [],
      };

      setSavedData(newData);
      setCurrentData(newData);
      setStickyImageFile(null);
      setStickyImagePreview(null);
      carousel.selectedFiles.splice(0, carousel.selectedFiles.length);

      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.includes("chronos");
        },
      });

      toast.success("Página de Chronos actualizada correctamente", {
        duration: 3000,
      });
    },
    onError: (error) => {
      toast.error(
        `Error al actualizar página de Chronos: ${error instanceof Error ? error.message : "Error desconocido"}`,
        { duration: 5000 }
      );
    },
  });

  const removeCarouselImage = (key: string) => {
    setCurrentData((prev) => ({
      ...prev,
      carouselImageKeys: prev.carouselImageKeys.filter((k) => k !== key),
    }));
  };

  const handleSave = () => {
    updateMutation.mutate();
  };

  const handleDiscard = () => {
    setCurrentData(savedData);
    setStickyImageFile(null);
    setStickyImagePreview(null);
    carousel.selectedFiles.splice(0, carousel.selectedFiles.length);
  };

  const isUploading = uploadingStickyImage || uploadingCarouselImages;

  return (
    <main className="flex flex-col gap-6">
      <h1 className="font-bold text-2xl">Editar Página Chronos</h1>

      <div className="flex flex-row items-center gap-4">
        <Button
          disabled={!hasChanges || isUploading}
          loading={updateMutation.isPending}
          onClick={handleSave}
        >
          Guardar Cambios
        </Button>
        <Button
          disabled={!hasChanges}
          onClick={handleDiscard}
          variant="outline"
        >
          Descartar Cambios
        </Button>
        {hasChanges && <Badge variant="outline">Cambios sin guardar</Badge>}
        {isUploading && <Badge variant="secondary">Subiendo imágenes...</Badge>}
      </div>

      {/* Sticky Image Section */}
      <section className="flex flex-col gap-4 rounded-lg border p-4">
        <h2 className="font-semibold text-lg">Imagen Lateral Izquierda</h2>
        <p className="text-muted-foreground text-sm">
          Imagen estática que aparece en el lado izquierdo de la página
        </p>

        {(stickyImagePreview || currentData.stickyImageKey) && (
          <div className="relative w-full max-w-sm">
            <img
              alt="Sticky preview"
              className="w-full rounded-md border object-cover"
              src={
                stickyImagePreview ??
                getBucketUrl(currentData.stickyImageKey ?? "")
              }
            />
            <Button
              className="absolute top-2 right-2"
              onClick={() => {
                setStickyImageFile(null);
                setStickyImagePreview(null);
                setCurrentData((prev) => ({ ...prev, stickyImageKey: null }));
              }}
              size="sm"
              variant="destructive"
            >
              Eliminar
            </Button>
          </div>
        )}

        <div>
          <Input
            accept="image/*"
            onChange={handleStickyImageSelect}
            type="file"
          />
        </div>
      </section>

      {/* Carousel Images Section */}
      <section className="flex flex-col gap-4 rounded-lg border p-4">
        <h2 className="font-semibold text-lg">Carrusel Derecho</h2>
        <p className="text-muted-foreground text-sm">
          Imágenes que se desplazarán verticalmente en el lado derecho
        </p>

        {/* Existing carousel images */}
        {currentData.carouselImageKeys.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {currentData.carouselImageKeys.map((key) => (
              <div className="relative" key={key}>
                <img
                  alt="Carousel"
                  className="aspect-video w-full rounded-md border object-cover"
                  src={getBucketUrl(key)}
                />
                <Button
                  className="absolute top-2 right-2"
                  onClick={() => removeCarouselImage(key)}
                  size="sm"
                  variant="destructive"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* New carousel images */}
        {carousel.selectedFiles.length > 0 && (
          <div>
            <h3 className="mb-2 font-medium text-sm">Nuevas imágenes</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {carousel.selectedFiles.map((file) => {
                const progress = carousel.uploadProgress[file.name];
                return (
                  <div className="relative" key={file.name}>
                    <img
                      alt={file.name}
                      className="aspect-video w-full rounded-md border object-cover"
                      src={progress?.previewUrl}
                    />
                    {progress?.status === "uploading" && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50">
                        <span className="text-sm text-white">
                          {progress.progress}%
                        </span>
                      </div>
                    )}
                    <Button
                      className="absolute top-2 right-2"
                      onClick={() => carousel.removeFile(file.name)}
                      size="sm"
                      variant="destructive"
                    >
                      ×
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors hover:border-secondary"
          ref={carousel.parentRef}
        >
          <HugeiconsIcon
            className="size-8 text-muted-foreground"
            icon={Upload01Icon}
          />
          <p className="text-muted-foreground text-sm">
            Arrastra imágenes aquí o haz clic para seleccionar
          </p>
          <Input
            accept="image/*"
            className="hidden"
            id="carousel-upload"
            multiple
            onChange={carousel.handleFileChange}
            type="file"
          />
          <Button
            onClick={() => document.getElementById("carousel-upload")?.click()}
            type="button"
            variant="outline"
          >
            Seleccionar Imágenes
          </Button>
        </div>
      </section>

      {/* Markdown Editor Section */}
      <section className="flex flex-col gap-4 rounded-lg border p-4">
        <h2 className="font-semibold text-lg">Contenido Central</h2>
        <p className="text-muted-foreground text-sm">
          Contenido en formato Markdown que aparecerá en el centro de la página
        </p>

        <div data-color-mode="dark">
          <MDEditor
            height={600}
            onChange={(value) =>
              setCurrentData((prev) => ({
                ...prev,
                markdownContent: value ?? "",
              }))
            }
            preview="live"
            value={currentData.markdownContent}
          />
        </div>
      </section>

      <AlertDialog
        onOpenChange={(open) => {
          setBlockerDialogOpen(open);
          if (!open && blocker.status === "blocked") {
            blocker.reset?.();
          }
        }}
        open={blockerDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. ¿Estás seguro de que quieres salir sin
              guardar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                blocker.reset?.();
                setBlockerDialogOpen(false);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                blocker.proceed?.();
                setBlockerDialogOpen(false);
              }}
            >
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
