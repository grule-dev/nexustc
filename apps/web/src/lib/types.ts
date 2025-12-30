import type { post, term } from "@repo/db/schema/app";

export type TermType = typeof term.$inferSelect;

export type PostType = Omit<
  typeof post.$inferSelect,
  "updatedAt" | "authorId" | "views" | "premiumLinks" | "status"
> & {
  likes: number;
  favorites: number;
  terms: Omit<TermType, "createdAt" | "updatedAt">[];
};
