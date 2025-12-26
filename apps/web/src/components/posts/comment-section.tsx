import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useRef, useState } from "react";
import z from "zod";
import { useAppForm } from "@/hooks/use-app-form";
import { getBucketUrl } from "@/lib/utils";
import { orpcClient } from "@/utils/orpc";
import { SignedIn } from "../auth/signed-in";
import { SignedOut } from "../auth/signed-out";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Spinner } from "../ui/spinner";
import { UserLabel } from "../users/user-label";

export function CommentSection({ postId }: { postId: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

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
      await orpcClient.post.createComment({
        postId,
        content: formData.value.content,
      });
    },
  });

  const commentsQuery = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { comments, authors } = await orpcClient.post.getComments({
        postId,
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
      <div className="flex items-center justify-center p-6" ref={ref}>
        <Spinner />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-bold text-4xl">Comentarios</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <SignedIn>
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.AppField name="content">
              {(field) => (
                <field.TextareaField
                  className="min-h-30 resize-none"
                  label="Escribir Comentario"
                />
              )}
            </form.AppField>
            <form.AppForm>
              <form.SubmitButton className="self-end">Enviar</form.SubmitButton>
            </form.AppForm>
          </form>
        </SignedIn>
        <Separator orientation="horizontal" />
        {commentsQuery.data.length === 0 ? (
          <p className="text-xl">Aún no hay comentarios. ¡Deja el tuyo!</p>
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
              <Card key={comment.id}>
                <CardContent>
                  <div className="flex flex-row gap-4">
                    <Link params={{ id: comment.author.id }} to={"/user/$id"}>
                      <Avatar className="size-12">
                        <AvatarImage
                          src={
                            comment.author.image
                              ? getBucketUrl(comment.author.image)
                              : undefined
                          }
                        />
                        <AvatarFallback>
                          {comment.author.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex w-full flex-col gap-4">
                      <div className="flex flex-row items-center justify-between gap-2">
                        <Link
                          params={{ id: comment.author.id }}
                          to={"/user/$id"}
                        >
                          <UserLabel
                            className="font-semibold"
                            user={comment.author}
                          />
                        </Link>
                        <p className="text-muted-foreground text-sm">
                          {format(comment.createdAt, "PPPP", {
                            locale: es,
                          })}
                        </p>
                      </div>
                      <p>{comment.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
        <SignedOut>
          <p className="text-muted-foreground">
            <Link to="/auth">Inicia sesión</Link> para dejar un comentario.
          </p>
        </SignedOut>
      </CardContent>
    </Card>
  );
}
