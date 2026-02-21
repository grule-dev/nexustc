import type * as React from "react";

import { cn } from "@/lib/utils";

function Card({
  className,
  children,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div className="w-full rounded-[calc(var(--radius-xl)+3px)] border border-white/60 text-card-foreground text-sm dark:border-border/30">
      <div className="rounded-[calc(var(--radius-xl)+2px)] border border-black/10 dark:border-neutral-900/80">
        <div className="rounded-[calc(var(--radius-xl)+1px)] border border-white/50 dark:border-neutral-950">
          <div className="rounded-[calc(var(--radius-xl))] border border-neutral-950/20 dark:border-neutral-900/70">
            <div
              className={cn(
                "group/card flex flex-col gap-6 overflow-hidden rounded-[calc(var(--radius-xl)-1px)] border border-white/50 bg-linear-to-b from-card/70 to-secondary/50 py-6 has-[>img:first-child]:pt-0 data-[size=sm]:gap-4 data-[size=sm]:py-4 dark:border-neutral-700/50 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
                className
              )}
              data-size={size}
              data-slot="card"
              {...props}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-2 rounded-t-xl px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] group-data-[size=sm]/card:px-4 [.border-b]:pb-6 group-data-[size=sm]/card:[.border-b]:pb-4",
        className
      )}
      data-slot="card-header"
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("text-lg", className)}
      data-slot="card-title"
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="card-description"
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      data-slot="card-action"
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("px-6 group-data-[size=sm]/card:px-4", className)}
      data-slot="card-content"
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center rounded-b-xl px-6 group-data-[size=sm]/card:px-4 [.border-t]:pt-6 group-data-[size=sm]/card:[.border-t]:pt-4",
        className
      )}
      data-slot="card-footer"
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
