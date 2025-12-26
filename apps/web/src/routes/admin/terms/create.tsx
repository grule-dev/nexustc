import { type TAXONOMIES, TAXONOMY_DATA } from "@repo/shared/constants";
import { termCreateSchema } from "@repo/shared/schemas";
import { useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { useAppForm } from "@/hooks/use-app-form";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/terms/create")({
  component: RouteComponent,
});

function RouteComponent() {
  const mutation = useMutation(orpc.term.create.mutationOptions());
  const form = useAppForm({
    validators: {
      onSubmit: termCreateSchema,
    },
    defaultValues: {
      name: "",
      color1: "#000000",
      color2: "",
      textColor: "",
      taxonomy: "" as (typeof TAXONOMIES)[number],
    },
    onSubmit: async ({
      value: { name, color1, color2, textColor, taxonomy },
    }) => {
      const colors: string[] = [];

      if (color1) {
        colors.push(color1);
      }
      if (color2) {
        colors.push(color2);
      }
      if (textColor) {
        colors.push(`@${textColor}`);
      }

      try {
        toast.loading("Creando...", { id: "submitting" });
        await mutation.mutateAsync({ name, color: colors.join(","), taxonomy });
        toast.dismiss("submitting");
        toast.success("Creado!");
        form.resetField("name");
      } catch (error) {
        toast.error(`Error al crear: ${error}`);
      } finally {
        toast.dismiss("submitting");
      }
    },
  });

  const values = useStore(form.store, (state) => ({
    name: state.values.name,
    color1: state.values.color1,
    color2: state.values.color2,
    textColor: state.values.textColor,
  }));

  return (
    <form
      className="flex h-full items-center justify-center"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Crear Término</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-row gap-4">
            <form.AppField name="name">
              {(field) => (
                <field.TextField
                  className="grow"
                  label="Nombre"
                  placeholder="Nombre"
                  required
                />
              )}
            </form.AppField>
            <form.AppField name="color1">
              {(field) => (
                <field.TextField
                  className="cursor-pointer p-0"
                  label="Color 1"
                  placeholder="Color 1"
                  style={{
                    backgroundColor: field.state.value ?? "transparent",
                  }}
                  type="color"
                />
              )}
            </form.AppField>
            <form.AppField name="color2">
              {(field) => (
                <field.TextField
                  className="cursor-pointer p-0"
                  label="Color 2"
                  placeholder="Color 2"
                  style={{
                    backgroundColor: field.state.value ?? "transparent",
                  }}
                  type="color"
                />
              )}
            </form.AppField>
            <form.AppField name="textColor">
              {(field) => (
                <field.TextField
                  className="cursor-pointer p-0"
                  label="Color Texto"
                  placeholder="Color Texto"
                  style={{
                    backgroundColor: field.state.value ?? "transparent",
                  }}
                  type="color"
                />
              )}
            </form.AppField>
            <Button
              className="self-end"
              onClick={() => {
                form.setFieldValue("color1", "");
                form.setFieldValue("color2", "");
                form.setFieldValue("textColor", "");
              }}
              type="button"
              variant="destructive"
            >
              <XIcon />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <form.AppField name="taxonomy">
              {(field) => (
                <field.SelectField
                  label="Taxonomía"
                  options={Object.entries(TAXONOMY_DATA).map(
                    ([key, value]) => ({
                      value: key,
                      label: value.label,
                    })
                  )}
                  required
                />
              )}
            </form.AppField>
            <Field className="w-fit gap-3">
              <Label>Preview</Label>
              <span
                className="inline-flex w-fit items-center rounded-full border p-2 px-2 py-0.5 font-semibold text-sm tracking-wide"
                style={{
                  color: values.textColor,
                  border: `2px solid ${values.textColor}`,
                  background: `linear-gradient(to right, ${values.color1}, ${values.color2})`,
                }}
              >
                {values.name}
              </span>
            </Field>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <form.AppForm>
            <form.SubmitButton className="w-full">Crear</form.SubmitButton>
          </form.AppForm>
        </CardFooter>
      </Card>
    </form>
  );
}
