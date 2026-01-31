import { ShuffleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useStore } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import z from "zod";
import { PostCard } from "@/components/landing/post-card";
import {
  SearchContainer,
  SearchFilters,
  SearchFiltersButton,
  SearchForm,
  SearchResults,
} from "@/components/search/search-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const typeSchema = z.enum(["juegos", "comics"]);

const searchParamsSchema = z.object({
  type: typeSchema.optional().default("juegos"),
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

const comicSearchSchema = z.object({
  query: z.string(),
  tag: z.array(z.string()),
  orderBy: orderBySchema,
});

export const Route = createFileRoute("/_main/search")({
  component: RouteComponent,
  validateSearch: searchParamsSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const isComic = deps.type === "comics";
    const termIds = isComic
      ? (deps.tag ?? [])
      : [
          ...(deps.engine ?? []),
          ...(deps.status ?? []),
          ...(deps.platform ?? []),
          ...(deps.tag ?? []),
        ];

    const filteredPosts = await orpcClient.post.search({
      type: isComic ? "comic" : "post",
      query: deps.query,
      termIds: termIds.length > 0 ? termIds : undefined,
      orderBy: deps.orderBy,
    });

    return { filteredPosts };
  },
  head: () => ({
    meta: [
      {
        title: "NeXusTC - Buscar",
      },
    ],
  }),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = useNavigate();

  const handleTabChange = (value: string | null) => {
    if (value === "juegos" || value === "comics") {
      navigate({
        to: "/search",
        search: { type: value },
      });
    }
  };

  return (
    <main className="container w-full space-y-6 p-6 py-0">
      <h1 className="font-bold text-2xl">Buscar</h1>
      <Tabs onValueChange={handleTabChange} value={params.type ?? "juegos"}>
        <TabsList className="w-full max-w-xl">
          <TabsTrigger value="juegos">Juegos</TabsTrigger>
          <TabsTrigger value="comics">Cómics</TabsTrigger>
        </TabsList>
        <TabsContent value="juegos">
          <PostSearch />
        </TabsContent>
        <TabsContent value="comics">
          <ComicSearch />
        </TabsContent>
      </Tabs>
    </main>
  );
}

function PostSearch() {
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

  const formValues = useStore(form.store, (state) => state.values);

  useDebounceEffect(
    () => {
      navigate({
        to: "/search",
        search: {
          type: "juegos",
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
    <SearchContainer>
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
          <CardContent className="flex flex-col gap-4">
            <form.AppField name="query">
              {(field) => <field.TextField label="Buscar" type="text" />}
            </form.AppField>
            <SearchFiltersButton />
            <SearchFilters>
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
            </SearchFilters>
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

function ComicSearch() {
  const params = Route.useSearch();
  const { filteredPosts } = Route.useLoaderData();
  const navigate = useNavigate();
  const termsQuery = useTerms();

  const form = useAppForm({
    validators: {
      onSubmit: comicSearchSchema,
    },
    defaultValues: {
      query: params.query ?? "",
      tag: params.tag ?? [],
      orderBy: params.orderBy ?? "views",
    },
  });

  const formValues = useStore(form.store, (state) => state.values);

  useDebounceEffect(
    () => {
      navigate({
        to: "/search",
        search: {
          type: "comics",
          query: formValues.query || undefined,
          tag: formValues.tag.length > 0 ? formValues.tag : undefined,
          orderBy: formValues.orderBy,
        },
      });
    },
    300,
    [formValues.query, formValues.tag, formValues.orderBy]
  );

  const handleRandomComic = async () => {
    const result = await orpcClient.post.getRandom({ type: "comic" });
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
    <SearchContainer>
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
          <CardContent className="flex flex-col gap-4">
            <form.AppField name="query">
              {(field) => <field.TextField label="Buscar" type="text" />}
            </form.AppField>
            <SearchFiltersButton />
            <SearchFilters>
              <form.AppField name="orderBy">
                {(field) => (
                  <field.SelectField
                    label="Ordenar por"
                    options={[...ORDER_OPTIONS]}
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
            </SearchFilters>
            <Button
              className="w-full"
              onClick={handleRandomComic}
              type="button"
              variant="outline"
            >
              <HugeiconsIcon icon={ShuffleIcon} />
              Cómic Aleatorio
            </Button>
          </CardContent>
        </Card>
      </SearchForm>
    </SearchContainer>
  );
}
