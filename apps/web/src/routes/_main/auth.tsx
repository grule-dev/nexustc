import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Turnstile } from "@marsidev/react-turnstile";
import { auth } from "@repo/auth";
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppForm } from "@/hooks/use-app-form";
import { authClient, getAuthErrorMessage } from "@/lib/auth-client";

const redirectMiddleware = createMiddleware().server(
  async ({ request, next }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session) {
      throw redirect({ to: "/profile", replace: true });
    }
    return await next();
  }
);

export const Route = createFileRoute("/_main/auth")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (session.data?.session) {
      throw redirect({ to: "/profile", replace: true });
    }
  },
  head: () => ({
    meta: [
      {
        title: "NeXusTC - Autenticación",
      },
    ],
  }),
  server: {
    middleware: [redirectMiddleware],
  },
});

const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z
    .string()
    .min(8, "Debe tener al menos 8 caracteres")
    .max(64, "Debe tener como máximo 64 caracteres"),
  turnstileToken: z.string().nonempty("Por favor completa el CAPTCHA"),
});

const registerSchema = z
  .object({
    name: z.string(),
    email: z.email("Email inválido"),
    password: z
      .string()
      .min(8, "Debe tener al menos 8 caracteres")
      .max(64, "Debe tener como máximo 64 caracteres"),
    confirmPassword: z.string(),
    turnstileToken: z.string().nonempty("Por favor completa el CAPTCHA"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

const getErrorMessage = (err: { message?: string; code?: string }): string => {
  const authMessage = err.code && getAuthErrorMessage(err.code);

  if (err.code && authMessage) {
    return authMessage;
  }

  if (err.message) {
    return err.message;
  }

  return "Ha ocurrido un error. Inténtalo nuevamente.";
};

function RouteComponent() {
  const [tab, setTab] = useState("login");
  const [error, setError] = useState<string>();
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const navigate = useNavigate();

  const loginForm = useAppForm({
    validators: {
      onSubmit: loginSchema,
    },
    defaultValues: {
      email: "",
      password: "",
      turnstileToken: "",
    },
    onSubmit: async ({ value }) => {
      try {
        setError(undefined);

        toast.loading("Iniciando sesión...", { id: "auth" });

        const { error: authError } = await authClient.signIn.email({
          email: value.email,
          password: value.password,
          callbackURL: window.location.origin,
          fetchOptions: {
            headers: {
              "x-captcha-response": value.turnstileToken,
            },
          },
        });

        if (authError) {
          toast.dismiss("auth");

          if (authError.status === 403) {
            toast.error(
              "Por favor verifica tu dirección de correo electrónico antes de iniciar sesión. Se te ha enviado un nuevo correo de verificación."
            );
            return;
          }

          setError(getErrorMessage(authError));
          return;
        }

        toast.dismiss("auth");

        navigate({ to: "/" });
      } catch (err) {
        toast.dismiss("auth");
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        loginForm.resetField("turnstileToken");
      }
    },
  });

  const registerForm = useAppForm({
    validators: {
      onSubmit: registerSchema,
    },
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      turnstileToken: "",
    },
    onSubmit: async ({ value }) => {
      try {
        setError(undefined);

        toast.loading("Registrando...", { id: "auth" });

        const { error: authError } = await authClient.signUp.email({
          name: value.name,
          email: value.email,
          password: value.password,
          callbackURL: "/",
          fetchOptions: {
            headers: {
              "x-captcha-response": value.turnstileToken,
            },
          },
        });

        if (authError) {
          toast.dismiss("auth");
          setError(getErrorMessage(authError));
          return;
        }

        toast.dismiss("auth");
        toast.success(
          "Se ha enviado un correo a su cuenta de correo electrónico. Por favor verifique su correo antes de iniciar sesión."
        );
        setShowVerificationDialog(true);
        setTab("login");
        registerForm.resetField("password");
        registerForm.resetField("confirmPassword");
        registerForm.resetField("turnstileToken");
      } catch (err) {
        toast.dismiss("auth");
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        registerForm.resetField("turnstileToken");
      }
    },
  });

  return (
    <Card className="min-w-sm">
      <CardContent>
        <Tabs
          defaultValue="login"
          onValueChange={(newTab) => {
            setTab(newTab);
            loginForm.resetField("turnstileToken");
            registerForm.resetField("turnstileToken");
            setError(undefined); // Clear errors when switching tabs
          }}
          value={tab}
        >
          <TabsList className="w-full">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                loginForm.handleSubmit();
              }}
            >
              <loginForm.AppField name="email">
                {(field) => <field.TextField label="Email" type="email" />}
              </loginForm.AppField>
              <loginForm.AppField name="password">
                {(field) => (
                  <field.TextField label="Contraseña" type="password" />
                )}
              </loginForm.AppField>
              <Link to="/forgot-password">
                <Button className="p-0" type="button" variant="link">
                  ¿Olvidaste tu contraseña?
                </Button>
              </Link>
              <loginForm.AppField name="turnstileToken">
                {(field) => (
                  <TurnstileContainer
                    setToken={(token) => field.setValue(token)}
                  />
                )}
              </loginForm.AppField>
              {!!error && (
                <Alert variant="destructive">
                  <HugeiconsIcon icon={AlertCircleIcon} />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <loginForm.AppForm>
                <loginForm.SubmitButton>Iniciar Sesión</loginForm.SubmitButton>
              </loginForm.AppForm>
              {!!showVerificationDialog && (
                <Alert variant="default">
                  <AlertTitle>Verifica tu correo</AlertTitle>
                  <AlertDescription>
                    <span>
                      Se ha enviado una verificación a su casilla de correo.
                      <br />
                      Por favor, verifiquela para poder acceder al sitio,
                    </span>
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                registerForm.handleSubmit();
              }}
            >
              <registerForm.AppField name="name">
                {(field) => (
                  <field.TextField
                    label="Nombre de Usuario"
                    placeholder="Usuario"
                  />
                )}
              </registerForm.AppField>
              <registerForm.AppField name="email">
                {(field) => <field.TextField label="Email" type="email" />}
              </registerForm.AppField>
              <registerForm.AppField name="password">
                {(field) => (
                  <field.TextField label="Contraseña" type="password" />
                )}
              </registerForm.AppField>
              <registerForm.AppField name="confirmPassword">
                {(field) => (
                  <field.TextField
                    label="Confirmar Contraseña"
                    type="password"
                  />
                )}
              </registerForm.AppField>
              <registerForm.AppField name="turnstileToken">
                {(field) => (
                  <TurnstileContainer
                    setToken={(token) => field.setValue(token)}
                  />
                )}
              </registerForm.AppField>
              {!!error && (
                <Alert variant="destructive">
                  <HugeiconsIcon icon={AlertCircleIcon} />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <registerForm.AppForm>
                <registerForm.SubmitButton>
                  Registrarse
                </registerForm.SubmitButton>
              </registerForm.AppForm>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function TurnstileContainer({
  setToken,
}: {
  setToken: (token: string) => void;
}) {
  return (
    <Turnstile
      onError={() => setToken("")}
      onSuccess={setToken}
      options={{
        theme: "auto",
        size: "flexible",
      }}
      // biome-ignore lint/style/noNonNullAssertion: we don't know if it's null
      siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY!}
    />
  );
}
