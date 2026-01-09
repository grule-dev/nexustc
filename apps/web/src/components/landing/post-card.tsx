import {
  Bookmark02Icon,
  FavouriteIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { getBucketUrl, getTierColor } from "@/lib/utils";
import { AndroidLogo } from "../icons/android";
import { IOSLogo } from "../icons/ios";
import { WindowsLogo } from "../icons/windows";
import { TermBadge } from "../term-badge";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type PostCardProps = {
  post: {
    id: string;
    title: string;
    type: "post" | "comic";
    imageObjectKeys: string[] | null;
    favorites: number;
    likes: number;
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

export function PostCard({ post, withTags = true }: PostCardProps) {
  const groupedTerms = Object.groupBy(post.terms, (term) => term.taxonomy);
  const platforms = groupedTerms.platform?.map((t) => t.name);
  const tags = groupedTerms.tag?.map((t) => ({ name: t.name, color: t.color }));

  const images = (post.imageObjectKeys?.slice(0, 4) ?? []).map(getBucketUrl);
  const count = images.length;

  return (
    <Link
      className="group w-full transition-transform hover:scale-102"
      params={{ id: post.id }}
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
          {/* Platforms overlay */}
          {platforms && platforms?.length > 0 && (
            <div className="absolute right-2 bottom-2 flex items-center gap-2 rounded-lg bg-black/50 px-2 py-1 backdrop-blur-md">
              {platforms
                ?.sort((a, b) => -a.localeCompare(b))
                .map((platform) => {
                  const Icon = getPlatformIcon(platform);
                  return Icon;
                })}
            </div>
          )}
        </div>
        <CardContent className="gap-4 space-y-2">
          <h3 className="line-clamp-2 font-semibold text-lg">{post.title}</h3>
          <Separator orientation="horizontal" />
          {/* Stats overlay */}
          <div className="bottom-2 left-2 flex items-center gap-2 rounded-lg">
            <HugeiconsIcon
              className="size-5 fill-red-500 text-red-500"
              icon={FavouriteIcon}
            />
            <span className="text-sm text-white">{post.likes}</span>
            <HugeiconsIcon
              className="size-5 fill-blue-500 text-blue-500"
              icon={Bookmark02Icon}
            />
            <span className="text-sm text-white">{post.favorites}</span>
            {post.ratingCount !== undefined && post.ratingCount > 0 && (
              <>
                <HugeiconsIcon
                  className="size-5 fill-amber-400 text-amber-400"
                  icon={StarIcon}
                />
                <span className="text-sm text-white">
                  {post.averageRating?.toFixed(1)}
                </span>
              </>
            )}
          </div>

          {withTags && tags && tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {tags?.slice(0, 1).map((tag) => (
                <TermBadge
                  className="flex-1 justify-center"
                  key={tag.name}
                  tag={tag}
                />
              ))}
              {tags.length > 2 && (
                <Tooltip>
                  <TooltipTrigger>
                    <TermBadge
                      tag={{ name: `+${tags.length - 2}`, color: null }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <div className="flex max-w-md flex-wrap gap-1 overflow-y-auto">
                      {tags.slice(2).map((tag) => (
                        <TermBadge
                          className="flex-1 justify-center"
                          key={tag.name}
                          tag={tag}
                        />
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function getPlatformIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case "pc":
      return <WindowsLogo className="size-4 text-white" key="pc" />;
    case "android":
      return <AndroidLogo className="size-5 text-white" key="android" />;
    case "ios":
      return <IOSLogo className="size-5 text-white" key="ios" />;
    default:
      return null;
  }
}
