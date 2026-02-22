import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function ImpersonationBanner() {
  const { data: session } = authClient.useSession();

  if (!session?.session?.impersonatedBy) {
    return null;
  }

  const handleStop = async () => {
    await authClient.admin.stopImpersonating();
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center gap-4 bg-yellow-500 px-4 py-2 text-black text-sm">
      <span>
        Estás suplantando a <strong>{session.user.name}</strong>.
      </span>
      <Button onClick={handleStop} size="sm" variant="outline">
        Dejar de suplantar
      </Button>
    </div>
  );
}
