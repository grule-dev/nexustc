import * as z from "zod";
import {
  DOCUMENT_STATUSES,
  RATING_REVIEW_MAX_LENGTH,
  TAXONOMIES,
} from "./constants";

export const termCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .transform((val) => val.trim()),
  color1: z.string().trim().max(7),
  color2: z.string().trim().max(7),
  textColor: z.string().trim().max(7),
  taxonomy: z.enum(TAXONOMIES),
});

export const termUpdateSchema = termCreateSchema
  .extend({
    id: z.string(),
  })
  .omit({
    taxonomy: true,
  });

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const contentBaseFields = {
  title: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .transform((val) => val.trim()),
  censorship: z.string(),
  tags: z.array(z.string()),
  languages: z.array(z.string()),
  documentStatus: z.enum(DOCUMENT_STATUSES),
  files: z
    .array(
      z
        .file()
        .mime(["image/gif", "image/jpeg", "image/png", "image/webp"])
        .refine((file) => file.size <= MAX_FILE_SIZE, {
          message: "File size must be less than 10MB",
        })
    )
    .optional(),
};

export const postCreateSchema = z.object({
  ...contentBaseFields,
  type: z.literal("post"),
  version: z.string().trim().max(255),
  status: z.string(),
  engine: z.string(),
  graphics: z.string(),
  platforms: z.array(z.string()),
  adsLinks: z.string(),
  premiumLinks: z.string(),
  authorContent: z.string(),
  content: z
    .string()
    .trim()
    .max(65_535)
    .transform((val) => val.trim()),
});

export const comicCreateSchema = z.object({
  ...contentBaseFields,
  type: z.literal("comic"),
  version: z.string().optional(),
  status: z.string().optional(),
  engine: z.string().optional(),
  graphics: z.string().optional(),
  platforms: z.array(z.string()).optional(),
  adsLinks: z.string().optional(),
  premiumLinks: z.string().optional(),
  authorContent: z.string().optional(),
  content: z.string().optional(),
});

export const contentCreateSchema = z.discriminatedUnion("type", [
  postCreateSchema,
  comicCreateSchema,
]);

export const postEditSchema = postCreateSchema.extend({ id: z.string() });
export const comicEditSchema = comicCreateSchema.extend({ id: z.string() });
export const contentEditSchema = z.discriminatedUnion("type", [
  postEditSchema,
  comicEditSchema,
]);

export const ratingCreateSchema = z.object({
  postId: z.string().min(1),
  rating: z.number().int().min(1).max(10),
  review: z
    .string()
    .trim()
    .max(RATING_REVIEW_MAX_LENGTH)
    .transform((val) => val.trim())
    .optional()
    .default(""),
});

export const ratingUpdateSchema = z.object({
  postId: z.string().min(1),
  rating: z.number().int().min(1).max(10),
  review: z
    .string()
    .trim()
    .max(RATING_REVIEW_MAX_LENGTH)
    .transform((val) => val.trim())
    .optional()
    .default(""),
});

export const chronosUpdateSchema = z.object({
  stickyImageKey: z.string().optional(),
  carouselImageKeys: z.array(z.string()).optional(),
  markdownContent: z.string().max(65_535),
  markdownImageKeys: z.array(z.string()).optional(),
});
