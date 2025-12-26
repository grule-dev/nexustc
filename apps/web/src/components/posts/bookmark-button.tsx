import { eq, useLiveQuery } from "@tanstack/react-db";
import { useMutation } from "@tanstack/react-query";
import { BookmarkIcon, HeartIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { bookmarksCollection } from "@/db/collections";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { Spinner } from "../ui/spinner";

export function BookmarkButton({ postId }: { postId: string }) {
  const { data: bookmarks, isLoading } = useLiveQuery((q) =>
    q
      .from({ bookmark: bookmarksCollection })
      .where(({ bookmark }) => eq(bookmark.postId, postId))
  );

  const [cooldown, setCooldown] = useState(false);
  const isBookmarked = bookmarks ? bookmarks.length > 0 : false;
  const mutation = useMutation(orpc.user.toggleBookmark.mutationOptions());
  const { data: auth } = authClient.useSession();

  if (!auth) {
    return (
      <Button size="icon">
        <HeartIcon className="size-6" />
      </Button>
    );
  }

  const handleClick = async () => {
    if (cooldown) {
      return;
    }

    setCooldown(true);
    setInterval(() => setCooldown(false), 2000);

    if (isBookmarked) {
      bookmarksCollection.utils.writeDelete(postId);
      await mutation.mutateAsync({ postId, bookmarked: false });
    } else {
      bookmarksCollection.utils.writeInsert({ postId });
      await mutation.mutateAsync({ postId, bookmarked: true });
    }
  };

  return (
    <Button
      disabled={cooldown || mutation.isPending}
      onClick={handleClick}
      variant="outline"
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <BookmarkIcon
          className={cn(
            "size-6",
            isBookmarked ? "fill-blue-500 stroke-blue-500" : "fill-none"
          )}
        />
      )}
      {isBookmarked ? "Guardado" : "Guardar"}
    </Button>
  );
}
