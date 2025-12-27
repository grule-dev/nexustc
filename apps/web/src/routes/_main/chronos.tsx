import { createFileRoute } from "@tanstack/react-router";
import AutoScroll from "embla-carousel-auto-scroll";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

export const Route = createFileRoute("/_main/chronos")({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: "TheChronos",
      },
    ],
  }),
});

const images = [
  { id: 1, url: "https://picsum.photos/id/46/1000/600" },
  { id: 2, url: "https://picsum.photos/id/47/1000/600" },
  { id: 3, url: "https://picsum.photos/id/48/1000/600" },
  { id: 4, url: "https://picsum.photos/id/49/1000/600" },
  { id: 5, url: "https://picsum.photos/id/50/1000/600" },
  { id: 6, url: "https://picsum.photos/id/51/1000/600" },
  { id: 7, url: "https://picsum.photos/id/52/1000/600" },
  { id: 8, url: "https://picsum.photos/id/53/1000/600" },
  { id: 9, url: "https://picsum.photos/id/54/1000/600" },
  { id: 10, url: "https://picsum.photos/id/55/1000/600" },
];

function RouteComponent() {
  return (
    <main className="relative grid w-full md:grid-cols-4">
      {/* Left sticky image */}
      <div
        className="sticky top-0 col-span-1 hidden h-screen bg-center bg-cover md:block"
        style={{
          backgroundImage: "url(https://picsum.photos/id/46/1000/600)",
        }}
      />
      {/* Central scrollable content */}
      <article className="col-span-2 flex min-h-screen w-full flex-col items-center gap-8 bg-background px-4 py-4">
        <img
          alt=""
          className="aspect-2/1 w-full rounded-md"
          loading="eager"
          src="https://picsum.photos/id/40/1000/500"
        />
        <section className="prose dark:prose-invert">
          <h1>Page Title</h1>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
            venenatis, nunc sit amet facilisis tincidunt, sapien justo
            ullamcorper lorem, nec tincidunt justo magna nec lorem.
          </p>
          <p>
            {[...new Array(50)].map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: shh
              <span key={i}>
                This is line {i + 1}. <br />
              </span>
            ))}
          </p>
        </section>
      </article>
      {/* Right sticky vertical carousel */}
      <div className="sticky top-0 col-span-1 hidden h-dvh md:block">
        <Carousel
          opts={{
            align: "start",
            loop: true,
            dragFree: false,
          }}
          orientation="vertical"
          plugins={[
            AutoScroll({
              startDelay: 0,
              stopOnInteraction: false,
              speed: 1, // adjust for ticker speed
            }),
          ]}
        >
          <CarouselContent className="h-dvh">
            {images.map((image) => (
              <CarouselItem
                className="basis-auto"
                // 👇 control how many items are visible at once
                key={image.id}
              >
                <img
                  alt=""
                  className="aspect-video w-full overflow-hidden rounded-md border object-cover"
                  src={image.url}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </main>
  );
}
