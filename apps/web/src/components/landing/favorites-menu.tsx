import { Bookmark02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

export function FavoritesMenu() {
  // TODO: add functionality back
  const [open, setOpen] = useState(false);

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger render={<Button size="icon" variant="default" />}>
        <HugeiconsIcon className="size-5" icon={Bookmark02Icon} />
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Favoritos</SheetTitle>
        </SheetHeader>
        {/* {!!(bookmarksQuery.isLoading || postsQuery.isLoading) && (
          <div className="flex w-full items-center justify-center p-2">
            <Spinner />
          </div>
        )}
        {!!(postsQuery.isError || bookmarksQuery.isError) && (
          <p className="text-red-500">Error al cargar favoritos</p>
        )}
        {postsQuery.data && postsQuery.data.length === 0 && (
          <p className="text-center text-muted-foreground">
            No tienes favoritos
          </p>
        )}
        <ScrollArea className="min-h-0">
          <RunOnClick onClick={() => setOpen(false)}>
            <div className="grid w-full grid-cols-2 gap-2 p-2">
              {postsQuery.data?.map((post) => (
                <PostCard key={post.id} post={post} withTags={false} />
              ))}
            </div>
          </RunOnClick>
        </ScrollArea> */}
      </SheetContent>
    </Sheet>
  );
}
