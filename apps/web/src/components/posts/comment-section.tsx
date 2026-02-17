import {
  AlertCircleIcon,
  Comment01Icon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useStore } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "facehash";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import {
  CommentContent,
  useEmojiStickerMaps,
} from "@/components/comments/comment-content";
import { EmojiPicker } from "@/components/comments/emoji-picker";
import { StickerPicker } from "@/components/comments/sticker-picker";
import { useAppForm } from "@/hooks/use-app-form";
import { orpcClient } from "@/lib/orpc";
import { defaultFacehashProps, getBucketUrl } from "@/lib/utils";
import { SignedIn } from "../auth/signed-in";
import { SignedOut } from "../auth/signed-out";
import { ErrorField } from "../forms/error-field";
import { RatingDisplay } from "../ratings/rating-display";
import { Button } from "../ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "../ui/input-group";
import { Item, ItemContent, ItemMedia } from "../ui/item";
import { ScrollArea } from "../ui/scroll-area";
import { Spinner } from "../ui/spinner";
import { UserLabel } from "../users/user-label";
import type { PostProps } from "./post-components";

export function CommentSection({ post }: { post: PostProps }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const { emojiMap, stickerMap } = useEmojiStickerMaps();

  const form = useAppForm({
    validators: {
      onSubmit: z.object({
        content: z
          .string()
          .min(10, "Debe tener al menos 10 caracteres.")
          .max(2048, "No puede exceder los 2048 caracteres."),
      }),
    },
    defaultValues: {
      content: "",
    },
    onSubmit: async (formData) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        await orpcClient.post.createComment({
          postId: post.id,
          content: formData.value.content,
        });
        queryClient.invalidateQueries({
          queryKey: ["comments", post.id],
        });
        form.reset();
      } catch (error) {
        toast.error(`Ocurrió un error. ${error}`);
      }
    },
  });

  const currentContent = useStore(form.store, (state) => state.values.content);

  const insertToken = (token: string) => {
    const separator =
      currentContent && !currentContent.endsWith(" ") ? " " : "";
    form.setFieldValue("content", `${currentContent}${separator}${token}`);
  };

  const commentsQuery = useQuery({
    queryKey: ["comments", post.id],
    queryFn: async () => {
      const { comments, authors } = await orpcClient.post.getComments({
        postId: post.id,
      });

      const authorMap = new Map(authors.map((a) => [a.id, a]));

      const commentsWithAuthors = comments.map((c) => ({
        ...c,
        author: c.authorId ? (authorMap.get(c.authorId) ?? null) : null,
      }));

      return commentsWithAuthors;
    },
    enabled: visible,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  if (!commentsQuery.data) {
    return (
      <div
        className="flex min-h-100 items-center justify-center rounded-3xl border bg-card p-6"
        ref={ref}
      >
        <Spinner />
      </div>
    );
  }

  const commentCount = commentsQuery.data.length;

  return (
    <div
      className="flex flex-col gap-6 rounded-3xl border bg-card p-4 md:p-6"
      ref={ref}
    >
      {/* Header with icon and title */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <HugeiconsIcon
              className="size-5 text-primary"
              icon={Comment01Icon}
              strokeWidth={2}
            />
          </div>
          <div className="flex flex-col">
            <h2 className="font-bold text-2xl">Comentarios</h2>
            {commentCount > 0 && (
              <span className="text-muted-foreground text-sm">
                {commentCount}{" "}
                {commentCount === 1 ? "comentario" : "comentarios"}
              </span>
            )}
          </div>
        </div>
        <Button
          nativeButton={false}
          render={<Link params={{ id: post.id }} to={"/post/reviews/$id"} />}
          size="sm"
          variant="outline"
        >
          <RatingDisplay
            averageRating={post.averageRating ?? 0}
            ratingCount={post.ratingCount}
            variant="compact"
          />
        </Button>
      </div>

      {/* Comment Form */}
      <SignedIn>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.AppField name="content">
            {(field) => (
              <div className="flex flex-col gap-2">
                <InputGroup>
                  <InputGroupTextarea
                    className="min-h-24 resize-none border-0 bg-background shadow-sm"
                    id="content"
                    onChange={(e) => field.setValue(e.target.value)}
                    placeholder="Escribe tu comentario..."
                    value={field.state.value}
                  />
                  <InputGroupAddon align="block-end" className="border-t-none">
                    <EmojiPicker onSelect={insertToken} />
                    <StickerPicker
                      currentContent={currentContent}
                      onSelect={insertToken}
                    />
                    <form.Subscribe
                      selector={(state) => [
                        state.canSubmit,
                        state.isSubmitting,
                      ]}
                    >
                      {([canSubmit, isSubmitting]) => (
                        <InputGroupButton
                          className="ml-auto"
                          disabled={!canSubmit}
                          loading={isSubmitting}
                          size="sm"
                          type="submit"
                          variant="default"
                        >
                          <HugeiconsIcon className="size-4" icon={SentIcon} />
                          Enviar
                        </InputGroupButton>
                      )}
                    </form.Subscribe>
                  </InputGroupAddon>
                </InputGroup>
                {field.state.meta.errors.length > 0 && (
                  <Item variant="outline">
                    <ItemMedia>
                      <HugeiconsIcon
                        className="size-5 text-destructive"
                        icon={AlertCircleIcon}
                      />
                    </ItemMedia>
                    <ItemContent>
                      <ErrorField field={field} />
                    </ItemContent>
                  </Item>
                )}
              </div>
            )}
          </form.AppField>
        </form>
      </SignedIn>

      {/* Sign in prompt for logged out users */}
      <SignedOut>
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-muted/30 p-6 text-center">
          <p className="text-muted-foreground">¿Quieres dejar un comentario?</p>
          <Link to="/auth">
            <Button size="sm" variant="outline">
              Iniciar sesión
            </Button>
          </Link>
        </div>
      </SignedOut>

      {/* Comments List */}
      <ScrollArea className="max-h-96">
        <div className="flex flex-col gap-4">
          {commentCount === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <HugeiconsIcon
                  className="size-6 text-muted-foreground"
                  icon={Comment01Icon}
                />
              </div>
              <p className="text-muted-foreground">
                Aún no hay comentarios. ¡Sé el primero!
              </p>
            </div>
          ) : (
            commentsQuery.data
              ?.filter(
                (
                  comment
                  // little workaround to convince TS that author is not null
                ): comment is typeof comment & {
                  author: NonNullable<typeof comment.author>;
                } => comment.author !== null
              )
              .map((comment) => (
                <div
                  className="group flex gap-4 rounded-2xl p-4 hover:bg-muted/30"
                  key={comment.id}
                >
                  <Link params={{ id: comment.author.id }} to="/user/$id">
                    <Avatar className="size-10 rounded-full ring-2 ring-background transition-transform group-hover:scale-105">
                      <AvatarImage
                        src={
                          comment.author.image
                            ? getBucketUrl(comment.author.image)
                            : undefined
                        }
                      />
                      <AvatarFallback
                        className="rounded-full"
                        facehashProps={defaultFacehashProps}
                        name={comment.author.name}
                      />
                    </Avatar>
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link params={{ id: comment.author.id }} to="/user/$id">
                        <UserLabel
                          className="font-semibold transition-colors hover:text-primary"
                          user={comment.author}
                        />
                      </Link>
                      <span className="text-muted-foreground text-xs">•</span>
                      <time className="text-muted-foreground text-xs">
                        {format(comment.createdAt, "d MMM yyyy", {
                          locale: es,
                        })}
                      </time>
                    </div>
                    <CommentContent
                      content={comment.content}
                      emojiMap={emojiMap}
                      stickerMap={stickerMap}
                    />
                  </div>
                </div>
              ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
