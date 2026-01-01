import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { HasPermissions } from "@/components/auth/has-role";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserLabel } from "@/components/users/user-label";
import { authClient } from "@/lib/auth-client";
import { orpcClient } from "@/lib/orpc";
import { getBucketUrl } from "@/lib/utils";
import { ReviewMarkdown } from "./review-markdown";
import { StarRatingInput } from "./star-rating-input";

type RatingListProps = {
  postId: string;
};

export function RatingList({ postId }: RatingListProps) {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const [deleteTarget, setDeleteTarget] = useState<{
    postId: string;
    userId: string;
    isOwnRating: boolean;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ratings", postId],
    queryFn: () => orpcClient.rating.getByPostId({ postId }),
  });

  const deleteOwnMutation = useMutation({
    mutationFn: ({ postId }: { postId: string }) =>
      orpcClient.rating.delete({ postId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratings", postId] });
      queryClient.invalidateQueries({ queryKey: ["rating", "user", postId] });
      queryClient.invalidateQueries({ queryKey: ["rating", "stats", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setDeleteTarget(null);
    },
  });

  const deleteAnyMutation = useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId: string }) =>
      orpcClient.rating.deleteAny({ postId, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratings", postId] });
      queryClient.invalidateQueries({ queryKey: ["rating", "stats", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setDeleteTarget(null);
    },
  });

  const handleDelete = () => {
    if (!deleteTarget) {
      return;
    }

    if (deleteTarget.isOwnRating) {
      deleteOwnMutation.mutate({ postId: deleteTarget.postId });
    } else {
      deleteAnyMutation.mutate({
        postId: deleteTarget.postId,
        userId: deleteTarget.userId,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data || data.ratings.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Aún no hay valoraciones. ¡Sé el primero en valorar!
      </p>
    );
  }

  const authorMap = new Map(data.authors.map((a) => [a.id, a]));

  return (
    <>
      <div className="flex flex-col gap-4">
        {data.ratings.map((rating) => {
          const author = authorMap.get(rating.userId);
          const isOwnRating = session?.user?.id === rating.userId;
          const canDelete = isOwnRating;

          return (
            <Card key={rating.userId}>
              <CardContent>
                <div className="flex flex-row gap-4">
                  {author ? (
                    <Link params={{ id: author.id }} to="/user/$id">
                      <Avatar className="size-12">
                        <AvatarImage
                          src={
                            author.image
                              ? getBucketUrl(author.image)
                              : undefined
                          }
                        />
                        <AvatarFallback>
                          {author.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  ) : (
                    <Avatar className="size-12">
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex w-full flex-col gap-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        {author ? (
                          <Link params={{ id: author.id }} to="/user/$id">
                            <UserLabel
                              className="font-semibold"
                              user={author}
                            />
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">
                            Usuario eliminado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-muted-foreground text-sm">
                          {format(rating.createdAt, "PPP", { locale: es })}
                        </p>
                        {canDelete && (
                          <Button
                            onClick={() =>
                              setDeleteTarget({
                                postId: rating.postId,
                                userId: rating.userId,
                                isOwnRating: true,
                              })
                            }
                            size="icon-xs"
                            variant="ghost"
                          >
                            <HugeiconsIcon
                              className="size-4 text-destructive"
                              icon={Delete02Icon}
                            />
                          </Button>
                        )}
                        {!isOwnRating && (
                          <HasPermissions permissions={{ ratings: ["delete"] }}>
                            <Button
                              onClick={() =>
                                setDeleteTarget({
                                  postId: rating.postId,
                                  userId: rating.userId,
                                  isOwnRating: false,
                                })
                              }
                              size="icon-xs"
                              variant="ghost"
                            >
                              <HugeiconsIcon
                                className="size-4 text-destructive"
                                icon={Delete02Icon}
                              />
                            </Button>
                          </HasPermissions>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRatingInput
                        disabled
                        onChange={() => {
                          // Read-only display
                        }}
                        size="sm"
                        value={rating.rating}
                      />
                      <span className="font-bold">{rating.rating}/10</span>
                    </div>
                    {rating.review && (
                      <ReviewMarkdown>{rating.review}</ReviewMarkdown>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        open={!!deleteTarget}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar valoración</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.isOwnRating
                ? "¿Estás seguro de que quieres eliminar tu valoración? Esta acción no se puede deshacer."
                : "¿Estás seguro de que quieres eliminar esta valoración? Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
