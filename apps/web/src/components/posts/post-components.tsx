import {
  Calendar03Icon,
  Download04Icon,
  HeartCheckIcon,
  Image02Icon,
  InformationCircleIcon,
  Link01Icon,
  Share08Icon,
  StarIcon,
  Tag01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";
import { TermBadge } from "@/components/term-badge";
import type { PostType } from "@/lib/types";
import { cn, getBucketUrl } from "@/lib/utils";
import { Markdown } from "../markdown";
import { RatingDisplay } from "../ratings";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ImageGallery } from "../ui/image-gallery";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { BookmarkButton } from "./bookmark-button";

export type PostProps = Omit<
  PostType,
  "likes" | "favorites" | "isWeekly" | "type" | "status"
> & {
  averageRating?: number;
  ratingCount?: number;
};

export function PostHero({ post }: { post: PostProps }) {
  const mainImage = post.imageObjectKeys?.[0];

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Main Image with Gradient Overlay */}
      {mainImage && (
        <div className="relative">
          <div className="aspect-video w-full overflow-hidden md:aspect-21/9">
            <img
              alt={`Portada de ${post.title}`}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              src={getBucketUrl(mainImage)}
            />
          </div>
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

          {/* Content overlay */}
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
            <div className="flex flex-col gap-4">
              {/* Title and Version */}
              <div className="flex flex-wrap items-end gap-3">
                <h1 className="font-bold text-3xl text-white drop-shadow-lg md:text-5xl">
                  {post.title}
                </h1>
                {post.version && (
                  <Badge
                    className="mb-1 border-white/30 bg-white/20 text-white backdrop-blur-sm md:mb-2"
                    variant="outline"
                  >
                    v{post.version}
                  </Badge>
                )}
              </div>

              {/* Meta Row */}
              <div className="flex flex-wrap items-center gap-4">
                <MetaBadge icon={Calendar03Icon}>
                  {format(post.createdAt, "d 'de' MMMM, yyyy", {
                    locale: es,
                  })}
                </MetaBadge>

                {post.ratingCount !== undefined && post.ratingCount > 0 && (
                  <div className="flex items-center gap-1.5 text-white">
                    <HugeiconsIcon
                      className="size-4 fill-amber-400 text-amber-400"
                      icon={StarIcon}
                    />
                    <span className="font-semibold">
                      {post.averageRating?.toFixed(1)}
                    </span>
                    <span className="text-white/70">
                      ({post.ratingCount} votos)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fallback when no image */}
      {!mainImage && (
        <div className="flex flex-col gap-4 bg-linear-to-br from-primary/20 via-primary/10 to-transparent p-8 md:p-12">
          <div className="flex flex-wrap items-end gap-3">
            <h1 className="font-bold text-3xl md:text-5xl">{post.title}</h1>
            {post.version && (
              <Badge className="mb-1 md:mb-2" variant="secondary">
                v{post.version}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Badge className="gap-1.5" variant="secondary">
              <HugeiconsIcon className="size-3.5" icon={Calendar03Icon} />
              {format(post.createdAt, "d 'de' MMMM, yyyy", { locale: es })}
            </Badge>
            {post.ratingCount !== undefined && post.ratingCount > 0 && (
              <RatingDisplay
                averageRating={post.averageRating ?? 0}
                ratingCount={post.ratingCount}
                variant="compact"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function PostActionBar({ post }: { post: PostProps }) {
  const allImages = post.imageObjectKeys ?? [];
  const hasImages = allImages.length > 0;
  const hasTags = post.terms.length > 0;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Enlace copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <BookmarkButton postId={post.id} />
        <Button
          nativeButton={false}
          render={<Link params={{ id: post.id }} to={"/post/reviews/$id"} />}
          size="sm"
          variant="outline"
        >
          <HugeiconsIcon className="size-4" icon={StarIcon} />
          Valoraciones
        </Button>
        <Tooltip>
          <TooltipTrigger
            onClick={handleShare}
            render={
              <Button size="sm" variant="outline">
                <HugeiconsIcon className="size-4" icon={Share08Icon} />
                Compartir
              </Button>
            }
          />
          <TooltipContent>Copiar enlace al portapapeles</TooltipContent>
        </Tooltip>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center gap-4 text-muted-foreground text-sm">
        {hasImages && (
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon className="size-4" icon={Image02Icon} />
            {allImages.length} {allImages.length === 1 ? "imagen" : "imágenes"}
          </span>
        )}
        {hasTags && (
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon className="size-4" icon={Tag01Icon} />
            {post.terms.length} tags
          </span>
        )}
      </div>
    </div>
  );
}

export function PostContent({ post }: { post: PostProps }) {
  const groupedTerms = Object.groupBy(post.terms, (term) => term.taxonomy);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const allImages = post.imageObjectKeys ?? [];
  const galleryImages = allImages.map((key, index) => ({
    src: getBucketUrl(key),
    alt: `${post.title} - Imagen ${index + 1}`,
  }));

  const hasContent = post.content !== "";
  const hasAuthorContent = !!post.authorContent;
  const hasDownloadLinks = !!post.adsLinks;
  const hasImages = (post.imageObjectKeys?.length ?? 0) > 0;
  const hasTags = post.terms.length > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left Column - Main Content */}
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Tabs className="w-full" defaultValue="info">
          <TabsList className="w-full justify-start">
            <TabsTrigger className="gap-2" value="info">
              <HugeiconsIcon className="size-4" icon={InformationCircleIcon} />
              Información
            </TabsTrigger>
            {hasImages && (
              <TabsTrigger className="gap-2" value="gallery">
                <HugeiconsIcon className="size-4" icon={Image02Icon} />
                Galería
              </TabsTrigger>
            )}
            {hasDownloadLinks && (
              <TabsTrigger className="gap-2" value="downloads">
                <HugeiconsIcon className="size-4" icon={Download04Icon} />
                Descargas
              </TabsTrigger>
            )}
          </TabsList>

          {/* Info Tab */}
          <TabsContent className="mt-6" value="info">
            <div className="flex flex-col gap-6">
              {/* Synopsis */}
              {hasContent && (
                <ContentCard icon={InformationCircleIcon} title="Sinopsis">
                  <Markdown>{post.content}</Markdown>
                </ContentCard>
              )}

              {/* Author Support */}
              {hasAuthorContent && (
                <ContentCard icon={HeartCheckIcon} title="Apoya al Creador">
                  <Markdown>{post.authorContent}</Markdown>
                </ContentCard>
              )}

              {/* No content fallback */}
              {!(hasContent || hasAuthorContent) && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed bg-muted/30 py-16">
                  <div className="rounded-full bg-muted p-4">
                    <HugeiconsIcon
                      className="size-8 text-muted-foreground"
                      icon={InformationCircleIcon}
                    />
                  </div>
                  <p className="text-muted-foreground">
                    No hay información adicional disponible
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Gallery Tab */}
          {hasImages && (
            <TabsContent className="mt-6" value="gallery">
              <div className="flex flex-col gap-6">
                {/* Main Selected Image */}
                <button
                  className="group relative cursor-zoom-in overflow-hidden rounded-2xl border bg-black/5"
                  onClick={() => setGalleryOpen(true)}
                  type="button"
                >
                  <img
                    alt={`${post.title} - Imagen ${selectedImageIndex + 1}`}
                    className="aspect-video w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    src={getBucketUrl(allImages[selectedImageIndex])}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                    <span className="rounded-full bg-black/50 px-4 py-2 font-medium text-sm text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      Click para ampliar
                    </span>
                  </div>
                </button>

                {/* Thumbnail Grid */}
                {allImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-3 md:grid-cols-6 lg:grid-cols-5">
                    {allImages.map((image, index) => (
                      <button
                        className={cn(
                          "group relative aspect-video overflow-hidden rounded-xl border-2 transition-all",
                          selectedImageIndex === index
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-transparent hover:border-primary/50"
                        )}
                        key={image}
                        onClick={() => setSelectedImageIndex(index)}
                        type="button"
                      >
                        <img
                          alt={`Miniatura ${index + 1}`}
                          className="h-full w-full object-cover transition-transform group-hover:scale-110"
                          src={getBucketUrl(image)}
                        />
                        {selectedImageIndex === index && (
                          <div className="absolute inset-0 bg-primary/10" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Image Gallery Modal */}
                <ImageGallery
                  images={galleryImages}
                  initialIndex={selectedImageIndex}
                  onOpenChange={setGalleryOpen}
                  open={galleryOpen}
                />
              </div>
            </TabsContent>
          )}

          {/* Downloads Tab */}
          {hasDownloadLinks && (
            <TabsContent className="mt-6" value="downloads">
              <ContentCard icon={Link01Icon} title="Enlaces de Descarga">
                <Markdown>{post.adsLinks ?? ""}</Markdown>
              </ContentCard>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Right Column - Sidebar */}
      <div className="flex flex-col gap-6">
        {/* Tags Section */}
        {hasTags && (
          <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
            <h3 className="flex items-center gap-2 font-semibold text-lg">
              <HugeiconsIcon className="size-5" icon={Tag01Icon} />
              Etiquetas
            </h3>

            <div className="flex flex-col gap-4">
              {/* Main Tags */}
              {groupedTerms.tag && groupedTerms.tag.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {groupedTerms.tag.map((term) => (
                    <TermBadge key={term.id} tag={term} />
                  ))}
                </div>
              )}

              <Separator />

              {/* Categorized Tags */}
              <div className="flex flex-col gap-3">
                <TagCategory
                  label="Plataformas"
                  terms={groupedTerms.platform}
                />
                <TagCategory label="Idiomas" terms={groupedTerms.language} />
                <TagCategory label="Motor" terms={groupedTerms.engine} />
                <TagCategory label="Gráficos" terms={groupedTerms.graphics} />
                <TagCategory label="Censura" terms={groupedTerms.censorship} />
                <TagCategory label="Estado" terms={groupedTerms.status} />
              </div>
            </div>
          </div>
        )}

        {/* Quick Info Card */}
        <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
          <h3 className="flex items-center gap-2 font-semibold text-lg">
            <HugeiconsIcon className="size-5" icon={InformationCircleIcon} />
            Información Rápida
          </h3>

          <div className="flex flex-col gap-3">
            <InfoRow label="Publicado">
              {format(post.createdAt, "d MMM yyyy", { locale: es })}
            </InfoRow>

            {post.version && <InfoRow label="Versión">{post.version}</InfoRow>}

            {post.ratingCount !== undefined && post.ratingCount > 0 && (
              <InfoRow label="Valoración">
                <div className="flex items-center gap-1.5">
                  <HugeiconsIcon
                    className="size-4 fill-amber-400 text-amber-400"
                    icon={StarIcon}
                  />
                  <span className="font-medium">
                    {post.averageRating?.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">
                    ({post.ratingCount})
                  </span>
                </div>
              </InfoRow>
            )}

            {hasImages && (
              <InfoRow label="Imágenes">{allImages.length}</InfoRow>
            )}
          </div>
        </div>

        {/* Author Support Sidebar Card (if exists) */}
        {hasAuthorContent && (
          <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-linear-to-br from-primary/5 to-transparent p-5">
            <h3 className="flex items-center gap-2 font-semibold text-lg">
              <HugeiconsIcon
                className="size-5 text-primary"
                icon={HeartCheckIcon}
              />
              Apoya al Creador
            </h3>
            <p className="text-muted-foreground text-sm">
              Este juego fue creado por desarrolladores independientes.
              Considera apoyarlos directamente.
            </p>
            <Button className="w-full gap-2" size="sm" variant="outline">
              <HugeiconsIcon className="size-4" icon={UserIcon} />
              Ver más información
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   Helper Components
   ============================================================================ */

function MetaBadge({
  icon,
  children,
}: {
  icon: IconSvgElement;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5 text-sm text-white/90">
      <HugeiconsIcon className="size-4" icon={icon} />
      {children}
    </span>
  );
}

function ContentCard({
  icon,
  title,
  children,
}: {
  icon: IconSvgElement;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
      <h2 className="flex items-center gap-2 font-bold text-xl">
        <HugeiconsIcon className="size-5 text-primary" icon={icon} />
        {title}
      </h2>
      <div>{children}</div>
    </div>
  );
}

function TagCategory({
  label,
  terms,
}: {
  label: string;
  terms:
    | { id: string; name: string; color: string | null | undefined }[]
    | undefined;
}) {
  if (!terms || terms.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {terms.map((term) => (
          <TermBadge className="text-xs" key={term.id} tag={term} />
        ))}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}
