import { postEditSchema } from "@repo/shared/schemas";
import { useStore } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { GenerateMarkdownLinkDialog } from "@/components/admin/generate-md-link-dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppForm } from "@/hooks/use-app-form";
import { orpc, orpcClient } from "@/lib/orpc";

export const Route = createFileRoute("/admin/posts/edit/$id")({
  component: RouteComponent,
  loader: async ({ params }) => ({
    prerequisites: await orpcClient.post.admin.createPostPrerequisites(),
    oldPost: await orpcClient.post.admin.getEdit(params.id),
  }),
  gcTime: 0,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  const mutation = useMutation(orpc.post.admin.edit.mutationOptions());
  const groupedTerms = Object.groupBy(
    data.prerequisites.terms,
    (item) => item.taxonomy
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const oldPost = data.oldPost!;
  const terms = Object.groupBy(oldPost.terms, (item) => item.term.taxonomy);

  const form = useAppForm({
    validators: {
      onSubmit: postEditSchema,
    },
    defaultValues: {
      type: "post" as const,
      id: oldPost.id,
      title: oldPost.title,
      version: oldPost.version ?? "",
      censorship: terms.censorship?.[0]?.term.id ?? "",
      status: terms.status?.[0]?.term.id ?? "",
      engine: terms.engine?.[0]?.term.id ?? "",
      graphics: terms.graphics?.[0].term.id ?? "",
      content: oldPost.content,
      authorContent: oldPost.authorContent,
      adsLinks: oldPost.adsLinks ?? "",
      premiumLinks: oldPost.premiumLinks ?? "",
      documentStatus: oldPost.status,
      platforms: terms.platform?.map((term) => term.term.id) ?? [],
      tags: terms.tag?.map((term) => term.term.id) ?? [],
      languages: terms.language?.map((term) => term.term.id) ?? [],
    },
    onSubmit: async (formData) => {
      await toast
        .promise(mutation.mutateAsync(formData.value), {
          loading: "Editando post...",
          success: "Post editado!",
          error: (error) => ({
            message: `Error al crear post: ${error}`,
            duration: 10_000,
          }),
        })
        .unwrap();
      await queryClient.invalidateQueries(
        orpc.post.admin.getDashboardList.queryOptions()
      );
      navigate({ to: "/admin/posts" });
    },
  });

  const adsLinks = useStore(form.store, (state) => state.values.adsLinks);
  const premiumLinks = useStore(
    form.store,
    (state) => state.values.premiumLinks
  );

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
            <p className="text-red-300">
              Las imágenes no pueden ser editadas, para lograr esto deberás
              contactar con el administrador del sitio.
            </p>
          </section>
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
