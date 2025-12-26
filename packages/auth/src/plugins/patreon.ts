import { env } from "@repo/env";
import { genericOAuth } from "better-auth/plugins";

type PatreonUserResponse = {
  data: {
    attributes: {
      email: string;
      full_name: string;
      image_url: string;
    };
    id: string;
  };
};

export const patreonPlugin = () =>
  genericOAuth({
    config: [
      {
        providerId: "patreon",
        authorizationUrl: "https://www.patreon.com/oauth2/authorize",
        tokenUrl: "https://www.patreon.com/api/oauth2/token",
        disableSignUp: true,
        getUserInfo: async (tokens) => {
          const url = new URL("https://www.patreon.com/api/oauth2/v2/identity");
          url.searchParams.set(
            "fields[user]",
            "created,email,full_name,image_url"
          );
          const user = await fetch(url, {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          }).then((res) => res.json() as unknown as PatreonUserResponse);

          return {
            id: user.data.id,
            email: user.data.attributes.email,
            name: user.data.attributes.full_name,
            image: user.data.attributes.image_url,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        },
        clientId: env.PATREON_CLIENT_ID,
        clientSecret: env.PATREON_CLIENT_SECRET,
        responseType: "code",
        scopes: env.PATREON_SCOPE.split(","),
      },
    ],
  });
