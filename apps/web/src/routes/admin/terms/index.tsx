import { TAXONOMY_DATA } from "@repo/shared/constants";
import { termUpdateSchema } from "@repo/shared/schemas";
import { useStore } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { TermBadge } from "@/components/term-badge";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { useAppForm } from "@/hooks/use-app-form";
import { orpc, queryClient } from "@/utils/orpc";

const query = orpc.term.getDashboardList.queryOptions();

export const Route = createFileRoute("/admin/terms/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data } = useSuspenseQuery(query);
  const [openEdit, setOpenEdit] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<(typeof data)[number]>();
  const deleteMutation = useMutation(orpc.term.delete.mutationOptions());
  const groupedTerms = useMemo(
    () => Object.groupBy(data, (item) => item.taxonomy),
    [data]
  );

  const onDelete = useCallback(async () => {
    if (!selectedTerm) {
      return;
    }
    try {
      toast.loading("Eliminando", { id: "deleting" });
      await deleteMutation.mutateAsync({ id: selectedTerm.id });
      await queryClient.refetchQueries(query);
      toast.dismiss("deleting");
      toast.success("Eliminado");
      setSelectedTerm(undefined);
    } catch (_) {
      toast.error("Error al eliminar");
    } finally {
      toast.dismiss("deleting");
      setOpenAlert(false);
    }
  }, [deleteMutation, selectedTerm]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-3xl">Términos</h1>
      {Object.entries(groupedTerms).map(([taxonomy, terms]) => {
        const taxonomyData =
          TAXONOMY_DATA[taxonomy as keyof typeof TAXONOMY_DATA];
        return (
          <Card key={taxonomy}>
            <CardHeader>
              <CardTitle>
                {taxonomyData.label}
                <span className="text-muted-foreground text-sm">
                  {taxonomyData.mode === "single" ? " (Único)" : " (Múltiple)"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-wrap gap-2">
                {terms.map((term) => (
                  <button
                    className="cursor-pointer"
                    key={term.id}
                    onClick={() => {
                      setOpenEdit(true);
                      setSelectedTerm(term);
                    }}
                    type="button"
                  >
                    <TermBadge tag={term} />
                  </button>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}

      {!!selectedTerm && (
        <EditDialog
          key={selectedTerm.id}
          open={openEdit}
          setOpen={setOpenEdit}
          setOpenAlert={setOpenAlert}
          term={selectedTerm}
        />
      )}

      <DeleteDialog
        onDelete={onDelete}
        open={openAlert}
        setOpen={setOpenAlert}
      />
    </div>
  );
}

function EditDialog({
  open,
  setOpen,
  term,
  setOpenAlert,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  term: {
    id: string;
    name: string;
    color: string | null;
  };
  setOpenAlert: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const mutation = useMutation(orpc.term.edit.mutationOptions());
  const colors: string[] = term.color ? term.color.split(",") : [];
  const form = useAppForm({
    validators: {
      onSubmit: termUpdateSchema,
    },
    defaultValues: {
      id: term.id,
      name: term.name,
      color1: colors[0] || "",
      color2: colors[1] || "",
      textColor: colors[2]?.replace("@", "") || "",
    },
    onSubmit: async ({ value: { id, name, color1, color2, textColor } }) => {
      const newColors: string[] = [];

      if (color1) {
        newColors.push(color1);
      }
      if (color2) {
        newColors.push(color2);
      }
      if (textColor) {
        newColors.push(`@${textColor}`);
      }

      try {
        toast.loading("Editando...", { id: "submitting" });
        await mutation.mutateAsync({ id, name, color: newColors.join(",") });
        await queryClient.refetchQueries(query);
        toast.dismiss("submitting");
        toast.success("Editado!");
        form.resetField("name");
      } catch (error) {
        toast.error(`Error al editar: ${error}`);
      } finally {
        toast.dismiss("submitting");
        setOpen(false);
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
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Término</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="flex flex-col gap-4">
            <div className="w-full">
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
            </div>

            <div className="flex w-full flex-row items-end gap-4">
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
          </div>
          <div className="flex flex-row gap-4">
            <form.AppForm>
              <form.SubmitButton className="flex-1">Editar</form.SubmitButton>
              <Button
                className="flex-1"
                loading={mutation.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenAlert(true);
                }}
                type="button"
                variant="destructive"
              >
                Eliminar
              </Button>
            </form.AppForm>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  open,
  setOpen,
  onDelete,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onDelete: () => void;
}) {
  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Ten en cuenta que un término que
            aún tenga posts asociados no se puede eliminar hasta que se remueva
            manualmente de cada uno.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete}>Continuar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
