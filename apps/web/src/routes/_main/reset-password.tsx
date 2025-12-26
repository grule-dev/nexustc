import { createFileRoute, Navigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { toast } from "sonner";
import z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppForm } from "@/hooks/use-app-form";
import { authClient, getAuthErrorMessage } from "@/lib/auth-client";

export const Route = createFileRoute("/_main/reset-password")({
  component: RouteComponent,
  validateSearch: zodValidator(
    z.object({ token: z.string().nullish(), error: z.string().nullish() })
  ),
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const form = useAppForm({
    validators: {
      onSubmit: z
        .object({ password: z.string(), confirmPassword: z.string() })
        .refine((data) => data.password === data.confirmPassword, {
          message: "Las contraseñas no coinciden",
          path: ["confirmPassword"],
        }),
    },
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      if (!search.token) {
        return;
      }

      const { error } = await authClient.resetPassword({
        token: search.token,
        newPassword: value.password,
      });

      if (error) {
        const message = getAuthErrorMessage(error.code);
        toast.error(message ?? error.message);
        console.error(error);
        return;
      }

      toast.success(
        "Contraseña cambiada exitosamente! Ya puedes iniciar sesión.",
        {
          duration: 10_000,
        }
      );

      navigate({ to: "/auth" });
    },
  });

  if (search.token) {
    return (
      <Card className="min-w-xs">
        <CardHeader>
          <CardTitle>Resetea tu contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.AppField name="password">
              {(field) => <field.TextField label="Nueva Contraseña" />}
            </form.AppField>
            <form.AppField name="confirmPassword">
              {(field) => (
                <field.TextField
                  label="Confirmar Nueva Contraseña"
                  type="password"
                />
              )}
            </form.AppField>
            <form.AppForm>
              <form.SubmitButton>Cambiar Contraseña</form.SubmitButton>
            </form.AppForm>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (search.error) {
    return (
      <Card className="min-w-xs">
        <CardHeader>
          <CardTitle>Error al restablecer la contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{search.error}</p>
        </CardContent>
      </Card>
    );
  }

  return <Navigate to="/auth" />;
}
