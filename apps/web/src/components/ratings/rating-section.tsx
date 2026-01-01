import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { RatingButton } from "./rating-button";
import { RatingDisplay } from "./rating-display";
import { RatingList } from "./rating-list";

type RatingSectionProps = {
  stats: {
    id: string;
    averageRating: number;
    ratingCount: number;
  };
};

export function RatingSection({ stats }: RatingSectionProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  if (!visible) {
    return (
      <div className="flex items-center justify-center p-6" ref={ref}>
        <Spinner />
      </div>
    );
  }

  return (
    <Card className="w-full" ref={ref}>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="font-bold text-4xl">Valoraciones</CardTitle>
          <RatingButton postId={stats.id} />
        </div>
        {stats.ratingCount > 0 ? (
          <RatingDisplay
            averageRating={stats.averageRating}
            ratingCount={stats.ratingCount}
            variant="full"
          />
        ) : null}
        {stats && stats.ratingCount > 0 && (
          <Link
            className="text-primary text-sm hover:underline"
            params={{ id: stats.id }}
            to="/post/$id/reviews"
          >
            Ver todas las valoraciones
          </Link>
        )}
      </CardHeader>

      <CardContent>
        <RatingList postId={stats.id} />
      </CardContent>
    </Card>
  );
}
