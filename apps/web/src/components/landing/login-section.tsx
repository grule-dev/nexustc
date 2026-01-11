import { SquareLock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function UserSection() {
  const { data: auth } = authClient.useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (auth?.session) {
    const role = auth.user.role;

    return (
      <>
        {role !== "user" && (
          <Button
            nativeButton={false}
            render={<Link to="/admin" />}
            variant="default"
          >
            <HugeiconsIcon icon={SquareLock01Icon} />
            Admin
          </Button>
        )}
        <Button
          nativeButton={false}
          render={<Link to="/profile" />}
          variant="default"
        >
          Perfil
        </Button>
      </>
    );
  }
}
