// Reference: https://codesandbox.io/p/sandbox/react-image-crop-demo-with-react-hooks-y831o

import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
  type PixelCrop,
} from "react-image-crop";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useDebounceEffect } from "@/hooks/use-debounce-effect";
import { authClient } from "@/lib/auth-client";
import { safeOrpc } from "@/lib/orpc";
import { uploadBlobWithProgress } from "@/lib/utils";
import "react-image-crop/dist/ReactCrop.css";

export function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
  scale = 1
) {
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  // devicePixelRatio slightly increases sharpness on retina devices
  // at the expense of slightly slower render times and needing to
  // size the image back down if you want to download/upload and be
  // true to the images natural size.
  const pixelRatio = window.devicePixelRatio;
  // const pixelRatio = 1

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();

  // 4) Move the crop origin to the canvas origin (0,0)
  ctx.translate(-cropX, -cropY);
  // 3) Move the origin to the center of the original position
  ctx.translate(centerX, centerY);
  // 2) Scale the image
  ctx.scale(scale, scale);
  // 1) Move the center of the image to the origin (0,0)
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight
  );

  ctx.restore();
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "px",
        width: mediaWidth,
        height: mediaHeight,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function AvatarSection() {
  const auth = authClient.useSession();
  const user = auth.data?.user;

  const navigate = useNavigate();

  const blobUrlRef = useRef("");
  const imgRef = useRef<HTMLImageElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [crop, setCrop] = useState<Crop>();
  const [imgSrc, setImgSrc] = useState("");
  const [progress, setProgress] = useState(0);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const avatarUploadUrlMutation = useMutation(
    safeOrpc.file.getAvatarUploadUrl.mutationOptions()
  );

  const uploadFileMutation = useMutation({
    mutationFn: async ({
      avatar,
      type,
    }: {
      avatar: Blob;
      type: "image/webp" | "image/gif";
    }) => {
      const [error, url] = await toast
        .promise(
          avatarUploadUrlMutation.mutateAsync({
            contentLength: avatar.size,
            contentType: type,
          }),
          {
            loading: "Subiendo avatar...",
          }
        )
        .unwrap();

      if (error) {
        toast.error(error.message);
        return;
      }

      await uploadBlobWithProgress(avatar, url, setProgress);
      await authClient.updateUser({
        image: user ? `avatar/${user.id}.webp?v=${Date.now()}` : null,
      });
      navigate({ to: "/profile", replace: true });
      setImgSrc("");
      formRef.current?.reset();
    },
    onSuccess: () => {
      toast.success("Avatar subido exitosamente!");
    },
    onError: (error) => {
      toast.error(
        `Error al subir el avatar: ${error instanceof Error ? error.message : "Error desconocido"}`
      );
    },
  });

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        if (e.target.files?.[0].type === "image/gif") {
          uploadFileMutation.mutate({
            avatar: e.target.files[0],
            type: "image/gif",
          });
        } else {
          setImgSrc(reader.result?.toString() || "");
        }
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }

  async function onDownloadCropClick() {
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!(image && previewCanvas && completedCrop)) {
      throw new Error("Crop canvas does not exist");
    }

    // This will size relative to the uploaded image
    // size. If you want to size according to what they
    // are looking at on screen, remove scaleX + scaleY
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const offscreen = new OffscreenCanvas(
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );
    const ctx = offscreen.getContext("2d");
    if (!ctx) {
      throw new Error("No 2d context");
    }

    ctx.drawImage(
      previewCanvas,
      0,
      0,
      previewCanvas.width,
      previewCanvas.height,
      0,
      0,
      offscreen.width,
      offscreen.height
    );

    const blob = await offscreen.convertToBlob({
      type: "image/webp",
      quality: 0.8,
    });

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    blobUrlRef.current = URL.createObjectURL(blob);

    uploadFileMutation.mutate({ avatar: blob, type: "image/webp" });
  }

  useDebounceEffect(
    () => {
      if (
        completedCrop?.width &&
        completedCrop?.height &&
        imgRef.current &&
        previewCanvasRef.current
      ) {
        // We use canvasPreview as it's much faster than imgPreview.
        canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop);
      }
    },
    100,
    [completedCrop]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label className="mt-4 mb-2 block font-medium">
          Subir nuevo avatar
        </Label>
        <form ref={formRef}>
          <Input accept="image/*" onChange={onSelectFile} type="file" />
        </form>
        <Progress className="h-2" value={progress} />
        <p className="text-muted-foreground text-sm">
          Ten en cuenta que solo puedes actualizar tu avatar cada cierto tiempo.
        </p>
      </div>
      <Dialog
        onOpenChange={(open) => {
          if (
            avatarUploadUrlMutation.isPending ||
            uploadFileMutation.isPending
          ) {
            return;
          }
          if (!open) {
            setImgSrc("");
            formRef.current?.reset();
            setProgress(0);
          }
        }}
        open={!!imgSrc}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recortar</DialogTitle>
          </DialogHeader>
          {!!imgSrc && (
            <ReactCrop
              aspect={1}
              circularCrop={true}
              crop={crop}
              minHeight={50}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
            >
              {/** biome-ignore lint/a11y/noNoninteractiveElementInteractions: necessary here */}
              <img
                alt="Recortar"
                className="size-full"
                onLoad={onImageLoad}
                ref={imgRef}
                src={imgSrc}
                style={{ transform: "scale(1)" }}
              />
            </ReactCrop>
          )}
          {!!completedCrop && (
            <canvas
              className="hidden"
              ref={previewCanvasRef}
              style={{
                border: "1px solid black",
                objectFit: "contain",
                width: completedCrop.width,
                height: completedCrop.height,
              }}
            />
          )}
          <Button
            disabled={
              !completedCrop ||
              avatarUploadUrlMutation.isPending ||
              uploadFileMutation.isPending
            }
            loading={
              uploadFileMutation.isPending || avatarUploadUrlMutation.isPending
            }
            onClick={onDownloadCropClick}
          >
            Subir
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
