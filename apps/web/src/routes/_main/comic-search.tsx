import { useStore } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import z from "zod";
import { PostCard } from "@/components/landing/post-card";
import {
  SearchContainer,
  SearchForm,
  SearchResults,
} from "@/components/search/search-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppForm } from "@/hooks/use-app-form";
import { useDebounceEffect } from "@/hooks/use-debounce-effect";
import { useTerms } from "@/hooks/use-terms";
import { orpcClient } from "@/lib/orpc";

const searchParamsSchema = z.object({
  query: z.string().optional(),
  tag: z.array(z.string()).optional().default([]),
});

const postSearchSchema = z.object({
  query: z.string(),
  tag: z.array(z.string()),
});

export const Route = createFileRoute("/_main/comic-search")({
  component: RouteComponent,
  validateSearch: searchParamsSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    // Combine all term IDs from the search params
    const termIds = deps.tag ?? [];

    const filteredPosts = await orpcClient.post.search({
      type: "comic",
      query: deps.query,
      termIds: termIds.length > 0 ? termIds : undefined,
    });

    return { filteredPosts };
  },
  head: () => ({
    meta: [
      {
        title: "NeXusTC - Buscar Cómics",
      },
    ],
  }),
});

function RouteComponent() {
  const params = Route.useSearch();
  const { filteredPosts } = Route.useLoaderData();
  const navigate = useNavigate();
  const termsQuery = useTerms();

  const form = useAppForm({
    validators: {
      onSubmit: postSearchSchema,
    },
    defaultValues: {
      query: params.query ?? "",
      tag: params.tag ?? [],
    },
  });

  // Watch form values for debounced search
  const formValues = useStore(form.store, (state) => state.values);

  // Debounced navigation - triggers 300ms after form values change
  useDebounceEffect(
    () => {
      navigate({
        to: "/comic-search",
        search: {
          query: formValues.query || undefined,
          tag: formValues.tag.length > 0 ? formValues.tag : undefined,
        },
      });
    },
    300,
    [formValues.query, formValues.tag]
  );

  if (termsQuery.isPending) {
    return <div>Loading...</div>;
  }

  if (termsQuery.isError) {
    return <div>Error</div>;
  }

  const groupedTerms = Object.groupBy(termsQuery.data, (t) => t.taxonomy);

  return (
    <SearchContainer label="Buscar Cómics">
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
