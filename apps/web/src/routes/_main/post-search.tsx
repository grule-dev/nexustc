import { and, eq, ilike, useLiveQuery } from "@tanstack/react-db";
import { useStore } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { PostCard } from "@/components/landing/post-card";
import {
  SearchContainer,
  SearchForm,
  SearchResults,
} from "@/components/search/search-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { postCollection, termCollection } from "@/db/collections";
import { useAppForm } from "@/hooks/use-app-form";

const postSearchSchema = z.object({
  query: z.string(),
  engine: z.array(z.string()),
  status: z.array(z.string()),
  platform: z.array(z.string()),
  tag: z.array(z.string()),
});

export const Route = createFileRoute("/_main/post-search")({
  component: RouteComponent,
  validateSearch: z.object({
    tag: z.string().optional(),
  }),
});

function RouteComponent() {
  const params = Route.useSearch();
  const tag: string[] = params.tag ? [params.tag] : [];

  const form = useAppForm({
    validators: {
      onSubmit: postSearchSchema,
    },
    defaultValues: {
      query: "",
      engine: [] as string[],
      status: [] as string[],
      tag,
      platform: [] as string[],
    },
  });

  const { data: terms, isLoading: termsLoading } = useLiveQuery((q) =>
    q.from({ term: termCollection })
  );

  const groupedTerms = Object.groupBy(terms, (term) => term.taxonomy);
  const { values: formState } = useStore(form.store);

  const { data: recentPosts, isLoading: postsLoading } = useLiveQuery(
    (q) =>
      q
        .from({ post: postCollection })
        .where(({ post }) =>
          and(ilike(post.title, `%${formState.query}%`), eq(post.type, "post"))
        )
        .orderBy(({ post }) => post.createdAt, "desc"),
    [formState.query]
  );

  const filteredPosts = recentPosts?.filter((post) => {
    const searchTerms = formState.platform
      .concat(formState.tag, formState.engine, formState.status)
      .filter((term) => term !== "");

    if (searchTerms.length === 0) {
      return true;
    }
    const postTermIds = post.terms?.map((t) => t.id) ?? [];
    return searchTerms.every((term) => postTermIds.includes(term));
  });

  if (termsLoading || postsLoading) {
    return <Spinner />;
  }

  return (
    <SearchContainer label="Buscar Juegos">
      <SearchResults>
        {filteredPosts?.length === 0 ? (
          <div className="flex h-full w-full">
            <p className="text-pretty text-muted-foreground">
              No se encontraron resultados que coincidan con tu búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {filteredPosts?.map((r) => (
              <PostCard key={r.id} post={r} />
            ))}
          </div>
        )}
      </SearchResults>
      <SearchForm
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form.AppField name="query">
              {(field) => <field.TextField label="Buscar" type="text" />}
            </form.AppField>
            <form.AppField name="status">
              {(field) => (
                <field.MultiSelectField
                  label="Estado"
                  options={
                    groupedTerms.status?.map((term) => ({
                      value: term.id,
                      label: term.name,
                    })) ?? []
                  }
                />
              )}
            </form.AppField>
            <form.AppField name="engine">
              {(field) => (
                <field.MultiSelectField
                  label="Motor"
                  options={
                    groupedTerms.engine?.map((term) => ({
                      value: term.id,
                      label: term.name,
                    })) ?? []
                  }
                />
              )}
            </form.AppField>
            <form.AppField name="platform">
              {(field) => (
                <field.MultiSelectField
                  label="Plataformas"
                  options={
                    groupedTerms.platform?.map((term) => ({
                      value: term.id,
                      label: term.name,
                    })) ?? []
                  }
                />
              )}
            </form.AppField>
            <form.AppField name="tag">
              {(field) => (
                <field.MultiSelectField
                  label="Tags"
                  options={
                    groupedTerms.tag?.map((term) => ({
                      value: term.id,
                      label: term.name,
                    })) ?? []
                  }
                />
              )}
            </form.AppField>
          </CardContent>
        </Card>
      </SearchForm>
    </SearchContainer>
  );
}
