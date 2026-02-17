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

export const PREMIUM_STATUS_CATEGORIES = {
  completed: ["Finalizado", "Abandonado"],
  ongoing: ["En Progreso", "En Emision", "En Emisión"],
} as const;

type PremiumStatusCategory = keyof typeof PREMIUM_STATUS_CATEGORIES;

export type PremiumLinksAccess =
  | { type: "none" }
  | { type: "category"; categories: PremiumStatusCategory[] }
  | { type: "all" };

export type PremiumLinksDescriptor =
  | { status: "no_premium_links" }
  | { status: "granted"; content: string }
  | { status: "denied_need_patron" }
  | { status: "denied_need_upgrade"; requiredTierLabel: string };

export const PATRON_TIER_KEYS = [
  "none",
  "level1",
  "level3",
  "level5",
  "level8",
  "level12",
  "level69",
] as const;

// Patreon tier configuration
export const PATRON_TIERS: Record<
  (typeof PATRON_TIER_KEYS)[number],
  {
    level: number;
    badge: string | null;
    adFree: boolean;
    premiumLinks: PremiumLinksAccess;
  }
> = {
  none: {
    level: 0,
    badge: null,
    adFree: false,
    premiumLinks: { type: "none" },
  },
  level1: {
    level: 1,
    badge: "LvL 1",
    adFree: false,
    premiumLinks: { type: "category", categories: ["completed"] },
  },
  level3: {
    level: 2,
    badge: "LvL 3",
    adFree: true,
    premiumLinks: { type: "category", categories: ["ongoing"] },
  },
  level5: {
    level: 3,
    badge: "LvL 5",
    adFree: true,
    premiumLinks: { type: "all" },
  },
  level8: {
    level: 3,
    badge: "LvL 8",
    adFree: true,
    premiumLinks: { type: "all" },
  },
  level12: {
    level: 3,
    badge: "LvL 12",
    adFree: true,
    premiumLinks: { type: "all" },
  },
  level69: {
    level: 3,
    badge: "LvL 69",
    adFree: true,
    premiumLinks: { type: "all" },
  },
} as const;

export function canAccessPremiumLinks(
  tier: PatronTier,
  postStatusName: string | undefined
): boolean {
  const access = PATRON_TIERS[tier].premiumLinks;
  if (access.type === "none") {
    return false;
  }
  if (access.type === "all") {
    return true;
  }
  if (!postStatusName) {
    return false;
  }
  return access.categories.some((cat) =>
    (PREMIUM_STATUS_CATEGORIES[cat] as readonly string[]).includes(
      postStatusName
    )
  );
}

export function getRequiredTierLabel(
  userTier: PatronTier,
  postStatusName: string | undefined
): string {
  if (!postStatusName) {
    return "LvL 5";
  }

  const userLevel = PATRON_TIERS[userTier].level;
  const isCompleted = (
    PREMIUM_STATUS_CATEGORIES.completed as readonly string[]
  ).includes(postStatusName);
  const isOngoing = (
    PREMIUM_STATUS_CATEGORIES.ongoing as readonly string[]
  ).includes(postStatusName);

  if (isCompleted) {
    return userLevel >= 1 ? "LvL 5" : "LvL 1";
  }
  if (isOngoing) {
    return userLevel >= 2 ? "LvL 5" : "LvL 3";
  }
  return "LvL 5";
}

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
