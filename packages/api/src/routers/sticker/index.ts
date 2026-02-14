import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getLogger } from "@orpc/experimental-pino";
import { asc, eq } from "@repo/db";
import { patron, sticker } from "@repo/db/schema/app";
import { env } from "@repo/env";
import {
  PATRON_TIER_KEYS,
  PATRON_TIERS,
  type PatronTier,
} from "@repo/shared/constants";
import z from "zod";
import { permissionProcedure, publicProcedure } from "../../index";
import { getS3Client } from "../../utils/s3";

const ASSET_MAX_SIZE_BYTES = 1024 * 1024 * 2; // 2MB

function userMeetsTier(
  userTier: PatronTier,
  requiredTier: PatronTier
): boolean {
  return PATRON_TIERS[userTier].level >= PATRON_TIERS[requiredTier].level;
}

export default {
  list: publicProcedure.handler(
    async ({ context: { db, session, ...ctx } }) => {
      const logger = getLogger(ctx);
      logger?.info("Fetching sticker list");

      const stickers = await db
        .select()
        .from(sticker)
        .where(eq(sticker.isActive, true))
        .orderBy(asc(sticker.order), asc(sticker.name));

      let userTier: PatronTier = "none";
      if (session?.user) {
        const patronRecord = await db.query.patron.findFirst({
          where: eq(patron.userId, session.user.id),
          columns: { tier: true, isActivePatron: true },
        });
        if (patronRecord?.isActivePatron) {
          userTier = patronRecord.tier;
        }
      }

      logger?.debug(
        `Returning ${stickers.length} stickers for tier ${userTier}`
      );
      return stickers.map((s) => ({
        ...s,
        locked: !userMeetsTier(userTier, s.requiredTier as PatronTier),
      }));
    }
  ),

  admin: {
    list: permissionProcedure({ stickers: ["list"] }).handler(
      async ({ context: { db, ...ctx } }) => {
        const logger = getLogger(ctx);
        logger?.info("Admin: Fetching all stickers");

        return await db
          .select()
          .from(sticker)
          .orderBy(asc(sticker.order), asc(sticker.name));
      }
    ),

    getById: permissionProcedure({ stickers: ["update"] })
      .input(z.string())
      .handler(async ({ context: { db, ...ctx }, input, errors }) => {
        const logger = getLogger(ctx);
        logger?.info(`Admin: Fetching sticker ${input}`);

        const result = await db.query.sticker.findFirst({
          where: eq(sticker.id, input),
        });
        if (!result) {
          throw errors.NOT_FOUND();
        }
        return result;
      }),

    getUploadUrl: permissionProcedure({ stickers: ["create"] })
      .input(
        z.object({
          name: z
            .string()
            .min(1)
            .max(64)
            .regex(/^\w[\w-]*$/),
          extension: z.enum(["webp", "gif"]),
          contentLength: z.number().max(ASSET_MAX_SIZE_BYTES),
        })
      )
      .handler(async ({ context: { ...ctx }, input }) => {
        const logger = getLogger(ctx);
        const objectKey = `stickers/${input.name}.${input.extension}`;
        logger?.info(
          `Generating presigned URL for sticker asset: ${objectKey}`
        );

        const presignedUrl = await getSignedUrl(
          getS3Client(),
          new PutObjectCommand({
            Bucket: env.R2_ASSETS_BUCKET_NAME,
            Key: objectKey,
            ContentLength: input.contentLength,
            ContentType: `image/${input.extension}`,
          }),
          { expiresIn: 3600 }
        );

        return { objectKey, presignedUrl };
      }),

    create: permissionProcedure({ stickers: ["create"] })
      .input(
        z.object({
          name: z
            .string()
            .min(1)
            .max(64)
            .regex(/^\w[\w-]*$/),
          displayName: z.string().min(1).max(128),
          type: z.enum(["static", "animated"]),
          assetKey: z.string().min(1),
          assetFormat: z.string().min(1),
          requiredTier: z.enum(PATRON_TIER_KEYS).default("level3"),
          order: z.number().int().default(0),
          isActive: z.boolean().default(true),
        })
      )
      .handler(async ({ context: { db, ...ctx }, input }) => {
        const logger = getLogger(ctx);
        logger?.info(`Admin: Creating sticker "${input.name}"`);

        const [created] = await db.insert(sticker).values(input).returning();
        logger?.info(`Sticker created with id: ${created?.id}`);
        return created;
      }),

    update: permissionProcedure({ stickers: ["update"] })
      .input(
        z.object({
          id: z.string(),
          name: z
            .string()
            .min(1)
            .max(64)
            .regex(/^\w[\w-]*$/)
            .optional(),
          displayName: z.string().min(1).max(128).optional(),
          type: z.enum(["static", "animated"]).optional(),
          assetKey: z.string().min(1).optional(),
          assetFormat: z.string().min(1).optional(),
          requiredTier: z.enum(PATRON_TIER_KEYS).optional(),
          order: z.number().int().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .handler(async ({ context: { db, ...ctx }, input }) => {
        const logger = getLogger(ctx);
        logger?.info(`Admin: Updating sticker ${input.id}`);

        const { id, ...data } = input;
        const [updated] = await db
          .update(sticker)
          .set(data)
          .where(eq(sticker.id, id))
          .returning();
        return updated;
      }),

    delete: permissionProcedure({ stickers: ["delete"] })
      .input(z.string())
      .handler(async ({ context: { db, ...ctx }, input }) => {
        const logger = getLogger(ctx);
        logger?.info(`Admin: Soft-deleting sticker ${input}`);

        await db
          .update(sticker)
          .set({ isActive: false })
          .where(eq(sticker.id, input));
      }),
  },
};
