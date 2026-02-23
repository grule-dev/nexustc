import { ROLE_LABELS } from "@repo/shared/constants";
import type { Role } from "@repo/shared/permissions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppForm } from "@/hooks/use-app-form";
import { authClient } from "@/lib/auth-client";

const roleOptions = [
  { value: "user", label: ROLE_LABELS.user },
  { value: "uploader", label: ROLE_LABELS.uploader },
  { value: "moderator", label: ROLE_LABELS.moderator },
  { value: "admin", label: ROLE_LABELS.admin },
  { value: "owner", label: ROLE_LABELS.owner },
];

export function CreateUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const form = useAppForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "user" as Role,
    },
    onSubmit: async ({ value }) => {
      await toast
        .promise(
          authClient.admin.createUser({
            name: value.name,
            email: value.email,
            password: value.password,
            role: value.role as Role,
          }),
          {
            loading: "Creando usuario...",
            success: "Usuario creado.",
            error: "Error al crear usuario.",
          }
        )
        .unwrap();

      onOpenChange(false);
      onSuccess();
    },
  });

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Usuario</DialogTitle>
          <DialogDescription>
            Crear un nuevo usuario en la plataforma
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="space-y-4">
            <form.AppField name="name">
              {(field) => <field.TextField label="Nombre" required />}
            </form.AppField>
            <form.AppField name="email">
              {(field) => (
                <field.TextField label="Email" required type="email" />
              )}
            </form.AppField>
            <form.AppField name="password">
              {(field) => (
                <field.TextField label="Contraseña" required type="password" />
              )}
            </form.AppField>
            <form.AppField name="role">
              {(field) => (
                <field.SelectField label="Rol" options={roleOptions} />
              )}
            </form.AppField>
            <form.AppForm>
              <form.SubmitButton className="w-full">
                Crear Usuario
              </form.SubmitButton>
            </form.AppForm>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
