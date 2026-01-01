import { cn } from "@/lib/utils";

type RatingDisplayProps = {
  averageRating: number;
  ratingCount: number;
  variant?: "compact" | "full";
  className?: string;
};

/**
 * Displays rating information
 * - compact: Shows star icon with average and count (for post cards)
 * - full: Shows all 10 stars with visual fill based on average
 */
export function RatingDisplay({
  averageRating,
  ratingCount,
  variant = "compact",
  className,
}: RatingDisplayProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <svg
          aria-hidden="true"
          className="size-4 fill-amber-400 text-amber-400"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-medium text-sm">{averageRating.toFixed(1)}</span>
        <span className="text-muted-foreground text-xs">({ratingCount})</span>
      </div>
    );
  }

  // Full variant - show 10 stars
  const filledStars = Math.floor(averageRating);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-1">
        {Array.from({ length: 10 }, (_, i) => {
          const isFilled = i < filledStars;

          return (
            <svg
              aria-hidden="true"
              className={cn(
                "size-5 transition-colors",
                isFilled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-none text-gray-400"
              )}
              key={`star-${
                // biome-ignore lint/suspicious/noArrayIndexKey: keys are stable
                i
              }`}
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg">{averageRating.toFixed(1)}</span>
        <span className="text-muted-foreground text-sm">
          ({ratingCount} {ratingCount === 1 ? "valoración" : "valoraciones"})
        </span>
      </div>
    </div>
  );
}
