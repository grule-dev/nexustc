import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import * as z from "zod";
import { TutorialCard } from "@/components/landing/tutorial-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppForm } from "@/hooks/use-app-form";
import { orpc, orpcClient } from "@/lib/orpc";

const query = orpc.extras.getTutorials.queryOptions();

export const Route = createFileRoute("/admin/extras/tutorials")({
  component: RouteComponent,
  loader: () => orpcClient.extras.getTutorials(),
});

function RouteComponent() {
  const { data: tutorials } = useSuspenseQuery(query);
  const queryClient = useQueryClient();

  const form = useAppForm({
    validators: {
      onSubmit: z.object({
        title: z.string(),
        description: z.string(),
        embedUrl: z.url(),
      }),
    },
    defaultValues: {
      title: "",
      description: "",
      embedUrl: "",
    },
    onSubmit: async ({ value }) => {
      await orpcClient.extras.createTutorial(value);
      await queryClient.invalidateQueries(query);
      form.reset();
    },
  });

  return (
    <main className="flex h-[90dvh] max-h-screen w-full flex-col items-center gap-6 overflow-hidden p-6">
      <form
        className="flex h-full w-xl flex-1 flex-col justify-center gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <h1 className="font-bold text-2xl">Tutoriales</h1>
        <div className="space-y-4">
          <form.AppField name="title">
            {(field) => (
              <field.TextField label="Título" placeholder="Título" required />
            )}
          </form.AppField>
          <form.AppField name="embedUrl">
            {(field) => (
              <field.TextField
                label="URL Embed"
                placeholder="URL Embed"
                required
              />
            )}
          </form.AppField>
          <form.AppField name="description">
            {(field) => (
              <field.TextareaField
                label="Descripción"
                placeholder="Descripción"
                required
              />
            )}
          </form.AppField>
        </div>
        <div>
          <form.AppForm>
            <form.SubmitButton className="flex-1">Crear</form.SubmitButton>
          </form.AppForm>
        </div>
      </form>
      <ScrollArea className="h-[100px] flex-1">
        <section className="grid grid-cols-3 gap-6">
          {tutorials.map((tutorial) => (
            <TutorialCard key={tutorial.id} tutorial={tutorial} />
          ))}
        </section>
      </ScrollArea>
    </main>
  );
}
