import { PATRON_TIER_KEYS, type PatronTier } from "@repo/shared/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppForm } from "@/hooks/use-app-form";
import { orpc, orpcClient } from "@/lib/orpc";
import { convertImage, uploadBlobWithProgress } from "@/lib/utils";

export const Route = createFileRoute("/admin/emojis/create")({
  component: RouteComponent,
});

const emojiCreateSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^\w[\w-]*$/),
  displayName: z.string().min(1).max(128),
  type: z.enum(["static", "animated"]),
  requiredTier: z.enum(PATRON_TIER_KEYS),
  order: z.number().int(),
  isActive: z.boolean(),
});

function RouteComponent() {
  const mutation = useMutation(orpc.emoji.admin.create.mutationOptions());
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const form = useAppForm({
    validators: { onSubmit: emojiCreateSchema },
    defaultValues: {
      name: "",
      displayName: "",
      type: "static" as "static" | "animated",
      requiredTier: "level1" as PatronTier,
      order: 0,
      isActive: true,
    },
    onSubmit: async (formData) => {
      if (!file) {
        toast.error("Debes seleccionar un archivo de imagen.");
        return;
      }

      const values = formData.value;
      const isAnimated = values.type === "animated";
      let uploadFile: File;

      if (isAnimated) {
        uploadFile = file;
      } else {
        uploadFile = await convertImage(file, "webp", 0.8);
      }

      const extension = isAnimated
        ? file.name.split(".").pop()?.toLowerCase() === "gif"
          ? "gif"
          : "webp"
        : "webp";
      const assetKey = `emojis/${values.name}.${extension}`;

      const { presignedUrl } = await orpcClient.emoji.admin.getUploadUrl({
        name: values.name,
        extension: extension as "webp" | "gif",
        contentLength: uploadFile.size,
      });

      await uploadBlobWithProgress(uploadFile, presignedUrl, () => undefined);

      await toast
        .promise(
          mutation.mutateAsync({
            ...values,
            assetKey,
            assetFormat: extension,
          }),
          {
            loading: "Creando emoji...",
            success: "Emoji creado!",
            error: (error) => ({
              message: `Error al crear emoji: ${error}`,
              duration: 10_000,
            }),
          }
        )
        .unwrap();
      await queryClient.invalidateQueries(orpc.emoji.admin.list.queryOptions());
      navigate({ to: "/admin/emojis" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      return;
    }
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreview(url);
  };

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
          <CardTitle>Crear Emoji</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <form.AppField name="name">
            {(field) => (
              <field.TextField
                label="Nombre (token)"
                placeholder="heart"
                required
              />
            )}
          </form.AppField>

          <form.AppField name="displayName">
            {(field) => (
              <field.TextField
                label="Nombre visible"
                placeholder="Corazón"
                required
              />
            )}
          </form.AppField>

          <form.AppField name="type">
            {(field) => (
              <field.SelectField
                label="Tipo"
                options={[
                  { value: "static", label: "Estático" },
                  { value: "animated", label: "Animado" },
                ]}
              />
            )}
          </form.AppField>

          <div className="col-span-2 flex flex-col gap-2">
            <label className="font-medium text-sm" htmlFor="emoji-file">
              Imagen *
            </label>
            <input
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              id="emoji-file"
              onChange={handleFileChange}
              required
              type="file"
            />
            {preview && (
              <div className="flex justify-center pt-2">
                <img
                  alt="Vista previa"
                  className="size-16 object-contain"
                  src={preview}
                />
              </div>
            )}
          </div>

          <form.AppField name="requiredTier">
            {(field) => (
              <field.SelectField
                label="Tier requerido"
                options={PATRON_TIER_KEYS.map((tier) => ({
                  value: tier,
                  label: tier,
                }))}
              />
            )}
          </form.AppField>

          <form.AppField name="order">
            {(field) => (
              <field.TextField label="Orden" placeholder="0" type="number" />
            )}
          </form.AppField>
        </CardContent>
        <CardFooter>
          <form.AppForm>
            <form.SubmitButton className="w-full">Crear</form.SubmitButton>
          </form.AppForm>
        </CardFooter>
      </Card>
    </form>
  );
}
