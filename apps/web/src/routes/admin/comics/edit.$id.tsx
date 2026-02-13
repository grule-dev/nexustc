import { comicEditSchema } from "@repo/shared/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef } from "react";
import { toast } from "sonner";
import {
  ImageEditor,
  type ImageEditorRef,
} from "@/components/admin/image-editor";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppForm } from "@/hooks/use-app-form";
import { orpc, orpcClient } from "@/lib/orpc";

export const Route = createFileRoute("/admin/comics/edit/$id")({
  component: RouteComponent,
  loader: async ({ params }) => ({
    prerequisites: await orpcClient.comic.admin.createComicPrerequisites(),
    oldComic: await orpcClient.comic.admin.getEdit(params.id),
  }),
  gcTime: 0,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  const mutation = useMutation(orpc.comic.admin.edit.mutationOptions());
  const imagesMutation = useMutation(
    orpc.comic.admin.editImages.mutationOptions()
  );
  const groupedTerms = Object.groupBy(
    data.prerequisites.terms,
    (item) => item.taxonomy
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const imageEditorRef = useRef<ImageEditorRef>(null);

  const oldComic = data.oldComic!;
  const terms = Object.groupBy(oldComic.terms, (item) => item.term.taxonomy);

  const form = useAppForm({
    validators: {
      onSubmit: comicEditSchema,
    },
    defaultValues: {
      type: "comic" as const,
      id: oldComic.id,
      title: oldComic.title,
      censorship: terms.censorship?.[0]?.term.id ?? "",
      status: terms.status?.[0]?.term.id ?? "",
      documentStatus: oldComic.status,
      tags: terms.tag?.map((term) => term.term.id) ?? [],
    },
    onSubmit: async (formData) => {
      const imagePayload = imageEditorRef.current?.getPayload();

      await toast
        .promise(
          (async () => {
            await mutation.mutateAsync(formData.value);
            if (imagePayload) {
              await imagesMutation.mutateAsync({
                postId: oldComic.id,
                type: "comic",
                order: imagePayload.order,
                newFiles:
                  imagePayload.newFiles.length > 0
                    ? imagePayload.newFiles
                    : undefined,
              });
            }
          })(),
          {
            loading: "Editando cómic...",
            success: "Cómic editado!",
            error: (error) => ({
              message: `Error al editar cómic: ${error}`,
              duration: 10_000,
            }),
          }
        )
        .unwrap();
      await queryClient.invalidateQueries(
        orpc.comic.admin.getDashboardList.queryOptions()
      );
      navigate({ to: "/admin/comics" });
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
          <CardTitle>Editar Cómic</CardTitle>
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

          <ImageEditor
            initialImageKeys={oldComic.imageObjectKeys ?? []}
            ref={imageEditorRef}
          />
        </CardContent>
        <CardFooter>
          <form.AppForm>
            <form.SubmitButton className="w-full">Editar</form.SubmitButton>
          </form.AppForm>
        </CardFooter>
      </Card>
    </form>
  );
}
