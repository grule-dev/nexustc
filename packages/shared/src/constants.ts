export const TAXONOMIES = [
  "tag",
  "language",
  "engine",
  "graphics",
  "censorship",
  "status",
  "platform",
] as const;

export const TAXONOMY_DATA: Record<
  (typeof TAXONOMIES)[number],
  { label: string; mode: "single" | "multiple" }
> = {
  language: { label: "Idiomas", mode: "multiple" },
  tag: { label: "Tags", mode: "multiple" },
  platform: { label: "Plataformas", mode: "multiple" },
  engine: { label: "Motor Gráfico", mode: "single" },
  graphics: { label: "Gráficos", mode: "single" },
  censorship: { label: "Censura", mode: "single" },
  status: { label: "Estado", mode: "single" },
} as const;

export const DOCUMENT_STATUSES = [
  "publish",
  "pending",
  "draft",
  "trash",
] as const;

export const DOCUMENT_STATUS_LABELS: Record<
  (typeof DOCUMENT_STATUSES)[number],
  string
> = {
  publish: "Publicado",
  pending: "Pendiente",
  draft: "Borrador",
  trash: "Basura",
} as const;

export const RATING_REVIEW_MAX_LENGTH = 512;
