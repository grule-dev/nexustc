import { createHmac } from "node:crypto";
import { env } from "@repo/env";
import {
  PATREON_TIER_MAPPING,
  PATRON_TIERS,
  type PatronTier,
} from "@repo/shared/constants";

const PATREON_API_BASE = "https://www.patreon.com/api/oauth2/v2";

export type PatreonTokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type PatreonMembership = {
  isActive: boolean;
  pledgeAmountCents: number;
  patronSince: string | null;
  entitledTierIds: string[];
};

/**
 * Refresh an expired Patreon access token using the refresh token.
 */
export async function refreshPatreonToken(
  refreshToken: string
): Promise<PatreonTokenResponse> {
  const response = await fetch("https://www.patreon.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: env.PATREON_CLIENT_ID,
      client_secret: env.PATREON_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh Patreon token: ${error}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

type PatreonIdentityResponse = {
  data: {
    id: string;
    type: "user";
  };
  included?: Array<{
    id: string;
    type: "member" | "tier" | "campaign";
    attributes?: {
      patron_status?: string;
      pledge_amount_cents?: number;
      pledge_relationship_start?: string;
      title?: string;
    };
    relationships?: {
      campaign?: { data: { id: string; type: "campaign" } };
      currently_entitled_tiers?: { data: Array<{ id: string; type: "tier" }> };
    };
  }>;
};

/**
 * Fetch membership data for a user from the Patreon API.
 * Returns null if the user is not a member of the specified campaign.
 */
export async function fetchPatreonMembership(
  accessToken: string,
  campaignId: string
): Promise<PatreonMembership | null> {
  const url = new URL(`${PATREON_API_BASE}/identity`);
  url.searchParams.set(
    "include",
    "memberships.currently_entitled_tiers,memberships.campaign"
  );
  url.searchParams.set(
    "fields[member]",
    "patron_status,pledge_amount_cents,pledge_relationship_start"
  );
  url.searchParams.set("fields[tier]", "title");

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Patreon identity: ${error}`);
  }

  const data = (await response.json()) as PatreonIdentityResponse;

  // Find membership for our campaign
  const memberships =
    data.included?.filter((item) => item.type === "member") ?? [];

  const ourMembership = memberships.find((m) => {
    const memberCampaignId = m.relationships?.campaign?.data?.id;
    return memberCampaignId === campaignId;
  });

  if (!ourMembership) {
    return null;
  }

  const entitledTiers =
    ourMembership.relationships?.currently_entitled_tiers?.data ?? [];

  return {
    isActive: ourMembership.attributes?.patron_status === "active_patron",
    pledgeAmountCents: ourMembership.attributes?.pledge_amount_cents ?? 0,
    patronSince: ourMembership.attributes?.pledge_relationship_start ?? null,
    entitledTierIds: entitledTiers.map((t) => t.id),
  };
}

/**
 * Determine the highest tier from a list of Patreon tier IDs.
 * Uses the PATREON_TIER_MAPPING to map external tier IDs to our internal tiers.
 */
export function determineTierFromIds(tierIds: string[]): PatronTier {
  let highestTier: PatronTier = "none";
  let highestLevel = 0;

  for (const tierId of tierIds) {
    const mappedTier = PATREON_TIER_MAPPING[tierId];
    if (mappedTier) {
      const tierConfig = PATRON_TIERS[mappedTier];
      if (tierConfig.level > highestLevel) {
        highestLevel = tierConfig.level;
        highestTier = mappedTier;
      }
    }
  }

  return highestTier;
}

/**
 * Verify a Patreon webhook signature.
 * Patreon uses HMAC-MD5 to sign webhook payloads.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac("md5", secret).update(payload).digest("hex");
  return signature === expected;
}
