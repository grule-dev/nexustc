import {
  Calendar03Icon,
  Download04Icon,
  FavouriteCircleIcon,
  InformationCircleIcon,
  Link01Icon,
  Share08Icon,
  StarIcon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import AutoScroll from "embla-carousel-auto-scroll";
import { useState } from "react";
import { toast } from "sonner";
import { TermBadge } from "@/components/term-badge";
import type { PostType } from "@/lib/types";
import { getBucketUrl } from "@/lib/utils";
import { Markdown } from "../markdown";
import { RatingDisplay } from "../ratings";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Carousel, CarouselContent, CarouselItem } from "../ui/carousel";
import { ImageViewer } from "../ui/image-viewer";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { BookmarkButton } from "./bookmark-button";
import { LikeButton } from "./like-button";

export type PostProps = Omit<
  PostType,
  "likes" | "favorites" | "isWeekly" | "type" | "status"
> & {
  averageRating?: number;
  ratingCount?: number;
};

export function PostPage({ post }: { post: PostProps }) {
  return (
    <div className="flex flex-col gap-4">
      <PostHero post={post} />
      <PostContent post={post} />
    </div>
  );
}

export function PostHero({ post }: { post: PostProps }) {
  const mainImage = post.imageObjectKeys?.[0];

  return (
    <div className="flex flex-col">
      <div className="relative overflow-hidden rounded-t-3xl border border-b-0">
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
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-10">
              {/* Title and Version */}
              <div className="flex flex-wrap items-end gap-3">
                <h1 className="font-bold text-white text-xl drop-shadow-lg md:text-5xl">
                  {post.title}
                </h1>
                {post.version && (
                  <Badge
                    className="mb-1 border-white/30 bg-white/20 text-white backdrop-blur-sm md:mb-2"
                    variant="outline"
                  >
                    {post.version}
                  </Badge>
                )}
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
                  {post.version}
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
      <PostActionBar post={post} />
    </div>
  );
}

export function PostActionBar({ post }: { post: PostProps }) {
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Enlace copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 rounded-b-3xl border bg-card p-4 md:justify-between">
      <div className="grid grid-flow-col grid-rows-2 gap-3 md:grid-rows-1">
        <LikeButton postId={post.id} />
        <BookmarkButton postId={post.id} />
        <Button
          nativeButton={false}
          render={<Link params={{ id: post.id }} to={"/post/reviews/$id"} />}
          size="sm"
          variant="outline"
        >
          <HugeiconsIcon className="size-4" icon={StarIcon} />
          Reviews
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
        <MetaBadge icon={Calendar03Icon}>
          {format(post.createdAt, "PP", {
            locale: es,
          })}
        </MetaBadge>
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
  const hasChangelog = !!post.changelog;
  const hasImages = (post.imageObjectKeys?.length ?? 0) > 0;
  const hasTags = post.terms.length > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Gallery Tab */}
      {hasImages && (
        <div className="lg:col-span-3">
          <div className="flex flex-col gap-6">
            {allImages.length > 0 && (
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                  dragFree: true,
                }}
                plugins={[
                  AutoScroll({
                    playOnInit: true,
                    startDelay: 0,
                    stopOnInteraction: false,
                    speed: 1,
                  }),
                ]}
              >
                <CarouselContent>
                  {allImages.map((image, index) => (
                    <CarouselItem className="md:basis-1/3" key={image}>
                      <button
                        className="group aspect-video overflow-hidden rounded-xl border-2 transition-all"
                        onClick={() => {
                          setSelectedImageIndex(index);
                          setGalleryOpen(true);
                        }}
                        type="button"
                      >
                        <img
                          alt={`Miniatura ${index + 1}`}
                          className="h-full w-full object-cover transition-transform group-hover:scale-110"
                          src={getBucketUrl(image)}
                        />
                      </button>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            )}

            {/* Image Viewer Modal */}
            <ImageViewer
              images={galleryImages}
              initialIndex={selectedImageIndex}
              onOpenChange={setGalleryOpen}
              open={galleryOpen}
              title={post.title}
            />
          </div>
        </div>
      )}
      {/* Left Column - Main Content */}
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Tabs className="w-full" defaultValue="info">
          <TabsList className="w-full justify-start">
            {hasDownloadLinks && (
              <TabsTrigger className="gap-2" value="downloads">
                <HugeiconsIcon className="size-4" icon={Download04Icon} />
                Descargas
              </TabsTrigger>
            )}
            <TabsTrigger className="gap-2" value="info">
              <HugeiconsIcon className="size-4" icon={InformationCircleIcon} />
              Información
            </TabsTrigger>
            {hasChangelog && (
              <TabsTrigger className="gap-2" value="changelog">
                <HugeiconsIcon className="size-4" icon={Calendar03Icon} />
                Changelog
              </TabsTrigger>
            )}
          </TabsList>

          {/* Downloads Tab */}
          {hasDownloadLinks && (
            <TabsContent className="mt-6" value="downloads">
              <ContentCard icon={Link01Icon} title="Enlaces de Descarga">
                <Markdown>{post.adsLinks ?? ""}</Markdown>
              </ContentCard>
            </TabsContent>
          )}

          {/* Info Tab */}
          <TabsContent className="mt-6" value="info">
            <div className="flex flex-col gap-6">
              {/* Synopsis */}
              {hasContent && (
                <ContentCard icon={InformationCircleIcon} title="Sinopsis">
                  <Markdown>{post.content}</Markdown>
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

          {/* Changelog Tab */}
          {hasChangelog && (
            <TabsContent className="mt-6" value="changelog">
              <ContentCard icon={Calendar03Icon} title="Changelog">
                <Markdown>{post.changelog}</Markdown>
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
              Tags
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

        {/* Author Support Sidebar Card (if exists) */}
        {hasAuthorContent && (
          <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-linear-to-br from-primary/5 to-transparent p-5">
            <h3 className="flex items-center gap-2 font-semibold text-lg">
              <HugeiconsIcon
                className="size-8 text-primary"
                icon={FavouriteCircleIcon}
              />
              Apoya al Creador
            </h3>
            <Markdown>{post.authorContent}</Markdown>
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
    <span className="flex items-center gap-1.5 text-sm">
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
