import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState } from "react";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { PostType } from "@/lib/types";
import { getBucketUrl } from "@/lib/utils";
import { PostCard } from "./post-card";

export function GamesCarousel({ games }: { games: PostType[] }) {
  const [api, setApi] = useState<CarouselApi | undefined>();
  const [current, setCurrent] = useState<number>(0);

  useEffect(() => {
    if (!api) {
      return;
    }
    // set initial selected
    setCurrent(api.selectedScrollSnap());

    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off?.("select", onSelect);
    };
  }, [api]);

  // Handle thumbnail click
  const scrollTo = (index: number) => {
    if (api) {
      api.scrollTo(index);
    }
  };

  return (
    <div className="w-full">
      {/* Main Carousel */}
      <Carousel
        opts={{
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 4000,
            stopOnInteraction: false,
          }),
        ]}
        setApi={setApi}
      >
        <CarouselContent className="-ml-2">
          {games.map((game) => (
            <CarouselItem
              className="basis-full py-1 pl-2 sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              key={game.id}
            >
              <PostCard post={game} />
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      {/* Scrollable thumbnail navigation */}
      <div className="mt-4 flex justify-center">
        {/* 
          Use inline-flex so the strip centers when there are few items.
          The `thumb-scrollbar` class is a tiny helper to hide native scrollbars cross-browser.
        */}
        <div
          aria-label="Game thumbnails"
          className="thumb-scrollbar inline-flex snap-x snap-mandatory gap-2 overflow-x-auto px-2 py-1"
          role="tablist"
        >
          {games.map((game, index) => (
            <button
              aria-label={`Go to ${game.title}`}
              aria-pressed={current === index}
              className={`relative h-20 w-16 shrink-0 snap-start overflow-hidden rounded-md border-2 transition-transform focus:outline-none focus-visible:ring ${
                current === index
                  ? "scale-105 border-primary"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
              key={game.id}
              onClick={() => scrollTo(index)}
              type="button"
            >
              <img
                alt={game.title}
                className="h-full w-full object-cover"
                src={getBucketUrl(game.imageObjectKeys?.[0] ?? "")}
              />
              {current === index && (
                <div className="absolute inset-0 bg-black/20" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
