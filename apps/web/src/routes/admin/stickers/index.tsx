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

export const Route = createFileRoute("/admin/stickers/")({
  component: RouteComponent,
});

type Sticker = {
  id: string;
  name: string;
  displayName: string;
  type: string;
  assetKey: string;
  requiredTier: string;
  order: number;
  isActive: boolean;
};

const columns: ColumnDef<Sticker>[] = [
  {
    accessorKey: "assetKey",
    header: "Vista previa",
    cell: (info) => (
      <img
        alt={info.row.original.displayName}
        className="size-12 object-contain"
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
            to="/admin/stickers/$id/edit"
          >
            <Button variant="outline">Editar</Button>
          </Link>
          <Button
            onClick={async () => {
              const isConfirmed = await confirm({
                title: "Desactivar Sticker",
                description:
                  "¿Estás seguro de que quieres desactivar este sticker?",
                confirmText: "Desactivar",
                cancelText: "Cancelar",
              });

              if (isConfirmed) {
                await toast
                  .promise(
                    orpcClient.sticker.admin.delete(info.row.original.id),
                    {
                      loading: "Desactivando sticker...",
                      success: "Sticker desactivado.",
                      error: (error) => ({
                        message: `Error: ${error}`,
                        duration: 10_000,
                      }),
                    }
                  )
                  .unwrap();

                await queryClient.invalidateQueries(
                  orpc.sticker.admin.list.queryOptions()
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
  const { data } = useSuspenseQuery(orpc.sticker.admin.list.queryOptions());

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-3xl">Stickers</h1>
        <Link to="/admin/stickers/create">
          <Button>Crear Sticker</Button>
        </Link>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
