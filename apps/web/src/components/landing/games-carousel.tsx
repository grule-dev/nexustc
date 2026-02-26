import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState } from "react";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { PostCard, type PostProps } from "./post-card";

export function GamesCarousel({ games }: { games: PostProps[] }) {
  const [api, setApi] = useState<CarouselApi | undefined>();
  const [_current, setCurrent] = useState<number>(0);

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

  return (
    <div className="relative w-full">
      <div className="absolute left-0 h-full w-[20%] bg-linear-to-r from-card to-transparent" />
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
              className="basis-1/2 py-1 pl-3 md:basis-1/3 lg:basis-1/4"
              key={game.id}
            >
              <PostCard post={game} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
