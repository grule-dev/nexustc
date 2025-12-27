import { Loading02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";
import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: Omit<HugeiconsIconProps, "icon">) {
  return (
    <HugeiconsIcon
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      fill="currentColor"
      role="status"
      strokeWidth={0}
      {...props}
      icon={Loading02Icon}
    />
  );
}

export { Spinner };
