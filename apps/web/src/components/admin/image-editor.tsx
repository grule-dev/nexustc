import { useDragAndDrop } from "@formkit/drag-and-drop/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ChangeEvent, useImperativeHandle, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertImage, getBucketUrl } from "@/lib/utils";

export type ImageItem =
  | { type: "existing"; key: string }
  | { type: "new"; file: File; previewUrl: string };

export type EditImagesPayload = {
  order: ({ type: "existing"; key: string } | { type: "new"; index: number })[];
  newFiles: File[];
};

export type ImageEditorRef = {
  getPayload: () => EditImagesPayload;
};

type ImageEditorProps = {
  initialImageKeys: string[];
  ref: React.Ref<ImageEditorRef>;
};

export function ImageEditor({ initialImageKeys, ref }: ImageEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialItems: ImageItem[] = initialImageKeys.map((key) => ({
    type: "existing",
    key,
  }));

  const [parentRef, items, setItems] = useDragAndDrop<
    HTMLDivElement,
    ImageItem
  >(initialItems, {
    draggingClass: "border-secondary",
    dropZoneClass: "border-secondary",
  });

  useImperativeHandle(ref, () => ({
    getPayload: () => {
      const newFiles: File[] = [];
      const newFileIndexMap = new Map<File, number>();

      for (const item of items) {
        if (item.type === "new" && !newFileIndexMap.has(item.file)) {
          newFileIndexMap.set(item.file, newFiles.length);
          newFiles.push(item.file);
        }
      }

      const order = items.map((item) => {
        if (item.type === "existing") {
          return { type: "existing" as const, key: item.key };
        }
        return {
          type: "new" as const,
          index: newFileIndexMap.get(item.file)!,
        };
      });

      return { order, newFiles };
    },
  }));

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return;
    }

    const files = Array.from(event.target.files).filter((f) =>
      f.type.startsWith("image/")
    );

    const converted = await Promise.all(
      files.map((file) => {
        if (file.type.startsWith("image/gif")) {
          return file;
        }
        return convertImage(file, "webp", 0.8);
      })
    );

    const newItems: ImageItem[] = converted.map((file) => ({
      type: "new" as const,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setItems((prev) => [...prev, ...newItems]);
    event.target.value = "";
  };

  const removeItem = (index: number) => {
    setItems((prev) => {
      const item = prev[index];
      if (item?.type === "new") {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const getImageSrc = (item: ImageItem): string => {
    if (item.type === "existing") {
      return getBucketUrl(item.key);
    }
    return item.previewUrl;
  };

  return (
    <section className="col-span-2 space-y-4">
      <Label>Imágenes</Label>

      {items.length > 0 && (
        <div
          className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6"
          ref={parentRef}
        >
          {items.map((item, index) => {
            const itemKey =
              item.type === "existing" ? item.key : item.previewUrl;
            return (
              <Card className="cursor-grab" data-label={itemKey} key={itemKey}>
                <CardHeader>
                  <CardTitle className="text-wrap text-sm">
                    {item.type === "existing"
                      ? `Imagen ${index + 1}`
                      : item.file.name}
                  </CardTitle>
                  <CardAction>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(index);
                      }}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} />
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <img
                    alt={`Imagen ${index + 1}`}
                    className="max-h-32 rounded object-contain"
                    src={getImageSrc(item)}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {items.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No hay imágenes. Agrega nuevas imágenes abajo.
        </p>
      )}

      <Input
        accept="image/*"
        className="w-full"
        multiple
        onChange={async (e) => {
          await toast.promise(handleFileChange(e), {
            loading: "Convirtiendo imágenes...",
            success: "Imágenes convertidas!",
            error: (error) => `Error al convertir imágenes: ${error}`,
          });
        }}
        ref={fileInputRef}
        type="file"
      />
    </section>
  );
}
