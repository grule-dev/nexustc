import { and, eq, ilike, inArray, useLiveQuery } from "@tanstack/react-db";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { SearchIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import Zoom from "react-medium-image-zoom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { postCollection } from "@/db/collections";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/extras/weekly")({
  component: RouteComponent,
});

function RouteComponent() {
  const [search, setSearch] = useState("");
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const weeklyMutation = useMutation(
    orpc.post.admin.uploadWeeklyPosts.mutationOptions()
  );
  const router = useRouter();

  const postsQuery = useLiveQuery(
    (q) =>
      q
        .from({ post: postCollection })
        .where(({ post }) =>
          and(eq(post.type, "post"), ilike(post.title, `%${search}%`))
        ),
    [search]
  );
  const selectedPostsQuery = useLiveQuery(
    (q) =>
      q
        .from({ post: postCollection })
        .where(({ post }) => inArray(post.id, selectedPosts)),
    [selectedPosts]
  );

  useEffect(() => {
    setSelectedPosts(
      postsQuery.data.filter((post) => post.isWeekly).map((post) => post.id)
    );
  }, [postsQuery.data]);

  if (postsQuery.isLoading) {
    return <Spinner />;
  }

  const updateWeeklys = async () => {
    await weeklyMutation.mutateAsync(selectedPosts);
    router.navigate({
      to: "/admin",
    });
  };

  return (
    <main className="flex flex-col gap-6">
      <h1 className="font-bold text-2xl">Juegos de la Semana</h1>
      <div className="flex flex-row items-center gap-4">
        <h2>Juegos Seleccionados</h2>
        <Button loading={weeklyMutation.isPending} onClick={updateWeeklys}>
          Actualizar
        </Button>
      </div>
      <ItemGroup className="grid grid-cols-5 gap-4">
        {selectedPostsQuery.data.map((post) => (
          <Item className="overflow-hidden" key={post.id} variant="muted">
            <Zoom>
              <ItemMedia className="size-12" variant="image">
                <img alt={post.title} src={post.imageObjectKeys?.[0]} />
              </ItemMedia>
            </Zoom>
            <ItemContent>
              <ItemTitle className="w-fit min-w-0 text-ellipsis">
                {post.title}
              </ItemTitle>
              {!!post.version && (
                <ItemDescription>{post.version}</ItemDescription>
              )}
            </ItemContent>
            <ItemActions>
              <Button
                onClick={() =>
                  setSelectedPosts((oldPosts) =>
                    oldPosts.filter((p) => p !== post.id)
                  )
                }
                size="icon"
                variant="outline"
              >
                <XIcon />
              </Button>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
      <FieldGroup>
        <FieldSet>
          <InputGroup>
            <InputGroupInput
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              value={search}
            />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>
            Es posible que los juegos subidos o actualizados recientemente aún
            no estén disponibles.
          </FieldDescription>
          <div className="grid grid-cols-5 gap-4">
            {postsQuery.data.map((post) => (
              <FieldLabel htmlFor={post.id} key={post.id}>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>{post.title}</FieldTitle>
                  </FieldContent>
                  <Checkbox
                    checked={selectedPosts.includes(post.id)}
                    id={post.id}
                    onCheckedChange={(v) =>
                      setSelectedPosts(
                        v
                          ? [...selectedPosts, post.id]
                          : selectedPosts.filter((id) => id !== post.id)
                      )
                    }
                    value={post.id}
                  />
                </Field>
              </FieldLabel>
            ))}
          </div>
        </FieldSet>
      </FieldGroup>
    </main>
  );
}
