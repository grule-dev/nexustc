import { useQuery } from "@tanstack/react-query";
import { orpcClient } from "@/lib/orpc";

export function useTerms() {
  const query = useQuery({
    queryKey: ["terms"],
    queryFn: () => orpcClient.term.getAll(),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60,
    throwOnError: true,
  });

  return query;
}
