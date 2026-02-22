import { useConfirm } from "@omit/react-confirm-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { BanUserDialog } from "./ban-user-dialog";
import { SetPasswordDialog } from "./set-password-dialog";
import { SetRoleDialog } from "./set-role-dialog";
import type { AdminUser } from "./types";

export function UserActionsDropdown({
  user,
  onRefresh,
}: {
  user: AdminUser;
  onRefresh: () => void;
}) {
  const confirm = useConfirm();
  const [roleOpen, setRoleOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const handleUnban = async () => {
    const confirmed = await confirm({
      title: "Desbanear Usuario",
      description: `¿Desbanear a ${user.name} (${user.email})?`,
      confirmText: "Desbanear",
      cancelText: "Cancelar",
    });

    if (confirmed) {
      await toast
        .promise(authClient.admin.unbanUser({ userId: user.id }), {
          loading: "Desbaneando usuario...",
          success: "Usuario desbaneado.",
          error: "Error al desbanear usuario.",
        })
        .unwrap();
      onRefresh();
    }
  };

  const handleRevokeSessions = async () => {
    const confirmed = await confirm({
      title: "Revocar Sesiones",
      description: `¿Revocar todas las sesiones de ${user.name}?`,
      confirmText: "Revocar",
      cancelText: "Cancelar",
    });

    if (confirmed) {
      await toast
        .promise(authClient.admin.revokeUserSessions({ userId: user.id }), {
          loading: "Revocando sesiones...",
          success: "Sesiones revocadas.",
          error: "Error al revocar sesiones.",
        })
        .unwrap();
    }
  };

  const handleImpersonate = async () => {
    const confirmed = await confirm({
      title: "Suplantar Usuario",
      description: `¿Suplantar a ${user.name} (${user.email})? Serás redirigido.`,
      confirmText: "Suplantar",
      cancelText: "Cancelar",
    });

    if (confirmed) {
      await toast
        .promise(authClient.admin.impersonateUser({ userId: user.id }), {
          loading: "Suplantando usuario...",
          success: "Suplantando usuario.",
          error: "Error al suplantar usuario.",
        })
        .unwrap();
      window.location.href = "/";
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Eliminar Usuario",
      description: `¿Estás seguro de que quieres eliminar a ${user.name} (${user.email})? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });

    if (confirmed) {
      await toast
        .promise(authClient.admin.removeUser({ userId: user.id }), {
          loading: "Eliminando usuario...",
          success: "Usuario eliminado.",
          error: "Error al eliminar usuario.",
        })
        .unwrap();
      onRefresh();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
          Acciones
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setRoleOpen(true)}>
            Cambiar Rol
          </DropdownMenuItem>
          {user.banned ? (
            <DropdownMenuItem onClick={handleUnban}>Desbanear</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setBanOpen(true)}>
              Banear
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setPasswordOpen(true)}>
            Cambiar Contraseña
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRevokeSessions}>
            Revocar Sesiones
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImpersonate}>
            Suplantar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete} variant="destructive">
            Eliminar Usuario
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SetRoleDialog
        onOpenChange={setRoleOpen}
        onSuccess={onRefresh}
        open={roleOpen}
        user={user}
      />
      <BanUserDialog
        onOpenChange={setBanOpen}
        onSuccess={onRefresh}
        open={banOpen}
        user={user}
      />
      <SetPasswordDialog
        onOpenChange={setPasswordOpen}
        onSuccess={onRefresh}
        open={passwordOpen}
        user={user}
      />
    </>
  );
}
