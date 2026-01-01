import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { DOCUMENT_STATUSES } from "@repo/shared/constants";
import { postCreateSchema } from "@repo/shared/schemas";
import { useStore } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type React from "react";
import { Activity, useState } from "react";
import { toast } from "sonner";
import { GenerateMarkdownLinkDialog } from "@/components/admin/generate-md-link-dialog";
import { Markdown } from "@/components/markdown";
import { GamePage, type PostProps } from "@/components/posts/game-page";
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
import { Separator } from "@/components/ui/separator";
import { useAppForm } from "@/hooks/use-app-form";
import { useMultipleFileUpload } from "@/hooks/use-multiple-file-upload";
import { orpcClient } from "@/lib/orpc";
import { uploadBlobWithProgress } from "@/lib/utils";

const statusDisplayMap = {
  queued: "En cola",
  uploading: "Subiendo...",
  uploaded: "Subido",
  error: "Error",
} as const;

export const Route = createFileRoute("/admin/posts/create")({
  component: RouteComponent,
  loader: async () => await orpcClient.post.admin.createPostPrerequisites(),
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
  const [previewVisible, setPreviewVisible] = useState(false);

  const form = useAppForm({
    validators: {
      onSubmit: postCreateSchema,
    },
    defaultValues: {
      title: "",
      version: "",
      censorship: "",
      status: "",
      engine: "",
      graphics: "",
      content: "",
      authorContent: "",
      adsLinks: "",
      premiumLinks: "",
      documentStatus: "draft" as (typeof DOCUMENT_STATUSES)[number],
      platforms: [] as string[],
      tags: [] as string[],
      languages: [] as string[],
    },
    onSubmit: async (formData) => {
      try {
        const { postId } = await toast
          .promise(orpcClient.post.admin.create(formData.value), {
            loading: "Creando post...",
            success: "Post creado!",
            error: (error) => ({
              message: `Error al crear post: ${error}`,
            }),
          })
          .unwrap();

        const presignedUrls = await orpcClient.file.getPostPresignedUrls({
          postId,
          objects: selectedFiles.map((file) => ({
            contentLength: file.size,
            extension: file.name.split(".").pop() ?? "",
          })),
        });

        const attachments = await toast
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

                return object.objectKey;
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

        if (attachments.length > 0) {
          await toast.promise(
            orpcClient.post.admin.insertImages({
              postId,
              images: attachments,
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
          to: "/admin/posts/create",
          reloadDocument: true,
          resetScroll: true,
        });
      } catch (error) {
        toast.error(`Error al crear post: ${error}`, {
          dismissible: true,
          duration: 10_000,
        });
      } finally {
        toast.dismiss("uploading");
        toast.dismiss("creating");
      }
    },
  });

  const adsLinks = useStore(form.store, (state) => state.values.adsLinks);
  const premiumLinks = useStore(
    form.store,
    (state) => state.values.premiumLinks
  );

  const post = useStore(form.store, (state) => state.values);

  return (
    <form
      className="relative flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Crear Post</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <form.AppField name="title">
            {(field) => (
              <field.TextField label="Nombre" placeholder="Nombre" required />
            )}
          </form.AppField>

          <form.AppField name="version">
            {(field) => (
              <field.TextField label="Versión" placeholder="Versión" />
            )}
          </form.AppField>

          <div className="col-span-2 flex flex-row gap-4">
            <div className="flex-1 space-y-4">
              <form.AppField name="adsLinks">
                {(field) => (
                  <field.TextareaField
                    className="h-40 resize-none"
                    label="Links con Anuncios"
                  />
                )}
              </form.AppField>
            </div>
            <Separator orientation="vertical" />
            <div className="flex flex-1 flex-col gap-4">
              <form.AppField name="premiumLinks">
                {(field) => (
                  <field.TextareaField
                    className="h-40 resize-none"
                    label="Links Premium"
                  />
                )}
              </form.AppField>
            </div>
          </div>

          <div className="col-span-2 flex flex-row gap-4">
            <div className="flex-1 space-y-4 rounded-md bg-background p-4 [&_a]:text-primary">
              <Markdown>{adsLinks}</Markdown>
            </div>
            <Separator orientation="vertical" />
            <div className="flex-1 space-y-4 rounded-md bg-background p-4 [&_a]:text-primary">
              <Markdown>{premiumLinks}</Markdown>
            </div>
          </div>

          <div className="col-span-2">
            <GenerateMarkdownLinkDialog />
          </div>

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

          <form.AppField name="engine">
            {(field) => (
              <field.SelectField
                label="Motor"
                options={
                  groupedTerms.engine?.map((term) => ({
                    value: term.id,
                    label: term.name,
                  })) ?? []
                }
              />
            )}
          </form.AppField>

          <form.AppField name="graphics">
            {(field) => (
              <field.SelectField
                label="Gráficos"
                options={
                  groupedTerms.graphics?.map((term) => ({
                    value: term.id,
                    label: term.name,
                  })) ?? []
                }
              />
            )}
          </form.AppField>

          <form.AppField name="platforms">
            {(field) => (
              <field.MultiSelectField
                label="Plataformas"
                options={
                  groupedTerms.platform?.map((term) => ({
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
            <form.AppField name="authorContent">
              {(field) => (
                <field.TextareaField
                  className="w-full"
                  label="Autor"
                  value={field.state.value}
                />
              )}
            </form.AppField>
            <form.AppField name="content">
              {(field) => (
                <field.TextareaField
                  className="w-full"
                  label="Sinopsis"
                  value={field.state.value}
                />
              )}
            </form.AppField>
          </section>

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
                              disabled={progressEntry?.status === "uploading"}
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
        <CardFooter className="flex flex-row gap-4">
          <form.AppForm>
            <form.SubmitButton className="flex-1">Crear</form.SubmitButton>
          </form.AppForm>
          <Button
            className="flex-1"
            onClick={() => setPreviewVisible(true)}
            type="button"
            variant="secondary"
          >
            Vista Previa
          </Button>
        </CardFooter>
      </Card>
      <Activity mode={previewVisible ? "visible" : "hidden"}>
        <Preview
          post={{
            ...post,
            id: "0",
            imageObjectKeys: selectedFiles.map(
              (file) => uploadProgress[file.name]?.previewUrl ?? ""
            ),
            createdAt: new Date(),
            terms: post.platforms
              .concat(post.tags, post.languages, [
                post.censorship,
                post.engine,
                post.status,
                post.graphics,
              ])
              .map((term) => data.terms.find((t) => t.id === term))
              .filter((term) => term !== undefined),
          }}
          setVisible={setPreviewVisible}
          visible={previewVisible}
        />
      </Activity>
    </form>
  );
}

function Preview({
  post,
  visible,
  setVisible,
}: {
  post: PostProps;
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  if (!visible) {
    return;
  }

  return (
    <div className="absolute top-0 z-999999 flex h-full w-full items-center bg-black/80">
      <section className="w-[50%] translate-x-[50%] space-y-4">
        <Button onClick={() => setVisible(false)} size="icon" type="button">
          <HugeiconsIcon className="size-8" icon={Cancel01Icon} />
        </Button>
        <GamePage post={post} />
      </section>
    </div>
  );
}
