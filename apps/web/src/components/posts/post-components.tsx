import {
  Calendar03Icon,
  Download04Icon,
  FavouriteCircleIcon,
  InformationCircleIcon,
  Link01Icon,
  Share08Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { PremiumLinksDescriptor } from "@repo/shared/constants";
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
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Carousel, CarouselContent, CarouselItem } from "../ui/carousel";
import { ImageViewer } from "../ui/image-viewer";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { BookmarkButton } from "./bookmark-button";
import { CommentSection } from "./comment-section";
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
    <div className="relative grid grid-cols-1 gap-4 px-1 md:grid-cols-4">
      <div className="flex flex-col gap-4 md:col-span-3">
        <PostHero post={post} />
        <PostCarousel post={post} />
        <PostActionBar post={post} />
        <PostInfo post={post} />
        <PostContent post={post} />
        <PostTagsSection post={post} />
        <CommentSection post={post} />
      </div>
      <div>
        <PostSidebarContent post={post} />
      </div>
    </div>
  );
}

export function PostHero({ post }: { post: PostProps }) {
  const mainImage = post.imageObjectKeys?.[0];

  return (
    <div className="flex flex-col md:px-0">
      <div className="relative overflow-hidden rounded-3xl border border-b-0">
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
                    className="mb-1 h-6 border-white/30 bg-white/20 text-sm text-white backdrop-blur-sm md:mb-2"
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
    <Card>
      <CardContent className="flex flex-wrap items-center justify-center gap-4 md:justify-between">
        <div className="grid grid-flow-col grid-rows-2 gap-3 md:grid-rows-1">
          <LikeButton postId={post.id} />
          <BookmarkButton postId={post.id} />
          <Button
            nativeButton={false}
            render={<Link params={{ id: post.id }} to={"/post/reviews/$id"} />}
            size="sm"
            variant="outline"
          >
            <RatingDisplay
              averageRating={post.averageRating ?? 0}
              ratingCount={post.ratingCount}
              variant="compact"
            />
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
      </CardContent>
    </Card>
  );
}

