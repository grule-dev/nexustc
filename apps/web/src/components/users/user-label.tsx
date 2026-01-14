import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getBucketUrl } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const roleClassnames: Record<string, string> = {
  owner:
    "font-bold bg-clip-text text-transparent hover:animate-[gradient-shift_1.5s_linear_infinite]",
  admin:
    "font-bold bg-clip-text text-transparent hover:animate-[gradient-shift_1.5s_linear_infinite]",
};

const roleGradients: Record<string, string> = {
  owner:
    "linear-gradient(to right, #2563eb, #6366f1, #a855f7, #6366f1, #2563eb)",
  admin:
    "linear-gradient(to right, #dc2626, #ea580c, #22c55e, #ea580c, #dc2626)",
};

export function UserLabel({
  user,
  className,
  disableTooltip = false,
}: {
  user: {
    name: string;
    image?: string | null;
    role?: string | null;
  };
  className?: string;
  disableTooltip?: boolean;
}) {
  const roleClassname = user.role ? roleClassnames[user.role] : null;
  const roleGradient = user.role ? roleGradients[user.role] : null;
  const roleLabel = `${user.role?.charAt(0).toUpperCase()}${user.role?.slice(
    1
  )}`;

  const renderUserName = (extraClassName?: string) =>
    roleGradient ? (
      <span className="relative inline-block">
        <span
          aria-hidden="true"
          className="absolute inset-0 opacity-100 blur-xs hover:animate-[gradient-shift_1.5s_linear_infinite]"
          style={{
            backgroundImage: roleGradient,
            backgroundSize: "200% 100%",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          {user.name}
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-0 opacity-80 blur-md hover:animate-[gradient-shift_1.5s_linear_infinite]"
          style={{
            backgroundImage: roleGradient,
            backgroundSize: "200% 100%",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          {user.name}
        </span>
        <span
          className={cn("relative inline-block", roleClassname, extraClassName)}
          style={{
            backgroundImage: roleGradient,
            backgroundSize: "200% 100%",
          }}
        >
          {user.name}
        </span>
      </span>
    ) : (
      <span className={cn("inline-block", extraClassName)}>{user.name}</span>
    );

  if (disableTooltip) {
    return <p className={className}>{renderUserName()}</p>;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={<p className={cn("inline-block cursor-pointer", className)} />}
      >
        {renderUserName()}
      </TooltipTrigger>
      <TooltipContent
        className="flex flex-col items-center gap-3 rounded-lg border-2 bg-card/95 p-4 text-card-foreground shadow-xl backdrop-blur-sm"
        side="left"
      >
        <Avatar className="size-32 rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
          <AvatarImage
            src={user.image ? getBucketUrl(user.image) : undefined}
          />
          <AvatarFallback className="text-4xl">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-center gap-1">
          <p className="inline-block font-semibold text-xl">
            {renderUserName("font-semibold text-xl")}
          </p>
          {user.role && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-sm">
              Rol: {roleLabel}
            </span>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
