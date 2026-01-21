import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import { DiscordLogo } from "@/components/icons/discord";
import { PatreonLogo } from "@/components/icons/patreon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppForm } from "@/hooks/use-app-form";
import { authClient, getAuthErrorMessage } from "@/lib/auth-client";
import { getBucketUrl } from "@/lib/utils";
import "react-image-crop/dist/ReactCrop.css";
import {
  Cancel01Icon,
  HelpCircleIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Suspense } from "react";
import { HoverReveal } from "@/components/hover-reveal";
import { PostCard } from "@/components/landing/post-card";
import { AvatarSection } from "@/components/profile/avatar-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { UserLabel } from "@/components/users/user-label";
import { orpc } from "@/lib/orpc";
import { authMiddleware } from "@/middleware/auth";

export const Route = createFileRoute("/_main/profile")({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: "NeXusTC - Perfil",
      },
    ],
  }),
  server: {
    middleware: [authMiddleware],
  },
});

function RouteComponent() {
  const auth = authClient.useSession();

  if (auth.isPending) {
    return <Spinner />;
  }

  if (!auth.data?.user) {
    return <Navigate replace={true} to="/auth" />;
  }

  const session = auth.data;

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <Card className="col-span-1 col-start-1 w-full md:col-span-3 md:col-start-2">
        <CardHeader>
          <CardTitle className="font-bold text-2xl">Perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex w-full flex-col justify-around gap-6 md:flex-row">
          <section className="flex flex-col items-center gap-2">
            <Avatar className="size-32">
              <AvatarImage
                src={
                  session.user.image
                    ? getBucketUrl(session.user.image)
                    : undefined
                }
              />
              <AvatarFallback>
                {session.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <UserLabel className="text-2xl" user={session.user} />
            <HoverReveal blur="blur-sm" className="p-4">
              <p className="text-muted-foreground">{session.user.email}</p>
            </HoverReveal>
          </section>
          {/* <Separator className="hidden md:block" orientation="vertical" /> */}
          <section className="w-md">
            <Tabs className="flex-1" defaultValue="account">
              <TabsList className="w-full">
                <TabsTrigger value="account">Cuentas</TabsTrigger>
                <TabsTrigger value="avatar">Avatar</TabsTrigger>
                <TabsTrigger value="password">Contraseña</TabsTrigger>
              </TabsList>
              <TabsContent value="account">
                <AccountsSection />
              </TabsContent>
              <TabsContent value="avatar">
                <AvatarSection />
              </TabsContent>
              <TabsContent value="password">
                <h2 className="font-bold text-2xl">Cambiar Contraseña</h2>
                <ChangePasswordForm />
              </TabsContent>
            </Tabs>
          </section>
        </CardContent>
      </Card>
      <Suspense fallback={<Spinner />}>
        <PatreonStatusSection />
      </Suspense>
      <Suspense fallback={<Spinner />}>
        <UserBookmarks />
      </Suspense>
    </div>
  );
}

function AccountsSection() {
  const { data: accounts } = useSuspenseQuery({
    queryKey: ["accounts"],
    queryFn: () => authClient.listAccounts().then((res) => res.data),
    staleTime: 1000 * 60,
  });
  const queryClient = useQueryClient();

  const providers: Record<string, string | null> = {
    discord: null,
    patreon: null,
  } as const;

  for (const account of accounts ?? []) {
    if (providers[account.providerId] !== undefined) {
      providers[account.providerId] = account.accountId;
    }
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <h2 className="font-bold text-2xl">Cuentas Vinculadas</h2>
      {accounts?.length === 1 && <p>No tienes cuentas vinculadas.</p>}
      {Object.entries(providers).map(([provider, accountId]) => {
        const providerData = matchProvider(provider);

        if (!accountId) {
          return (
            <Button
              key={provider}
              onClick={() => {
                authClient.linkSocial({ provider, callbackURL: "/profile" });
              }}
            >
              {providerData.Icon}
              Vincular {providerData.label}
            </Button>
          );
        }

        return (
          <div
            className="flex w-full items-center justify-between rounded-2xl border px-4 py-2"
            key={provider}
          >
            <div className="flex items-center gap-2">
              {providerData.Icon}
              <span className="font-medium">{providerData.label}</span>
            </div>
            <Button
              onClick={async () => {
                await authClient.unlinkAccount({
                  providerId: provider,
                  accountId,
                });
                queryClient.invalidateQueries({ queryKey: ["accounts"] });
              }}
              size="icon"
              variant="destructive"
            >
              <HugeiconsIcon icon={Cancel01Icon} />
            </Button>
          </div>
        );
      })}
      <Button
        onClick={async () => {
          authClient.signOut();
          await queryClient.invalidateQueries({ queryKey: ["session"] });
        }}
        variant="destructive"
      >
        Cerrar Sesión
      </Button>
    </div>
  );
}

