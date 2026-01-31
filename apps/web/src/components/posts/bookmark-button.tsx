import { Bookmark02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDebounceEffect } from "@/hooks/use-debounce-effect";
import { authClient } from "@/lib/auth-client";
import { orpc, queryClient } from "@/lib/orpc";
import { cn } from "@/lib/utils";

function BookmarkButtonUI({
  isBookmarked,
  isLoading,
  onClick,
}: {
  isBookmarked: boolean;
  isLoading: boolean;
  onClick?: () => void;
}) {
  return (
    <Button disabled={isLoading} onClick={onClick} size="sm" variant="outline">
      <HugeiconsIcon
        className={cn(
          isBookmarked ? "fill-blue-500 stroke-blue-500" : "fill-none"
        )}
        icon={Bookmark02Icon}
      />
      {isBookmarked ? "Guardado" : "Guardar"}
    </Button>
  );
}

export function BookmarkButton({ postId }: { postId: string }) {
  const { data: auth } = authClient.useSession();
  const [cooldown, setCooldown] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset cooldown after 2 seconds
  useDebounceEffect(
    () => {
      if (cooldown) {
        setCooldown(false);
      }
    },
    2000,
    [cooldown]
  );

  // Query to fetch user's bookmarks
  const bookmarksQueryOptions = orpc.user.getBookmarks.queryOptions();
  const { data: userBookmarks, isLoading: isLoadingBookmarks } = useQuery({
    ...bookmarksQueryOptions,
    enabled: !!auth,
  });

  // Calculate if current post is bookmarked
  const isBookmarked = userBookmarks?.some((b) => b.postId === postId) ?? false;

  // Mutation with optimistic updates
  const bookmarkMutation = useMutation(
    orpc.user.toggleBookmark.mutationOptions({
      onMutate: async (variables) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries(bookmarksQueryOptions);

        // Snapshot current value
        const previousBookmarks = queryClient.getQueryData(
          bookmarksQueryOptions.queryKey
        );

        // Optimistically update cache
        queryClient.setQueryData(
          bookmarksQueryOptions.queryKey,
          (old: { postId: string }[] | undefined) => {
            if (!old) {
              return old;
            }

            if (variables.bookmarked) {
              // Add bookmark optimistically
              return [...old, { postId: variables.postId }];
            }
            // Remove bookmark optimistically
            return old.filter((b) => b.postId !== variables.postId);
          }
        );

        return { previousBookmarks };
      },

      onError: (error, variables, context) => {
        // Rollback on error
        if (context?.previousBookmarks !== undefined) {
          queryClient.setQueryData(
            bookmarksQueryOptions.queryKey,
            context.previousBookmarks
          );
        }

        // Show error toast with appropriate message
        const action = variables.bookmarked ? "guardar" : "quitar";
        toast.error(
          `Error al ${action} marcador: ${error instanceof Error ? error.message : "Error desconocido"}`,
          { duration: 5000 }
        );
      },

      onSettled: () => {
        // Refetch to ensure consistency
        queryClient.invalidateQueries(bookmarksQueryOptions);
      },
    })
  );

  if (!mounted) {
    return null;
  }

  // Unauthenticated state - static disabled button
  if (!auth) {
    return <BookmarkButtonUI isBookmarked={false} isLoading={false} />;
  }

  const handleClick = () => {
    if (cooldown || bookmarkMutation.isPending || isLoadingBookmarks) {
      return;
    }

    setCooldown(true);

    bookmarkMutation.mutate({
      postId,
      bookmarked: !isBookmarked,
    });
  };

  return (
    <BookmarkButtonUI
      isBookmarked={isBookmarked}
      isLoading={isLoadingBookmarks || cooldown || bookmarkMutation.isPending}
      onClick={handleClick}
    />
  );
}
