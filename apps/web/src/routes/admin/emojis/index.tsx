import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useConfirm } from "@omit/react-confirm-dialog";
import { PATRON_TIERS, type PatronTier } from "@repo/shared/constants";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { orpc, orpcClient } from "@/lib/orpc";
import { getBucketUrl } from "@/lib/utils";

export const Route = createFileRoute("/admin/emojis/")({
  component: RouteComponent,
});

type Emoji = {
  id: string;
  name: string;
  displayName: string;
  type: string;
  assetKey: string;
  requiredTier: string;
  order: number;
  isActive: boolean;
};

const columns: ColumnDef<Emoji>[] = [
  {
    accessorKey: "assetKey",
    header: "Vista previa",
    cell: (info) => (
      <img
        alt={info.row.original.displayName}
        className="size-8"
        src={getBucketUrl(info.row.original.assetKey)}
      />
    ),
  },
  { accessorKey: "name", header: "Nombre" },
  { accessorKey: "displayName", header: "Nombre visible" },
  { accessorKey: "type", header: "Tipo" },
  {
    accessorKey: "requiredTier",
    header: "Tier",
    cell: (info) => {
      const tier = info.row.original.requiredTier as PatronTier;
      return PATRON_TIERS[tier]?.badge ?? tier;
    },
  },
  { accessorKey: "order", header: "Orden" },
  {
    accessorKey: "isActive",
    header: "Activo",
    cell: (info) => (info.row.original.isActive ? "Sí" : "No"),
  },
  {
    header: "Acciones",
    cell: (info) => {
      const confirm = useConfirm();
      const queryClient = useQueryClient();

      return (
        <div className="flex items-center gap-2">
          <Link
            params={{ id: info.row.original.id }}
            to="/admin/emojis/$id/edit"
          >
            <Button variant="outline">Editar</Button>
          </Link>
          <Button
            onClick={async () => {
              const isConfirmed = await confirm({
                title: "Desactivar Emoji",
                description:
                  "¿Estás seguro de que quieres desactivar este emoji?",
                confirmText: "Desactivar",
                cancelText: "Cancelar",
              });

              if (isConfirmed) {
                await toast
                  .promise(
                    orpcClient.emoji.admin.delete(info.row.original.id),
                    {
                      loading: "Desactivando emoji...",
                      success: "Emoji desactivado.",
                      error: (error) => ({
                        message: `Error: ${error}`,
                        duration: 10_000,
                      }),
                    }
                  )
                  .unwrap();

                await queryClient.invalidateQueries(
                  orpc.emoji.admin.list.queryOptions()
                );
              }
            }}
            size="icon"
            variant="destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} />
          </Button>
        </div>
      );
    },
  },
];

function RouteComponent() {
  const { data } = useSuspenseQuery(orpc.emoji.admin.list.queryOptions());

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-3xl">Emojis</h1>
        <Link to="/admin/emojis/create">
          <Button>Crear Emoji</Button>
        </Link>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
