import type { postCollection } from "@/db/collections";

type Yielded<T extends IterableIterator<unknown>> =
  T extends IterableIterator<infer U> ? U : never;

export type DiscriminatedUnion<
  K extends string,
  // biome-ignore lint/suspicious/noExplicitAny: the type works this way
  T extends Record<string, any>,
> = T[keyof T] & { [P in K]: T[keyof T][P] };

export type PostType = Yielded<ReturnType<typeof postCollection.values>>;
