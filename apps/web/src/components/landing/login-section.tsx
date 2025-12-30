import { SquareLock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function UserSection() {
  const { data: auth } = authClient.useSession();

  if (auth?.session) {
    const role = auth.user.role;

    return (
      <>
        {role !== "user" && (
          <Link to="/admin">
            <Button variant="default">
              <HugeiconsIcon icon={SquareLock01Icon} />
              Admin
            </Button>
          </Link>
        )}
        <Link to="/profile">
          <Button variant="default">Perfil</Button>
        </Link>
      </>
    );
  }
}
