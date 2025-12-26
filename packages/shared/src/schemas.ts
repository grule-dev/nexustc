import * as z from "zod";
import { DOCUMENT_STATUSES, TAXONOMIES } from "./constants";

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

export const postCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .transform((val) => val.trim()),
  version: z.string().trim().max(255),
  censorship: z.string(),
  status: z.string(),
  engine: z.string(),
  graphics: z.string(),
  platforms: z.array(z.string()),
  tags: z.array(z.string()),
  languages: z.array(z.string()),
  adsLinks: z.string(),
  premiumLinks: z.string(),
  authorContent: z.string(),
  content: z
    .string()
    .trim()
    .max(65_535)
    .transform((val) => val.trim()),
  documentStatus: z.enum(DOCUMENT_STATUSES),
});

export const comicCreateSchema = z.object({
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
});
