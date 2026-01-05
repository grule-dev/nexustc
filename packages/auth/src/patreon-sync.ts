import { db } from "@repo/db";
import { patron } from "@repo/db/schema/app";
import { env } from "@repo/env";
import {
  PATREON_TIER_MAPPING,
  PATRON_TIERS,
  type PatronTier,
} from "@repo/shared/constants";

const PATREON_API_BASE = "https://www.patreon.com/api/oauth2/v2";

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
    };
    relationships?: {
      campaign?: { data: { id: string; type: "campaign" } };
      currently_entitled_tiers?: { data: Array<{ id: string; type: "tier" }> };
    };
  }>;
};

function determineTierFromIds(tierIds: string[]): PatronTier {
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
 * Sync Patreon membership data for a user after they link their account.
 * This is called from the databaseHooks after a Patreon account is created.
 */
export async function syncPatreonMembership(
  userId: string,
  patreonAccountId: string,
  accessToken: string
): Promise<void> {
  try {
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
      const errorText = await response.text();
      console.error(
        `Failed to fetch Patreon membership for user ${userId}:`,
        errorText
      );
      throw new Error(`Patreon API error: ${response.status}`);
    }

    const data = (await response.json()) as PatreonIdentityResponse;

    // Find membership for our campaign
    const memberships =
      data.included?.filter((item) => item.type === "member") ?? [];

    const ourMembership = memberships.find((m) => {
      const memberCampaignId = m.relationships?.campaign?.data?.id;
      return memberCampaignId === env.PATREON_CAMPAIGN_ID;
    });

    const isActive =
      ourMembership?.attributes?.patron_status === "active_patron";
    const pledgeAmountCents =
      ourMembership?.attributes?.pledge_amount_cents ?? 0;
    const patronSince =
      ourMembership?.attributes?.pledge_relationship_start ?? null;
    const entitledTiers =
      ourMembership?.relationships?.currently_entitled_tiers?.data ?? [];
    const tier = determineTierFromIds(entitledTiers.map((t) => t.id));

    // Upsert patron record
    await db
      .insert(patron)
      .values({
        userId,
        patreonUserId: patreonAccountId,
        tier,
        pledgeAmountCents,
        isActivePatron: isActive,
        patronSince: patronSince ? new Date(patronSince) : null,
        lastSyncAt: new Date(),
      })
      .onConflictDoUpdate({
        target: patron.userId,
        set: {
          tier,
          pledgeAmountCents,
          isActivePatron: isActive,
          patronSince: patronSince ? new Date(patronSince) : null,
          lastSyncAt: new Date(),
        },
      });

    console.log(
      `Synced Patreon membership for user ${userId}: tier=${tier}, active=${isActive}`
    );
  } catch (error) {
    console.error(
      `Error syncing Patreon membership for user ${userId}:`,
      error
    );
    throw error;
  }
}
