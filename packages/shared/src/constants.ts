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

// Patreon tier configuration
export const PATRON_TIERS = {
  none: { level: 0, badge: null, adFree: false, premiumLinks: false },
  level1: {
    level: 1,
    badge: "LvL 1",
    adFree: false,
    premiumLinks: false,
  },
  level3: {
    level: 2,
    badge: "LvL 3",
    adFree: true,
    premiumLinks: false,
  },
  level5: {
    level: 3,
    badge: "LvL 5",
    adFree: true,
    premiumLinks: true,
  },
  level8: {
    level: 3,
    badge: "LvL 8",
    adFree: true,
    premiumLinks: true,
  },
  level12: {
    level: 3,
    badge: "LvL 12",
    adFree: true,
    premiumLinks: true,
  },
  level69: {
    level: 3,
    badge: "LvL 69",
    adFree: true,
    premiumLinks: true,
  },
} as const;

export type PatronTier = keyof typeof PATRON_TIERS;

// Map Patreon tier IDs to our tiers - fill these after fetching from Patreon API
// Example: "12345678": "tier1"
export const PATREON_TIER_MAPPING: Record<string, PatronTier> = {
  // TODO: Add your Patreon tier IDs here after fetching them
  // Use: curl "https://www.patreon.com/api/oauth2/v2/campaigns/{CAMPAIGN_ID}?include=tiers&fields[tier]=title,amount_cents"
  "25898614": "none",
  "25898677": "level1",
  "25898697": "level3",
  "25898760": "level5",
  "25898792": "level8",
  "25898869": "level12",
  "25899010": "level69",
};
