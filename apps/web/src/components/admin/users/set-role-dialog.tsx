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
import type { AdminUser } from "./types";

const roleOptions = [
  { value: "user", label: ROLE_LABELS.user },
  { value: "uploader", label: ROLE_LABELS.uploader },
  { value: "moderator", label: ROLE_LABELS.moderator },
  { value: "admin", label: ROLE_LABELS.admin },
  { value: "owner", label: ROLE_LABELS.owner },
];

export function SetRoleDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const form = useAppForm({
    defaultValues: {
      role: user.role as Role,
    },
    onSubmit: async ({ value }) => {
      await toast
        .promise(
          authClient.admin.setRole({
            userId: user.id,
            role: value.role as Role,
          }),
          {
            loading: "Cambiando rol...",
            success: "Rol actualizado.",
            error: "Error al cambiar rol.",
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
          <DialogTitle>Cambiar Rol</DialogTitle>
          <DialogDescription>
            Cambiar rol de {user.name} ({user.email})
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="space-y-4">
            <form.AppField name="role">
              {(field) => (
                <field.SelectField label="Rol" options={roleOptions} />
              )}
            </form.AppField>
            <form.AppForm>
              <form.SubmitButton className="w-full">Guardar</form.SubmitButton>
            </form.AppForm>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
