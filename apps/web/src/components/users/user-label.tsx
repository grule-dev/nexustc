import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getBucketUrl } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const roleClassnames: Record<string, string> = {
  owner:
    "bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text font-bold text-transparent",
  admin:
    "bg-gradient-to-r from-red-600 to-green-500 bg-clip-text font-bold text-transparent",
};

export function UserLabel({
  user,
  className,
}: {
  user: { name: string; image?: string | null; role: string | null };
  className?: string;
}) {
  const roleClassname = user.role ? roleClassnames[user.role] : null;
  const roleLabel = `${user.role?.charAt(0).toUpperCase()}${user.role?.slice(
    1
  )}`;

  return (
    <Tooltip>
      <TooltipTrigger
        render={<p className={cn("inline-block", roleClassname, className)} />}
      >
        {user.name}
      </TooltipTrigger>
      <TooltipContent
        className="flex flex-col items-center gap-2 border bg-card text-card-foreground"
        side="left"
      >
        <Avatar className="size-32 rounded-md">
          <AvatarImage
            src={user.image ? getBucketUrl(user.image) : undefined}
          />
          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <p className={cn("inline-block text-xl", roleClassname, className)}>
          {user.name}
        </p>
        <span>Rol: {roleLabel}</span>
      </TooltipContent>
    </Tooltip>
  );
}
