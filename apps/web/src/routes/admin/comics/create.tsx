import type { DOCUMENT_STATUSES } from "@repo/shared/constants";
import { comicCreateSchema } from "@repo/shared/schemas";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAppForm } from "@/hooks/use-app-form";
import { useMultipleFileUpload } from "@/hooks/use-multiple-file-upload";
import { uploadBlobWithProgress } from "@/lib/utils";
import { orpcClient } from "@/utils/orpc";

const statusDisplayMap = {
  queued: "En cola",
  uploading: "Subiendo...",
  uploaded: "Subido",
  error: "Error",
} as const;

export const Route = createFileRoute("/admin/comics/create")({
  component: RouteComponent,
  loader: async () => await orpcClient.comic.admin.createComicPrerequisites(),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  const {
    parentRef,
    selectedFiles,
    uploadProgress,
    handleFileChange,
    removeFile,
    setUploadProgress,
  } = useMultipleFileUpload();
  const groupedTerms = Object.groupBy(data.terms, (item) => item.taxonomy);
  const navigate = useNavigate();

  const form = useAppForm({
    validators: {
      onSubmit: comicCreateSchema,
    },
    defaultValues: {
      title: "",
      censorship: "",
      documentStatus: "draft" as (typeof DOCUMENT_STATUSES)[number],
      tags: [] as string[],
      languages: [] as string[],
    },
    onSubmit: async (formData) => {
      try {
        const comic = await toast
          .promise(orpcClient.comic.admin.create(formData.value), {
            loading: "Creando comic...",
            success: "Comic creado!",
            error: (error) => ({
              message: `Error al crear comic: ${error}`,
              duration: 10_000,
            }),
          })
          .unwrap();

        const presignedUrls = await orpcClient.file.getPostPresignedUrls({
          postId: comic,
          objects: selectedFiles.map((file) => ({
            contentLength: file.size,
            extension: file.name.split(".").pop() ?? "",
          })),
        });

        const images = await toast
          .promise(
            Promise.all(
              selectedFiles.map(async (file, index) => {
                const object = presignedUrls[index];

                await uploadBlobWithProgress(
                  file,
                  object.presignedUrl,
                  (percent) => {
                    setUploadProgress((prev) => ({
                      ...prev,
                      [file.name]: {
                        status: "uploading",
                        progress: percent,
                      },
                    }));
                  }
                );

                setUploadProgress((prev) => ({
                  ...prev,
                  [file.name]: {
                    status: "uploaded",
                    progress: 100,
                  },
                }));

                return {
                  objectKey: object.objectKey,
                };
              })
            ),
            {
              loading: "Subiendo archivos...",
              success: "Archivos subidos!",
              error: (error) => ({
                message: `Error al subir archivos: ${error}`,
                duration: 10_000,
              }),
            }
          )
          .unwrap();

        if (images.length > 0) {
          await toast.promise(
            orpcClient.comic.admin.insertImages({
              postId: comic,
              images: images.map((a) => a.objectKey),
            }),
            {
              loading: "Insertando imágenes...",
              success: "Imágenes insertadas!",
              error: (error) => ({
                message: `Error al insertar imágenes: ${error}`,
                duration: 10_000,
              }),
            }
          );
        }

        navigate({
          to: "/admin/comics/create",
          reloadDocument: true,
          resetScroll: true,
        });
      } catch (error) {
        toast.error(`Error al crear comic: ${error}`, {
          dismissible: true,
          duration: 10_000,
        });
      } finally {
        toast.dismiss("uploading");
        toast.dismiss("creating");
      }
    },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Crear Comic</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <form.AppField name="title">
            {(field) => (
              <field.TextField label="Nombre" placeholder="Nombre" required />
            )}
          </form.AppField>

          <form.AppField name="censorship">
            {(field) => (
              <field.SelectField
                label="Censura"
                options={
                  groupedTerms.censorship?.map((term) => ({
                    value: term.id,
                    label: term.name,
                  })) ?? []
                }
              />
            )}
          </form.AppField>

          <form.AppField name="tags">
            {(field) => (
              <field.MultiSelectField
                label="Tags"
                options={
                  groupedTerms.tag?.map((term) => ({
                    value: term.id,
                    label: term.name,
                  })) ?? []
                }
              />
            )}
          </form.AppField>

          <form.AppField name="languages">
            {(field) => (
              <field.MultiSelectField
                label="Idiomas"
                options={
                  groupedTerms.language?.map((term) => ({
                    value: term.id,
                    label: term.name,
                  })) ?? []
                }
              />
            )}
          </form.AppField>

          <form.AppField name="documentStatus">
            {(field) => (
              <field.SelectField
                label="Estado del Documento"
                options={[
                  { value: "publish", label: "Publicar" },
                  { value: "pending", label: "Pendiente" },
                  { value: "draft", label: "Borrador" },
                  { value: "trash", label: "Basura" },
                ]}
                required
              />
            )}
          </form.AppField>

          <section className="col-span-2">
            <Label htmlFor="file-upload">Subir imágenes</Label>
            <Input
              accept="image/*"
              className="mt-1 w-full"
              id="file-upload"
              multiple
              name="file-upload"
              onChange={async (e) => {
                await toast.promise(handleFileChange(e), {
                  loading: "Convirtiendo imágenes...",
                  success: "Imágenes convertidas!",
                  error: (error) => `Error al convertir imágenes: ${error}`,
                });
              }}
              type="file"
            />
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-3">
                <h3 className="font-semibold text-md">
                  Archivos seleccionados:
                </h3>
                <div
                  className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6"
                  ref={parentRef}
                >
                  {selectedFiles.map((file) => {
                    const progressEntry = uploadProgress[file.name];
                    return (
                      <Card className="cursor-grab" key={file.name}>
                        <CardHeader>
                          <CardTitle className="text-wrap text-sm">
                            {file.name}
                          </CardTitle>
                          <CardDescription>
                            {(file.size / 1024).toFixed(2)} KB
                          </CardDescription>
                          <CardAction>
                            <Button
                              disabled={progressEntry?.status === "uploading"}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(file.name);
                              }}
                              size="icon"
                              variant="ghost"
                            >
                              <XIcon />
                            </Button>
                          </CardAction>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                          {!!progressEntry?.previewUrl && (
                            <img
                              alt={`Preview of ${file.name}`}
                              className="max-h-32 rounded object-contain"
                              src={progressEntry.previewUrl}
                            />
                          )}
                        </CardContent>
                        <CardFooter className="flex-col items-start">
                          {!!progressEntry && (
                            <>
                              <Progress
                                className="h-2 w-full"
                                value={progressEntry.progress}
                              />
                              <p
                                className={`mt-1 text-xs ${
                                  progressEntry.error
                                    ? "text-red-500"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {statusDisplayMap[progressEntry.status]}
                                {!!progressEntry.error &&
                                  `: ${progressEntry.error}`}
                              </p>
                            </>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </CardContent>
        <CardFooter>
          <form.AppForm>
            <form.SubmitButton className="w-full">Crear</form.SubmitButton>
          </form.AppForm>
        </CardFooter>
      </Card>
    </form>
  );
}
