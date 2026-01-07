import { env } from "@repo/env";
import { genericOAuth, patreon } from "better-auth/plugins";

const scopes = [
  "identity",
  "identity[email]",
  "identity.memberships",
  "campaigns",
  "campaigns.members[email]",
  "campaigns.members.address",
  "campaigns.posts",
];

export const patreonPlugin = () =>
  genericOAuth({
    config: [
      patreon({
        clientId: env.PATREON_CLIENT_ID,
        clientSecret: env.PATREON_CLIENT_SECRET,
        scopes,
      }),
    ],
  });
