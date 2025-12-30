import { createFileRoute, Navigate, notFound } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import Zoom from "react-medium-image-zoom";
import { BookmarkButton } from "@/components/posts/bookmark-button";
import { Separator } from "@/components/ui/separator";
import { cn, getBucketUrl } from "@/lib/utils";
import "react-medium-image-zoom/dist/styles.css";
import {
  ArrowLeft01Icon,
  ArrowLeftDoubleIcon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TermBadge } from "@/components/term-badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { orpcClient } from "@/lib/orpc";
import type { PostType } from "@/lib/types";

export const Route = createFileRoute("/_main/comic/$id")({
  component: RouteComponent,
  loader: async ({ params }) => orpcClient.post.getPostById(params.id),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `NeXusTC - ${loaderData ? loaderData.title : "Cómic"}`,
      },
    ],
  }),
});

function RouteComponent() {
  const comic = Route.useLoaderData();

  if (!comic) {
    throw notFound();
  }

  return <ComicPage comic={comic} />;
}

function ComicPage({ comic }: { comic: PostType }) {
  const [page, setPage] = useState(-1);

  useEffect(() => {
    const controller = new AbortController();

    const handleKeyDown = (event: KeyboardEvent) => {
      console.log("Page:", page);
      switch (event.key) {
        case "ArrowLeft": {
          if (page > -1) {
            setPage(page - 1);
          }
          break;
        }
        case "ArrowRight": {
          if (page < (comic.imageObjectKeys?.length ?? 0)) {
            setPage(page + 1);
          }
          break;
        }
        default: {
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, {
      signal: controller.signal,
    });

    return () => controller.abort();
  }, [comic.imageObjectKeys?.length, page]);

  if (!comic || comic.imageObjectKeys === null) {
    return <Navigate to="/" />;
  }

  const groupedTerms = Object.groupBy(comic.terms, (term) => term.taxonomy);

  if (page > -1) {
    return (
      <main className="flex w-full justify-center">
        <div className="w-full max-w-6xl">
          <ComicReader
            images={comic.imageObjectKeys}
            page={page}
            setPage={setPage}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="grid w-full grid-cols-1 md:grid-cols-4">
      <div className="flex flex-col gap-4 px-4 md:col-span-2 md:col-start-2">
        <section className="grid grid-cols-3 gap-4">
          <img
            alt={`Imagen de portada de ${comic.title}`}
            src={getBucketUrl(comic.imageObjectKeys[0])}
          />
          <div className="col-span-2 flex flex-col gap-4">
            <div className="flex w-full flex-row items-center justify-between gap-4">
              <div className="flex flex-col items-start gap-2">
                <h1 className="font-bold text-4xl">{comic.title}</h1>
                <p className="text-muted-foreground">
                  {format(comic.createdAt, "PPPP", { locale: es })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex flex-row items-center gap-4">
                  <BookmarkButton postId={comic.id} />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <PostBadges label="Tags: " terms={groupedTerms.tag ?? []} />
              <PostBadges
                label="Idiomas: "
                terms={groupedTerms.language ?? []}
              />
              <PostBadges
                label="Censura: "
                terms={groupedTerms.censorship ?? []}
              />
              <div className="flex flex-row gap-2">
                <h3 className="font-bold">Páginas: </h3>
                <div className="flex flex-wrap gap-2">
                  {((comic.imageObjectKeys?.length ?? 0) + 1).toString()}
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator orientation="horizontal" />

        <div className="grid grid-cols-6 gap-4">
          {comic.imageObjectKeys?.slice(0, 11).map((image, index) => (
            <button
              className="ring-primary hover:ring"
              key={image}
              onClick={() => setPage(index)}
              type="button"
            >
              <img
                alt={`Imagen adjunta de ${comic.title}`}
                src={getBucketUrl(image)}
              />
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

function ComicReader({
  page,
  setPage,
  images,
}: {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  images: string[];
}) {
  const carouselApiRef = useRef<CarouselApi>(null);

  useEffect(() => {
    if (!carouselApiRef.current) {
      return;
    }
    carouselApiRef.current.scrollTo(page);
  }, [page]);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {!!images[page] && (
        <Zoom>
          <img
            alt={`Página ${page + 1}`}
            className="h-full max-h-dvh w-full object-contain"
            src={getBucketUrl(images[page])}
          />
        </Zoom>
      )}
      <Carousel
        className="w-full p-4"
        opts={{
          align: "start",
          loop: false,
          dragFree: true,
        }}
        setApi={(api) => {
          carouselApiRef.current = api;
        }}
      >
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem
              className="basis-1/4 cursor-pointer md:basis-1/9"
              key={image}
              onClick={() => setPage(index)}
            >
              <img
                alt={`Miniatura de página ${index}`}
                className={cn(
                  "rounded border-2 transition",
                  page === index
                    ? "border-primary"
                    : "border-transparent hover:border-muted"
                )}
                src={getBucketUrl(image)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <div className="flex w-full flex-row items-center justify-between gap-4">
        <Button
          disabled={page <= 0}
          onClick={() => {
            setPage(0);
          }}
          size="icon"
          variant="outline"
        >
          <HugeiconsIcon icon={ArrowLeftDoubleIcon} />
        </Button>
        <Button
          className="grow"
          disabled={page <= 0}
          onClick={() => {
            if (page > 0) {
              setPage(page - 1);
            }
          }}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} />
        </Button>
        <p>
          {page + 1} / {images.length}
        </p>
        <Button
          className="grow"
          disabled={page >= images.length - 1}
          onClick={() => {
            if (page < images.length - 1) {
              setPage(page + 1);
            }
          }}
        >
          <HugeiconsIcon icon={ArrowRight01Icon} />
        </Button>
        <Button
          disabled={page >= images.length - 1}
          onClick={() => {
            setPage(images.length - 1);
          }}
          size="icon"
          variant="outline"
        >
          <HugeiconsIcon icon={ArrowRightDoubleIcon} />
        </Button>
      </div>
    </div>
  );
}

function PostBadges({
  label,
  terms,
}: {
  label: string;
  terms: { id: string; name: string; color: string | null | undefined }[];
}) {
  if (terms.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-row gap-2">
      <h3 className="font-bold">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {terms.map((term) => (
          <TermBadge key={term.id} tag={term} />
        ))}
      </div>
    </div>
  );
}
