import { FavouriteIcon, StarIcon, ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { getBucketUrl, getTierColor } from "@/lib/utils";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";

type PostCardProps = {
  post: {
    id: string;
    title: string;
    type: "post" | "comic";
    imageObjectKeys: string[] | null;
    favorites: number;
    likes: number;
    views: number;
    ratingCount?: number;
    averageRating?: number;
    terms: {
      name: string;
      taxonomy: string;
      color: string | null;
    }[];
  };
  withTags?: boolean;
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
      <Card className="relative h-full gap-4 overflow-hidden pt-0 ring-primary group-hover:ring">
        {/* Image */}
        {/* Tier indicator */}
        <div className="relative w-full">
          <div className={`h-2 w-full ${getTierColor(post.favorites)}`} />
          {post.type === "comic" && (
            <div className="aspect-3/4 w-full">
              <img
                alt={post.title}
                className="h-full w-full rounded object-cover"
                src={images[0]}
              />
            </div>
          )}
          {post.type === "post" && (
            <div className="aspect-4/3 w-full">
              {count === 1 && (
                <img
                  alt={post.title}
                  className="h-full w-full object-cover"
                  src={images[0]}
                />
              )}

              {count === 2 && (
                <div className="grid h-full w-full grid-cols-2 gap-1">
                  <img
                    alt={post.title}
                    className="h-full w-full object-cover"
                    src={images[0]}
                  />
                  <img
                    alt={post.title}
                    className="h-full w-full object-cover"
                    src={images[1]}
                  />
                </div>
              )}

              {count === 3 && (
                <div className="grid h-full w-full grid-cols-2 gap-1">
                  <div className="grid min-h-0 grid-rows-2 gap-1">
                    <img
                      alt={post.title}
                      className="h-full w-full object-cover"
                      src={images[0]}
                    />
                    <img
                      alt={post.title}
                      className="h-full w-full object-cover"
                      src={images[1]}
                    />
                  </div>
                  <img
                    alt={post.title}
                    className="h-full w-full object-cover"
                    src={images[2]}
                  />
                </div>
              )}

              {count === 4 && (
                <div className="grid h-full w-full grid-cols-2 gap-1">
                  {images.map((img) => (
                    <img
                      alt={post.title}
                      className="h-full w-full object-cover"
                      key={img}
                      src={img}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <CardContent className="flex flex-col items-center space-y-2">
          <h3 className="line-clamp-2 font-semibold text-lg">{post.title}</h3>
          <Separator orientation="horizontal" />
          <div className="bottom-2 left-2 flex flex-row items-center gap-3 rounded-lg leading-none">
            <div className="items-center-safe inline-flex gap-1">
              <HugeiconsIcon
                className="size-4 fill-red-500 text-red-500"
                icon={FavouriteIcon}
              />
              <span className="translate-y-px text-white">{post.likes}</span>
            </div>
            {post.ratingCount !== undefined && post.ratingCount > 0 && (
              <div className="inline-flex items-center gap-1">
                <HugeiconsIcon
                  className="size-4 fill-amber-400 text-amber-400"
                  icon={StarIcon}
                />
                <span className="translate-y-px text-white">
                  {post.averageRating?.toFixed(1)}
                </span>
              </div>
            )}
            <div className="inline-flex items-center gap-1">
              <HugeiconsIcon className="size-4 text-white" icon={ViewIcon} />
              <span className="translate-y-px text-white">{post.views}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
