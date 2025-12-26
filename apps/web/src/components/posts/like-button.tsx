import { useMutation, useQuery } from "@tanstack/react-query";
import { HeartIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { orpc, queryClient } from "@/utils/orpc";

function useLikeMutation(postId: string) {
  const queryOptions = orpc.post.getLikes.queryOptions({ input: postId });

  return useMutation(
    orpc.post.toggleLike.mutationOptions({
      // optimistic update
      onMutate: async (newState: { liked: boolean }) => {
        await queryClient.cancelQueries(queryOptions);

        const previous = queryClient.getQueryData<number>([queryOptions]);
        queryClient.setQueryData(queryOptions.queryKey, (prev) =>
          newState.liked ? (prev ?? 0) + 1 : (prev ?? 1) - 1
        );

        return { previous };
      },

      // rollback if error
      onError: (_err, _vars, ctx) => {
        if (ctx?.previous !== undefined) {
          queryClient.setQueryData([queryOptions], ctx.previous);
        }
      },

      // refetch after mutation
      onSettled: () => {
        queryClient.invalidateQueries(queryOptions);
      },
    })
  );
}

export function LikeButton({
  initialLikes,
  postId,
}: {
  initialLikes: number;
  postId: string;
}) {
  const { data: likes, isFetching } = useQuery(
    orpc.post.getLikes.queryOptions({
      input: postId,
      refetchOnWindowFocus: false,
    })
  );

  const toggleLike = useLikeMutation(postId);
  const { data: auth } = authClient.useSession();
  const [localLikes, setLocalLikes] = useState(initialLikes);

  useEffect(() => {
    if (likes !== undefined) {
      setLocalLikes(likes);
    }
  }, [likes]);

  if (!auth) {
    return (
      <Button size="icon">
        <HeartIcon className="size-6" />
      </Button>
    );
  }

  const handleClick = () => {
    toggleLike.mutate({ postId, liked: !likes });
  };

  return (
    <Button
      disabled={
        toggleLike.isPending ||
        likes === undefined ||
        isFetching ||
        localLikes === undefined
      }
      onClick={handleClick}
      variant="outline"
    >
      <HeartIcon
        className={cn(
          "size-6",
          likes ? "fill-primary stroke-primary" : "fill-none"
        )}
      />
      {localLikes}
    </Button>
  );
}