export function PostTagsSection({ post }: { post: PostProps }) {
  const groupedTerms = Object.groupBy(post.terms, (term) => term.taxonomy);
  const hasTags = post.terms.length > 0;

  return (
    hasTags && (
      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 font-semibold text-lg">
            <HugeiconsIcon className="size-5" icon={InformationCircleIcon} />
            Información
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Categorized Tags */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <TagCategory label="Plataformas" terms={groupedTerms.platform} />
            <TagCategory label="Idiomas" terms={groupedTerms.language} />
            <TagCategory label="Motor" terms={groupedTerms.engine} />
            <TagCategory label="Gráficos" terms={groupedTerms.graphics} />
            <TagCategory label="Censura" terms={groupedTerms.censorship} />
            <TagCategory label="Estado" terms={groupedTerms.status} />
          </div>

          <Separator />

          {/* Main Tags */}
          {groupedTerms.tag && groupedTerms.tag.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {groupedTerms.tag.map((term) => (
                <TermBadge key={term.id} tag={term} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  );
}

export function PostSidebarContent({ post }: { post: PostProps }) {
  const hasCreator = !!post.creatorName || !!post.creatorLink;
  const Comp = post.creatorLink ? "a" : "div";

  return (
    <div className="sticky inset-0 top-4 left-0 flex flex-col gap-4">
      {/* Creator Sidebar Card (if exists) */}
      {hasCreator && (
        <Comp
          className="flex flex-col gap-4 rounded-2xl border border-secondary bg-linear-to-br from-primary/5 to-transparent p-5"
          href={post.creatorLink}
          rel="noopener"
          target="_blank"
        >
          <h3 className="flex items-center gap-2 font-semibold text-lg">
            <HugeiconsIcon
              className="size-8 text-primary"
              icon={FavouriteCircleIcon}
            />
            Apoya al Creador
          </h3>
          <span className="font-medium">{post.creatorName}</span>
        </Comp>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recomendados</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* TODO: Implement recommendation system and add it here */}
          {Array.of(1, 2, 3, 4, 5).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: temporary placeholder
            <Skeleton className="h-40 w-full" key={index} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function PostCarousel({ post }: { post: PostProps }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const allImages = post.imageObjectKeys ?? [];
  const galleryImages = allImages.map((key, index) => ({
    src: getBucketUrl(key),
    alt: `${post.title} - Imagen ${index + 1}`,
  }));
  const hasImages = (post.imageObjectKeys?.length ?? 0) > 0;

  return (
    hasImages && (
      <div>
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
                      className="group aspect-video w-full overflow-hidden rounded-xl border-2 transition-all"
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
    )
  );
}

export function PostInfo({ post }: { post: PostProps }) {
  const hasContent = post.content !== "";

  return (
    hasContent && (
      <div className="flex flex-col gap-6">
        <ContentCard icon={InformationCircleIcon} title="Sinopsis">
          <Markdown>{post.content}</Markdown>
        </ContentCard>
      </div>
    )
  );
}

export function PostContent({ post }: { post: PostProps }) {
  const hasDownloadLinks = !!post.adsLinks;
  const hasChangelog = !!post.changelog;
  const hasPremium = post.premiumLinksAccess.status !== "no_premium_links";

  if (!(hasDownloadLinks || hasChangelog || hasPremium)) {
    return null;
  }

  const defaultTab =
    hasPremium && post.premiumLinksAccess.status === "granted"
      ? "premium"
      : hasDownloadLinks
        ? "downloads"
        : hasChangelog
          ? "changelog"
          : "downloads";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Tabs className="w-full" defaultValue={defaultTab}>
          <TabsList className="w-full justify-start">
            {hasDownloadLinks && (
              <TabsTrigger className="gap-2" value="downloads">
                <HugeiconsIcon className="size-4" icon={Download04Icon} />
                Descargas
              </TabsTrigger>
            )}
            {hasPremium && (
              <TabsTrigger className="gap-2" value="premium">
                <HugeiconsIcon className="size-4" icon={StarIcon} />
                Premium
              </TabsTrigger>
            )}
            {hasChangelog && (
              <TabsTrigger className="gap-2" value="changelog">
                <HugeiconsIcon className="size-4" icon={Calendar03Icon} />
                Changelog
              </TabsTrigger>
            )}
          </TabsList>

          {hasDownloadLinks && (
            <TabsContent value="downloads">
              <ContentCard icon={Link01Icon} title="Enlaces de Descarga">
                <Markdown>{post.adsLinks ?? ""}</Markdown>
              </ContentCard>
            </TabsContent>
          )}

          {hasPremium && (
            <TabsContent value="premium">
              <PremiumLinksContent descriptor={post.premiumLinksAccess} />
            </TabsContent>
          )}

          {hasChangelog && (
            <TabsContent className="mt-6" value="changelog">
              <ContentCard icon={Calendar03Icon} title="Changelog">
                <Markdown>{post.changelog}</Markdown>
              </ContentCard>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function PremiumLinksContent({
  descriptor,
}: {
  descriptor: PremiumLinksDescriptor;
}) {
  if (descriptor.status === "no_premium_links") {
    return null;
  }

  if (descriptor.status === "granted") {
    return (
      <ContentCard icon={StarIcon} title="Enlaces Premium">
        <Markdown>{descriptor.content}</Markdown>
      </ContentCard>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed bg-muted/30 py-16">
      <div className="rounded-full bg-muted p-4">
        <HugeiconsIcon
          className="size-8 text-muted-foreground"
          icon={StarIcon}
        />
      </div>
      <p className="text-center text-muted-foreground">
        {descriptor.status === "denied_need_patron"
          ? "Hazte patrocinador para acceder a los enlaces premium"
          : `Necesitas ${descriptor.requiredTierLabel} o superior para acceder a estos enlaces`}
      </p>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-semibold text-lg">
          <HugeiconsIcon className="size-5" icon={icon} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
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
    <div className="flex flex-row gap-2 rounded-md bg-muted/30 p-2">
      <div className="h-full w-1 bg-accent" />
      <div className="flex flex-col gap-1.5">
        <span className="font-medium text-accent text-xs uppercase tracking-wider">
          {label}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {terms.map((term) => (
            <TermBadge className="text-xs" key={term.id} tag={term} />
          ))}
        </div>
      </div>
    </div>
  );
}
