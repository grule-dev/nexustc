import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getLogger } from "@orpc/experimental-pino";
import { generateId } from "@repo/db/utils";
import { env } from "@repo/env";
import z from "zod";
import { permissionProcedure, protectedProcedure } from "../index";
import { getS3Client } from "../utils/s3";

const POST_IMAGES_MAX_SIZE_BYTES = 1024 * 1024 * 5; // 5MB
const AVATAR_MAX_SIZE_BYTES = 1024 * 512; // 512KB

const validExtensions = ["jpg", "jpeg", "png", "webp", "avif", "gif"];

export default {
  getPostPresignedUrls: permissionProcedure({
    files: ["upload"],
  })
    .input(
      z.object({
        postId: z.string(),
        objects: z.array(
          z.object({
            contentLength: z.number().max(POST_IMAGES_MAX_SIZE_BYTES),
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
        `Generating presigned URLs for ${input.objects.length} post images for post: ${input.postId}`
      );

      const urls = await Promise.all(
        input.objects.map(async (object, index) => {
          logger?.debug(
            `Generating presigned URL ${index + 1}/${input.objects.length} for extension: ${object.extension}`
          );

          const objectKey = `images/${input.postId}/${generateId()}.${object.extension}`;
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
        `Successfully generated ${urls.length} presigned URLs for post ${input.postId}`
      );
      return urls;
    }),

  getAvatarUploadUrl: protectedProcedure
    .input(
      z.object({
        contentType: z.enum(["image/webp", "image/gif"]),
        contentLength: z.number().max(AVATAR_MAX_SIZE_BYTES),
      })
    )
    .handler(async ({ context: { session, ...ctx }, input }) => {
      const logger = getLogger(ctx);
      logger?.info(
        `Generating presigned URL for avatar upload for user: ${session.user.id}`
      );

      const key = `avatar/${session.user.id}.webp`;
      const url = await getSignedUrl(
        getS3Client(),
        new PutObjectCommand({
          Bucket: env.R2_ASSETS_BUCKET_NAME,
          Key: key,
          ContentLength: input.contentLength,
          ContentType: "image/webp",
        }),
        { expiresIn: 3600 }
      );

      logger?.debug(
        `Avatar presigned URL generated for user ${session.user.id}`
      );
      return url;
    }),
};
