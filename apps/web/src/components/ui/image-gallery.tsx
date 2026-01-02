"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  Download04Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ImageGalleryProps = {
  images: { src: string; alt: string }[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ImageGallery({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Reset to initial index when gallery opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setIsImageLoading(true);
    }
  }, [open, initialIndex]);

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  const goToPrevious = useCallback(() => {
    setIsImageLoading(true);
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setIsImageLoading(true);
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handleDownload = () => {
    // Open image in new tab - browser will handle download natively
    // This avoids CORS issues that occur with fetch()
    window.open(currentImage.src, "_blank");
  };

  // Keyboard navigation
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, goToPrevious, goToNext]);

  if (images.length === 0) {
    return null;
  }

  return (
    <DialogPrimitive.Root onOpenChange={onOpenChange} open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 z-50 bg-black/90 duration-200 data-closed:animate-out data-open:animate-in"
          data-slot="gallery-overlay"
        />
        <DialogPrimitive.Popup
          className="data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 z-50 flex flex-col duration-200 data-closed:animate-out data-open:animate-in"
          data-slot="gallery-content"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
                {currentIndex + 1} / {images.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={handleDownload}
                size="sm"
                variant="ghost"
              >
                <HugeiconsIcon className="size-4" icon={Download04Icon} />
                Descargar
              </Button>
              <DialogPrimitive.Close
                render={
                  <Button
                    className="text-white hover:bg-white/10 hover:text-white"
                    size="icon-sm"
                    variant="ghost"
                  />
                }
              >
                <HugeiconsIcon className="size-5" icon={Cancel01Icon} />
                <span className="sr-only">Cerrar</span>
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* Main Image Area */}
          <div className="relative flex flex-1 items-center justify-center px-4">
            {/* Previous Button */}
            {hasMultipleImages && (
              <button
                className="absolute left-4 z-10 flex size-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20 md:left-8 md:size-14"
                onClick={goToPrevious}
                type="button"
              >
                <HugeiconsIcon
                  className="size-6 md:size-7"
                  icon={ArrowLeft01Icon}
                />
              </button>
            )}

            {/* Image Container */}
            <div className="relative flex max-h-[calc(100vh-200px)] w-full items-center justify-center">
              {isImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="size-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                </div>
              )}
              {/** biome-ignore lint/a11y/noNoninteractiveElementInteractions: we need this here */}
              <img
                alt={currentImage.alt}
                className={cn(
                  "max-h-[calc(100vh-200px)] max-w-full rounded-lg object-contain transition-opacity duration-300",
                  isImageLoading ? "opacity-0" : "opacity-100"
                )}
                onLoad={() => setIsImageLoading(false)}
                src={currentImage.src}
              />
            </div>

            {/* Next Button */}
            {hasMultipleImages && (
              <button
                className="absolute right-4 z-10 flex size-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20 md:right-8 md:size-14"
                onClick={goToNext}
                type="button"
              >
                <HugeiconsIcon
                  className="size-6 md:size-7"
                  icon={ArrowRight01Icon}
                />
              </button>
            )}
          </div>

          {/* Thumbnail Carousel */}
          {hasMultipleImages && (
            <div className="p-4">
              <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 overflow-x-auto rounded-2xl bg-white/5 p-3 backdrop-blur-sm">
                {images.map((image, index) => (
                  <button
                    className={cn(
                      "relative aspect-video h-16 shrink-0 overflow-hidden rounded-lg transition-all md:h-20",
                      currentIndex === index
                        ? "ring-2 ring-white ring-offset-2 ring-offset-black/50"
                        : "opacity-50 hover:opacity-80"
                    )}
                    key={image.src}
                    onClick={() => {
                      setIsImageLoading(true);
                      setCurrentIndex(index);
                    }}
                    type="button"
                  >
                    <img
                      alt={`Miniatura ${index + 1}`}
                      className="h-full w-full object-cover"
                      src={image.src}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

type ImageGalleryTriggerProps = {
  children: React.ReactNode;
  images: { src: string; alt: string }[];
  initialIndex?: number;
  className?: string;
};

export function ImageGalleryTrigger({
  children,
  images,
  initialIndex = 0,
  className,
}: ImageGalleryTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={cn("cursor-zoom-in", className)}
        onClick={() => setOpen(true)}
        type="button"
      >
        {children}
      </button>
      <ImageGallery
        images={images}
        initialIndex={initialIndex}
        onOpenChange={setOpen}
        open={open}
      />
    </>
  );
}
