import { FavouriteIcon, StarIcon, ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { getBucketUrl, getTierColor } from "@/lib/utils";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";

export type PostProps = {
  id: string;
  title: string;
  version: string | null;
  type: "post" | "comic";
  imageObjectKeys: string[] | null;
  favorites: number;
  likes: number;
  views: number;
  averageRating?: number;
};

type PostCardProps = {
  post: PostProps;
};

export function PostCard({ post }: PostCardProps) {
  const images = (post.imageObjectKeys?.slice(0, 4) ?? []).map(getBucketUrl);
  const count = images.length;

  return (
    <Link
      className="group w-full transition-transform hover:scale-102"
      params={{ id: post.id }}
      preload={false}
      to="/post/$id"
    >
      <Card className="relative h-full gap-4 overflow-hidden rounded-2xl pt-0">
        {/* Image */}
        {/* Tier indicator */}
        <div className="relative w-full">
          <div className={`h-2 w-full ${getTierColor(post.favorites)}`} />
          {post.type === "comic" && (
            <div className="aspect-3/4 w-full">
              <img
                alt={post.title}
                className="h-full w-full rounded border object-cover"
                src={images[0]}
              />
            </div>
          )}
          {post.type === "post" && (
            <div className="aspect-video w-full">
              {count === 1 && (
                <img
                  alt={post.title}
                  className="h-full w-full border object-cover"
                  src={images[0]}
                />
              )}

              {count === 2 && (
                <div className="grid h-full w-full grid-cols-2">
                  <img
                    alt={post.title}
                    className="h-full w-full border object-cover"
                    src={images[0]}
                  />
                  <img
                    alt={post.title}
                    className="h-full w-full border object-cover"
                    src={images[1]}
                  />
                </div>
              )}

              {count === 3 && (
                <div className="grid h-full w-full grid-cols-2">
                  <div className="grid min-h-0 grid-rows-2">
                    <img
                      alt={post.title}
                      className="h-full w-full border object-cover"
                      src={images[0]}
                    />
                    <img
                      alt={post.title}
                      className="h-full w-full border object-cover"
                      src={images[1]}
                    />
                  </div>
                  <img
                    alt={post.title}
                    className="h-full w-full border object-cover"
                    src={images[2]}
                  />
                </div>
              )}

              {count === 4 && (
                <div className="grid h-full w-full grid-cols-2">
                  {images.map((img) => (
                    <img
                      alt={post.title}
                      className="h-full w-full border object-cover"
                      key={img}
                      src={img}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <CardContent className="flex flex-col space-y-2">
          <div className="flex flex-row items-center gap-1">
            <h3 className="line-clamp-2 font-medium text-base">{post.title}</h3>
            {post.version && (
              <Badge
                className="border-white/30 bg-white/20 text-white backdrop-blur-sm"
                variant="outline"
              >
                {post.version}
              </Badge>
            )}
          </div>
          <Separator orientation="horizontal" />
          <div className="bottom-2 left-2 flex flex-row items-center justify-around gap-3 rounded-lg text-base">
            <div className="items-center-safe inline-flex gap-1">
              <HugeiconsIcon
                className="size-5 fill-red-500 text-red-500"
                icon={FavouriteIcon}
              />
              <span className="translate-y-px text-white">{post.likes}</span>
            </div>
            {post.averageRating !== 0 && (
              <div className="inline-flex items-center gap-1">
                <HugeiconsIcon
                  className="size-5 fill-amber-400 text-amber-400"
                  icon={StarIcon}
                />
                <span className="translate-y-px text-white">
                  {post.averageRating?.toFixed(1)}
                </span>
              </div>
            )}
            <div className="inline-flex items-center gap-1">
              <HugeiconsIcon className="size-5 text-white" icon={ViewIcon} />
              <span className="translate-y-px text-white">{post.views}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