function ChangePasswordForm() {
  const form = useAppForm({
    validators: {
      onSubmit: z.object({
        currentPassword: z.string().min(1, "Requerido"),
        newPassword: z
          .string()
          .min(8, "Debe tener al menos 8 caracteres")
          .max(64, "Debe tener como máximo 64 caracteres"),
        confirmNewPassword: z
          .string()
          .min(8, "Debe tener al menos 8 caracteres")
          .max(64, "Debe tener como máximo 64 caracteres"),
      }),
    },
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    onSubmit: async () => {
      const values = form.state.values;

      try {
        const { error } = await authClient.changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          revokeOtherSessions: true,
        });

        if (error) {
          toast.error(
            error.code ? getAuthErrorMessage(error.code) : error.message
          );
          return;
        }

        toast.success("Contraseña cambiada exitosamente!");
        form.reset();
      } catch (error) {
        console.error(error);
      }
    },
  });

  return (
    <form
      className="mt-4 flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.AppField name="currentPassword">
        {(field) => (
          <field.TextField label="Contraseña Actual" type="password" />
        )}
      </form.AppField>
      <form.AppField name="newPassword">
        {(field) => (
          <field.TextField label="Nueva Contraseña" type="password" />
        )}
      </form.AppField>
      <form.AppField name="confirmNewPassword">
        {(field) => (
          <field.TextField label="Confirmar Nueva Contraseña" type="password" />
        )}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton>Cambiar Contraseña</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}

function matchProvider(provider: string) {
  const defaultProps = {
    className: "size-6",
  };

  switch (provider) {
    case "discord":
      return { Icon: <DiscordLogo {...defaultProps} />, label: "Discord" };
    case "patreon":
      return { Icon: <PatreonLogo {...defaultProps} />, label: "Patreon" };
    default:
      return {
        Icon: <HugeiconsIcon icon={HelpCircleIcon} {...defaultProps} />,
        label: provider,
      };
  }
}

function UserBookmarks() {
  const { data } = useSuspenseQuery(orpc.user.getBookmarksFull.queryOptions());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tus Favoritos</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4">
        {data.map((bookmark) => (
          <PostCard key={bookmark.id} post={bookmark} />
        ))}
      </CardContent>
    </Card>
  );
}

const TIER_STYLES: Record<string, string> = {
  tier1: "bg-amber-100 text-amber-800 border-amber-200",
  tier2: "bg-purple-100 text-purple-800 border-purple-200",
  tier3:
    "bg-gradient-to-r from-amber-400 to-amber-600 text-white border-amber-500",
};

function PatreonStatusSection() {
  const { data: status } = useSuspenseQuery(
    orpc.patreon.getStatus.queryOptions()
  );
  const syncMutation = useMutation(
    orpc.patreon.syncMembership.mutationOptions()
  );
  const queryClient = useQueryClient();

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync({});
      await queryClient.invalidateQueries({
        queryKey: orpc.patreon.getStatus.queryOptions().queryKey,
      });
      toast.success("Estado de Patreon sincronizado");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al sincronizar"
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PatreonLogo className="size-5" />
          Estado de Patreon
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {status.isPatron ? (
          <>
            <div className="flex items-center gap-2">
              <Badge className={TIER_STYLES[status.tier] ?? ""}>
                {status.benefits.badge}
              </Badge>
              {status.patronSince && (
                <span className="text-muted-foreground text-sm">
                  Miembro desde el{" "}
                  {format(status.patronSince, "PPP", { locale: es })}
                </span>
              )}
            </div>
            <div className="text-sm">
              <p className="mb-2 font-medium">Beneficios activos:</p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                {status.benefits.badge && (
                  <li>Badge: {status.benefits.badge}</li>
                )}
                {status.benefits.adFree && <li>Experiencia sin anuncios</li>}
                {status.benefits.premiumLinks && (
                  <li>Acceso a enlaces premium</li>
                )}
              </ul>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">
            No eres un Patron activo. Vincula tu cuenta de Patreon en la sección
            "Cuentas" y sincroniza para ver tus beneficios.
          </p>
        )}

        <div className="flex items-center gap-4">
          <Button
            disabled={syncMutation.isPending}
            onClick={handleSync}
            size="sm"
            variant="outline"
          >
            {syncMutation.isPending ? (
              <Spinner className="size-4" />
            ) : (
              <HugeiconsIcon className="size-4" icon={RefreshIcon} />
            )}
            Sincronizar Patreon
          </Button>
          {status.lastSyncAt && (
            <p className="text-muted-foreground text-xs">
              Última sincronización:{" "}
              {new Date(status.lastSyncAt).toLocaleString("es", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
