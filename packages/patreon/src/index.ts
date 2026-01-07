import z from "zod";

const PATREON_API_BASE = "https://www.patreon.com/api/oauth2/v2";

const patreonMemberSchema = z.looseObject({
  type: z.literal("member"),
  attributes: z.object({
    patron_status: z.string().nullable().optional(),
    pledge_relationship_start: z.string().nullable().optional(),
    currently_entitled_amount_cents: z.number().nullable().optional(),
  }),
  relationships: z
    .object({
      currently_entitled_tiers: z
        .object({
          data: z.array(z.object({ id: z.string(), type: z.literal("tier") })),
        })
        .optional(),
    })
    .optional(),
});

const patreonTierSchema = z.looseObject({
  id: z.string(),
  type: z.literal("tier"),
});

const patreonIdentityResponseSchema = z.looseObject({
  data: z.looseObject({
    id: z.string(),
    type: z.literal("user"),
    relationships: z
      .object({
        memberships: z
          .object({
            data: z.array(
              z.object({ id: z.string(), type: z.literal("member") })
            ),
          })
          .optional(),
      })
      .optional(),
  }),
  included: z
    .array(z.union([patreonMemberSchema, patreonTierSchema]))
    .optional(),
});

const patreonUserInfoSchema = z.looseObject({
  data: z.looseObject({
    id: z.string(),
    attributes: z.looseObject({
      email: z.string(),
      full_name: z.string(),
      image_url: z.string(),
    }),
  }),
});

export class PatreonIdentity {
  private readonly accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async fetchIdentity(): Promise<
    | [null, z.infer<typeof patreonIdentityResponseSchema>, true]
    | [
        (
          | ReturnType<
              (typeof patreonIdentityResponseSchema)["safeParse"]
            >["error"]
          | string
        ),
        null,
        false,
      ]
  > {
    const url = new URL(`${PATREON_API_BASE}/identity`);
    url.searchParams.set("fields[user]", "email,full_name");
    url.searchParams.set(
      "fields[member]",
      "patron_status,pledge_relationship_start,currently_entitled_amount_cents"
    );

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text();
      return [error, null, false] as const;
    }

    const rawData = await response.json();
    const parseResult = patreonIdentityResponseSchema.safeParse(rawData);

    if (!parseResult.success) {
      return [parseResult.error, null, false] as const;
    }

    const data = parseResult.data;

    return [null, data, true] as const;
  }

  async fetchUserInfo(): Promise<
    | [null, z.infer<typeof patreonUserInfoSchema>, true]
    | [
        (
          | ReturnType<(typeof patreonUserInfoSchema)["safeParse"]>["error"]
          | string
        ),
        null,
        false,
      ]
  > {
    const url = new URL(`${PATREON_API_BASE}/identity`);
    url.searchParams.set("fields[user]", "created,email,full_name,image_url");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return [error, null, false] as const;
    }

    const rawData = await response.json();
    const parseResult = patreonUserInfoSchema.safeParse(rawData);

    if (!parseResult.success) {
      return [parseResult.error, null, false] as const;
    }

    const data = parseResult.data;

    return [null, data, true] as const;
  }
}
