import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getLogger } from "@orpc/experimental-pino";
import { chronosPage, eq } from "@repo/db";
import { generateId } from "@repo/db/utils";
import { env } from "@repo/env";
import { chronosUpdateSchema } from "@repo/shared/schemas";
import z from "zod";
import { permissionProcedure, publicProcedure } from "../index";
import { getS3Client } from "../utils/s3";

const CHRONOS_IMAGES_MAX_SIZE_BYTES = 1024 * 1024 * 5; // 5MB
const validExtensions = ["jpg", "jpeg", "png", "webp", "avif", "gif"];

export default {
  getCurrent: publicProcedure.handler(async ({ context: { db, ...ctx } }) => {
    const logger = getLogger(ctx);
    logger?.info("Fetching current chronos page");

    const result = await db
      .select()
      .from(chronosPage)
      .where(eq(chronosPage.isActive, true))
      .limit(1);

    if (result.length === 0) {
      logger?.info("No active chronos page found, returning defaults");
      return {
        id: "",
        stickyImageKey: null,
        carouselImageKeys: [],
        markdownContent: "",
        markdownImageKeys: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    logger?.info(`Returning chronos page: ${result[0].id}`);
    return result[0];
  }),

  getForEdit: permissionProcedure({ chronos: ["update"] }).handler(
    async ({ context: { db, ...ctx } }) => {
      const logger = getLogger(ctx);
      logger?.info("Fetching chronos page for editing");

      const result = await db
        .select()
        .from(chronosPage)
        .where(eq(chronosPage.isActive, true))
        .limit(1);

      if (result.length === 0) {
        logger?.info("No active chronos page found, returning defaults");
        return {
          id: "",
          stickyImageKey: null,
          carouselImageKeys: [],
          markdownContent: "",
          markdownImageKeys: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      logger?.info(`Returning chronos page for edit: ${result[0].id}`);
      return result[0];
    }
  ),

  update: permissionProcedure({ chronos: ["update"] })
    .input(chronosUpdateSchema)
    .handler(async ({ context: { db, ...ctx }, input }) => {
      const logger = getLogger(ctx);
      logger?.info("Updating chronos page");

      const existing = await db
        .select()
        .from(chronosPage)
        .where(eq(chronosPage.isActive, true))
        .limit(1);

      if (existing.length === 0) {
        logger?.info("Creating new chronos page");
        const result = await db
          .insert(chronosPage)
          .values({
            stickyImageKey: input.stickyImageKey ?? null,
            carouselImageKeys: input.carouselImageKeys ?? [],
            markdownContent: input.markdownContent,
            markdownImageKeys: input.markdownImageKeys ?? [],
            isActive: true,
          })
          .returning();

        logger?.info(`Chronos page created successfully: ${result[0].id}`);
        return result[0];
      }

      logger?.info(`Updating existing chronos page: ${existing[0].id}`);
      const result = await db
        .update(chronosPage)
        .set({
          stickyImageKey: input.stickyImageKey ?? existing[0].stickyImageKey,
          carouselImageKeys:
            input.carouselImageKeys ?? existing[0].carouselImageKeys,
          markdownContent: input.markdownContent,
          markdownImageKeys:
            input.markdownImageKeys ?? existing[0].markdownImageKeys,
        })
        .where(eq(chronosPage.id, existing[0].id))
        .returning();

      logger?.info(`Chronos page updated successfully: ${result[0].id}`);
      return result[0];
    }),

  getPresignedUrls: permissionProcedure({ chronos: ["update"] })
    .input(
      z.object({
        type: z.enum(["sticky", "carousel", "markdown"]),
        objects: z.array(
          z.object({
            contentLength: z.number().max(CHRONOS_IMAGES_MAX_SIZE_BYTES),
            extension: z
              .string()
              .refine((val) => validExtensions.includes(val.toLowerCase())),
          })
        ),
      })
    )
    .handler(async ({ context: { ...ctx }, input }) => {
      const logger = getLogger(ctx);
      logger?.info(
        `Generating presigned URLs for ${input.objects.length} chronos ${input.type} images`
      );

      const urls = await Promise.all(
        input.objects.map(async (object, index) => {
          logger?.debug(
            `Generating presigned URL ${index + 1}/${input.objects.length} for extension: ${object.extension}`
          );

          const objectKey = `images/chronos/${input.type}/${generateId()}.${object.extension}`;
          return {
            objectKey,
            presignedUrl: await getSignedUrl(
              getS3Client(),
              new PutObjectCommand({
                Bucket: env.R2_ASSETS_BUCKET_NAME,
                Key: objectKey,
                ContentLength: object.contentLength,
              }),
              { expiresIn: 3600 }
            ),
          };
        })
      );

      logger?.info(
        `Successfully generated ${urls.length} presigned URLs for chronos ${input.type}`
      );
      return urls;
    }),
};
