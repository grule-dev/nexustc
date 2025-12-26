import { format } from "date-fns";
import { es } from "date-fns/locale";
import Zoom from "react-medium-image-zoom";
import { TermBadge } from "@/components/term-badge";
import type { PostType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Markdown } from "../markdown";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { BookmarkButton } from "./bookmark-button";

export type PostProps = Omit<
  PostType,
  "likes" | "favorites" | "isWeekly" | "type"
>;

export function Post({ post }: { post: PostProps }) {
  const groupedTerms = Object.groupBy(post.terms, (term) => term.taxonomy);

  return (
    <div className="flex flex-col gap-6 rounded-2xl border bg-card p-6">
      <div className="flex flex-col gap-4">
        <div className="flex w-full flex-row items-end justify-center gap-2">
          <h1 className="text-center font-bold text-4xl">{post.title}</h1>
          {!!post.version && (
            <span className="font-bold text-muted-foreground text-xl">
              ({post.version})
            </span>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex w-full flex-row items-center justify-between">
        <Badge className="flex flex-row items-center justify-center gap-2 rounded-full px-3 py-1 text-sm">
          <p>{format(post.createdAt, "PPP", { locale: es })}</p>
        </Badge>
        <div className="flex flex-row items-center gap-4">
          <BookmarkButton postId={post.id} />
        </div>
      </div>

      {post.imageObjectKeys && post.imageObjectKeys.length > 0 && (
        <img
          alt={`Imagen de portada de ${post.title}`}
          className="rounded-xl"
          src={post.imageObjectKeys[0]}
        />
      )}

      <Section>
        {post.content !== "" && (
          <>
            <SectionItem>
              <SectionContent>
                <SectionTitle>Sinopsis</SectionTitle>
                <Markdown>{post.content}</Markdown>
              </SectionContent>
            </SectionItem>
            <Separator />
          </>
        )}
        {post.imageObjectKeys && post.imageObjectKeys.length > 0 && (
          <>
            <SectionItem>
              <SectionContent>
                <SectionTitle>Imágenes</SectionTitle>
                <div className="grid grid-cols-3 gap-4 md:grid-cols-4">
                  {post.imageObjectKeys.map((image) => (
                    <Zoom key={image}>
                      <img
                        alt={`Imagen adjunta de ${post.title}`}
                        className="rounded-md"
                        src={image}
                      />
                    </Zoom>
                  ))}
                </div>
              </SectionContent>
            </SectionItem>
            <Separator />
          </>
        )}
        {!!post.authorContent && (
          <>
            <SectionItem>
              <SectionContent>
                <SectionTitle>Apoya al Creador</SectionTitle>
                <Markdown>{post.authorContent ?? ""}</Markdown>
              </SectionContent>
            </SectionItem>
            <Separator />
          </>
        )}
        {!!post.adsLinks && (
          <>
            <SectionItem>
              <SectionContent>
                <SectionTitle>Links de Descarga Anuncios</SectionTitle>
                <Markdown>{post.adsLinks ?? ""}</Markdown>
              </SectionContent>
            </SectionItem>
            <Separator />
          </>
        )}
        <SectionItem>
          <SectionContent>
            <SectionTitle>Tags</SectionTitle>
            <PostBadges terms={groupedTerms.tag} />
            <div className="flex flex-wrap gap-4">
              <PostBadges label="Plataformas" terms={groupedTerms.platform} />
              <PostBadges label="Idiomas" terms={groupedTerms.language} />
              <PostBadges label="Motor" terms={groupedTerms.engine} />
              <PostBadges label="Gráficos" terms={groupedTerms.graphics} />
              <PostBadges label="Censura" terms={groupedTerms.censorship} />
              <PostBadges label="Estado" terms={groupedTerms.status} />
            </div>
          </SectionContent>
        </SectionItem>
      </Section>
    </div>
  );
}

function PostBadges({
  label,
  terms,
}: {
  label?: string;
  terms:
    | { id: string; name: string; color: string | null | undefined }[]
    | undefined;
}) {
  if (terms === undefined || terms.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-row gap-2">
      {!!label && <h3 className="font-bold">{label}: </h3>}
      <div className="flex flex-wrap gap-2">
        {terms.map((term) => (
          <TermBadge key={term.id} tag={term} />
        ))}
      </div>
    </div>
  );
}

function Section(props: React.ComponentProps<"section">) {
  return (
    <section className={cn("flex flex-col gap-6", props.className)} {...props}>
      {props.children}
    </section>
  );
}

function SectionItem(props: React.ComponentProps<"div">) {
  return (
    <div className={cn(props.className)} {...props}>
      {props.children}
    </div>
  );
}

function SectionTitle(props: React.ComponentProps<"h3">) {
  return (
    <h3
      {...props}
      className={cn("font-bold text-2xl leading-tight", props.className)}
    >
      {props.children}
    </h3>
  );
}

function SectionContent(props: React.ComponentProps<"div">) {
  return (
    <div {...props} className={cn("flex flex-col gap-4", props.children)}>
      {props.children}
    </div>
  );
}
