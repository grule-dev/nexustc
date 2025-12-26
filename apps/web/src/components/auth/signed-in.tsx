import { authClient } from "@/lib/auth-client";

export function SignedIn({ children }: React.PropsWithChildren) {
  const { data: auth } = authClient.useSession();

  if (auth?.session) {
    return children;
  }

  return null;
}
