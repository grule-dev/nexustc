import type { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { AdminUser } from "./types";
import { UserActionsDropdown } from "./user-actions-dropdown";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const roleBadgeVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  owner: "default",
  admin: "default",
  moderator: "secondary",
  uploader: "secondary",
  user: "outline",
};

export function getColumns(onRefresh: () => void): ColumnDef<AdminUser>[] {
  return [
    {
      accessorKey: "name",
      header: "Usuario",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              {user.image && <AvatarImage src={user.image} />}
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{user.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span>{row.original.email}</span>
          {row.original.emailVerified && (
            <Badge variant="outline">Verificado</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ row }) => (
        <Badge variant={roleBadgeVariant[row.original.role] ?? "outline"}>
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: "banned",
      header: "Estado",
      cell: ({ row }) =>
        row.original.banned ? (
          <Badge variant="destructive">Baneado</Badge>
        ) : (
          <Badge variant="outline">Activo</Badge>
        ),
    },
    {
      accessorKey: "createdAt",
      header: "Registro",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("es-ES"),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <UserActionsDropdown onRefresh={onRefresh} user={row.original} />
      ),
    },
  ];
}
