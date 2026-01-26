import { ShuffleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useStore } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import z from "zod";
import { PostCard } from "@/components/landing/post-card";
import {
  SearchContainer,
  SearchForm,
  SearchResults,
} from "@/components/search/search-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppForm } from "@/hooks/use-app-form";
import { useDebounceEffect } from "@/hooks/use-debounce-effect";
import { useTerms } from "@/hooks/use-terms";
import { orpcClient } from "@/lib/orpc";

const ORDER_OPTIONS = [
  { value: "views", label: "Más Vistos" },
  { value: "newest", label: "Más Recientes" },
  { value: "oldest", label: "Más Antiguos" },
  { value: "title_asc", label: "Título (A-Z)" },
  { value: "title_desc", label: "Título (Z-A)" },
  { value: "rating_avg", label: "Mejor Valorados" },
  { value: "rating_count", label: "Más Valoraciones" },
  { value: "likes", label: "Más Likes" },
] as const;

const orderBySchema = z.enum([
  "newest",
  "oldest",
  "title_asc",
  "title_desc",
  "views",
  "rating_avg",
  "rating_count",
  "likes",
]);

const searchParamsSchema = z.object({
  query: z.string().optional(),
  engine: z.array(z.string()).optional().default([]),
  status: z.array(z.string()).optional().default([]),
  platform: z.array(z.string()).optional().default([]),
  tag: z.array(z.string()).optional().default([]),
  orderBy: orderBySchema.optional().default("views"),
});

const postSearchSchema = z.object({
  query: z.string(),
  engine: z.array(z.string()),
  status: z.array(z.string()),
  platform: z.array(z.string()),
  tag: z.array(z.string()),
  orderBy: orderBySchema,
});

export const Route = createFileRoute("/_main/post-search")({
  component: RouteComponent,
  validateSearch: searchParamsSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    // Combine all term IDs from the search params
    const termIds = [
      ...(deps.engine ?? []),
      ...(deps.status ?? []),
      ...(deps.platform ?? []),
      ...(deps.tag ?? []),
    ];

    const filteredPosts = await orpcClient.post.search({
      type: "post",
      query: deps.query,
      termIds: termIds.length > 0 ? termIds : undefined,
      orderBy: deps.orderBy,
    });

    return { filteredPosts };
  },
  head: () => ({
    meta: [
      {
        title: "NeXusTC - Buscar Juegos",
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
      engine: params.engine ?? [],
      status: params.status ?? [],
      tag: params.tag ?? [],
      platform: params.platform ?? [],
      orderBy: params.orderBy ?? "views",
    },
  });

  // Watch form values for debounced search
  const formValues = useStore(form.store, (state) => state.values);

  // Debounced navigation - triggers 300ms after form values change
  useDebounceEffect(
    () => {
      navigate({
        to: "/post-search",
        search: {
          query: formValues.query || undefined,
          engine: formValues.engine.length > 0 ? formValues.engine : undefined,
          status: formValues.status.length > 0 ? formValues.status : undefined,
          platform:
            formValues.platform.length > 0 ? formValues.platform : undefined,
          tag: formValues.tag.length > 0 ? formValues.tag : undefined,
          orderBy: formValues.orderBy,
        },
      });
    },
    300,
    [
      formValues.query,
      formValues.engine,
      formValues.status,
      formValues.platform,
      formValues.tag,
      formValues.orderBy,
    ]
  );

  const handleRandomPost = async () => {
    const result = await orpcClient.post.getRandom({ type: "post" });
    if (result) {
      navigate({ to: "/post/$id", params: { id: result.id } });
    }
  };

  if (termsQuery.isPending) {
    return <div>Loading...</div>;
  }

  if (termsQuery.isError) {
    return <div>Error</div>;
  }

  const groupedTerms = Object.groupBy(termsQuery.data, (t) => t.taxonomy);

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
            <form.AppField name="orderBy">
              {(field) => (
                <field.SelectField
                  label="Ordenar por"
                  options={[...ORDER_OPTIONS]}
                />
              )}
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
            <Button
              className="w-full"
              onClick={handleRandomPost}
              type="button"
              variant="outline"
            >
              <HugeiconsIcon icon={ShuffleIcon} />
              Juego Aleatorio
            </Button>
          </CardContent>
        </Card>
      </SearchForm>
    </SearchContainer>
  );
}
