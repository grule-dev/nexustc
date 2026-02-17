import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { DOCUMENT_STATUSES } from "@repo/shared/constants";
import { comicCreateSchema } from "@repo/shared/schemas";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppForm } from "@/hooks/use-app-form";
import { useMultipleFileUpload } from "@/hooks/use-multiple-file-upload";
import { orpcClient } from "@/lib/orpc";

export const Route = createFileRoute("/admin/comics/create")({
  component: RouteComponent,
  loader: async () => await orpcClient.comic.admin.createComicPrerequisites(),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  const { parentRef, selectedFiles, handleFileChange, removeFile } =
    useMultipleFileUpload();
  const groupedTerms = Object.groupBy(data.terms, (item) => item.taxonomy);
  const navigate = useNavigate();
  const [tagsContent, setTagsContent] = useState("");
  const [tagsDialogVisible, setTagsDialogVisible] = useState(false);

  const form = useAppForm({
    validators: {
      onSubmit: comicCreateSchema,
    },
    defaultValues: {
      type: "comic" as const,
      title: "",
      censorship: "",
      status: "",
      documentStatus: "draft" as (typeof DOCUMENT_STATUSES)[number],
      tags: [] as string[],
    },
    onSubmit: async (formData) => {
      try {
        await toast
          .promise(
            orpcClient.comic.admin.create({
              ...formData.value,
              files: selectedFiles,
            }),
            {
              loading: "Creando comic...",
              success: "Comic creado!",
              error: (error) => ({
                message: `Error al crear comic: ${error}`,
                duration: 10_000,
              }),
            }
          )
          .unwrap();

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

  const extractTags = () => {
    if (tagsContent.trim() === "") {
      setTagsDialogVisible(false);
      return;
    }

    const tags = tagsContent.split(",").map((tag) => tag.trim());
    const foundTags: string[] = [];
    const notFoundTags: string[] = [];

    for (const tag of tags) {
      const foundTag = groupedTerms.tag?.find(
        (t) => t.name.toLowerCase() === tag.toLowerCase()
      );
      if (foundTag) {
        foundTags.push(foundTag.id);
      } else {
        notFoundTags.push(tag);
      }
    }

    form.setFieldValue("tags", foundTags);
    setTagsContent("");
    setTagsDialogVisible(false);
    if (notFoundTags.length > 0) {
      toast.error(
        `No se encontraron los siguientes tags: ${notFoundTags.join(", ")}`,
        {
          dismissible: true,
          duration: Number.POSITIVE_INFINITY,
          closeButton: true,
        }
      );
    }
  };

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

          <form.AppField name="status">
            {(field) => (
              <field.SelectField
                label="Estado"
                options={
                  groupedTerms.status?.map((term) => ({
                    value: term.id,
                    label: term.name,
                  })) ?? []
                }
              />
            )}
          </form.AppField>

          <div className="flex flex-row items-end gap-2">
            <form.AppField name="tags">
              {(field) => (
                <field.MultiSelectField
                  className="w-full"
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
            <Dialog
              onOpenChange={(value) => setTagsDialogVisible(value)}
              open={tagsDialogVisible}
            >
              <DialogTrigger render={<Button />}>Insertar Tags</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Insertar Tags</DialogTitle>
                </DialogHeader>
                <Textarea
                  onChange={(e) => setTagsContent(e.target.value)}
                  value={tagsContent}
                />
                <DialogFooter>
                  <Button onClick={extractTags}>Extraer</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

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
                  {selectedFiles.map((file) => (
                    <Card
                      className="cursor-grab"
                      data-label={file.name}
                      key={file.name}
                    >
                      <CardHeader>
                        <CardTitle className="text-wrap text-sm">
                          {file.name}
                        </CardTitle>
                        <CardDescription>
                          {(file.size / 1024).toFixed(2)} KB
                        </CardDescription>
                        <CardAction>
                          <Button
                            disabled={form.state.isSubmitting}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(file.name);
                            }}
                            size="icon"
                            variant="ghost"
                          >
                            <HugeiconsIcon icon={Cancel01Icon} />
                          </Button>
                        </CardAction>
                      </CardHeader>
                      <CardContent className="flex justify-center">
                        <img
                          alt={`Preview of ${file.name}`}
                          className="max-h-32 rounded object-contain"
                          src={URL.createObjectURL(file)}
                        />
                      </CardContent>
                    </Card>
                  ))}
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
