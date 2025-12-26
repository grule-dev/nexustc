import { inArray, useLiveQuery } from "@tanstack/react-db";
import { BookmarkIcon } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { bookmarksCollection, postCollection } from "@/db/collections";
import { RunOnClick } from "../run-on-click";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Spinner } from "../ui/spinner";
import { PostCard } from "./post-card";

export function FavoritesMenu() {
  const [open, setOpen] = useState(false);
  const bookmarksQuery = useLiveQuery((q) =>
    q.from({ bookmark: bookmarksCollection })
  );
  const postsQuery = useLiveQuery(
    (q) =>
      q.from({ post: postCollection }).where(({ post }) =>
        inArray(
          post.id,
          bookmarksQuery.data.map((b) => b.postId)
        )
      ),
    [bookmarksQuery.data]
  );

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger render={<Button size="icon" variant="default" />}>
        <BookmarkIcon className="size-5" />
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Favoritos</SheetTitle>
        </SheetHeader>
        {!!(bookmarksQuery.isLoading || postsQuery.isLoading) && (
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
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
