import type React from "react";
import { Badge } from "@/components/ui/badge";
import { cn, pickTextColorFromHex } from "@/lib/utils";

export function TermBadge({
  tag,
  className,
  ...props
}: React.ComponentPropsWithRef<"span"> & {
  tag: { name: string; color: string | null | undefined };
  className?: string;
}) {
  // Use default Badge style when no colors are present
  if (!tag.color || tag.color.trim() === "") {
    return (
      <Badge className={className} variant="outline" {...props}>
        {tag.name}
      </Badge>
    );
  }

  const colors = tag.color ? tag.color.split(",") : [];

  let color1 = "";
  let color2 = "";
  let textColor: string | undefined = "";

  if (colors.length === 1) {
    if (colors[0].startsWith("@")) {
      textColor = colors[0].slice(1);
    } else {
      color1 = colors[0];
    }
  }

  if (colors.length === 2) {
    color1 = colors[0];
    color2 = colors[1];
  }

  if (colors.length === 3) {
    color1 = colors[0];
    color2 = colors[1];
    textColor = colors[2].slice(1);
  }

  textColor = textColor || pickTextColorFromHex(color1 || "#000000");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border bg-primary px-2 py-0.5 font-semibold text-primary-foreground text-xs tracking-wide",
        className
      )}
      key={tag.name}
      style={{
        borderColor: textColor || undefined,
        borderWidth: "1px",
        color: textColor || pickTextColorFromHex(color1 || "#000000"),
        background: `linear-gradient(to right, ${color1}, ${color2 || color1})`,
      }}
      {...props}
    >
      {tag.name}
    </span>
  );
}
