import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { generateId } from "@repo/db/utils";
import { env } from "@repo/env";
import z from "zod";
import { permissionProcedure, protectedProcedure } from "../index";

const S3 = () =>
  new S3Client({
    region: "auto",
    endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

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
    .handler(({ input }) =>
      Promise.all(
        input.objects.map(async (object) => {
          const objectKey = `images/${input.postId}/${generateId()}.${object.extension}`;
          return {
            objectKey,
            presignedUrl: await getSignedUrl(
              S3(),
              new PutObjectCommand({
                Bucket: env.R2_ASSETS_BUCKET_NAME,
                Key: objectKey,
                ContentLength: object.contentLength,
              }),
              { expiresIn: 3600 }
            ),
          };
        })
      )
    ),

  getAvatarUploadUrl: protectedProcedure
    .input(
      z.object({
        contentType: z.enum(["image/webp", "image/gif"]),
        contentLength: z.number().max(AVATAR_MAX_SIZE_BYTES),
      })
    )
    .handler(async ({ context, input }) => {
      const key = `avatar/${context.session.user.id}.webp`;
      const url = await getSignedUrl(
        S3(),
        new PutObjectCommand({
          Bucket: env.R2_ASSETS_BUCKET_NAME,
          Key: key,
          ContentLength: input.contentLength,
          ContentType: "image/webp",
        }),
        { expiresIn: 3600 }
      );
      return url;
    }),
};
