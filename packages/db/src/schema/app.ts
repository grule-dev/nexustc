import { DOCUMENT_STATUSES, TAXONOMIES } from "@repo/shared/constants";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { generateId } from "../utils";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
};

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    role: text("role").default("user").notNull(),
    banned: boolean("banned").default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("user_email_idx").on(table.email),
    index("user_created_at_idx").on(table.createdAt),
  ]
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
    ...timestamps,
  },
  (table) => [
    index("session_userId_idx").on(table.userId),
    index("session_token_idx").on(table.token),
  ]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

/** -------------------------------------------------------- */

export const postTypeEnum = pgEnum("post_type", ["post", "comic"]);
export const documentStatusEnum = pgEnum("document_status", DOCUMENT_STATUSES);

export const term = pgTable("term", {
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  color: text("color"),
  taxonomy: text("taxonomy", { enum: TAXONOMIES }).notNull(),
  ...timestamps,
});

export const post = pgTable(
  "post",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    type: postTypeEnum("type").notNull().default("post"),
    isWeekly: boolean("is_weekly").notNull().default(false),
    authorId: text("author_id").notNull(),
    authorContent: text("author_content").notNull().default(""),
    status: documentStatusEnum("status").notNull().default("draft"),
    version: text("version"),
    adsLinks: text("ads_links"),
    premiumLinks: text("premium_links"),
    views: integer("views").notNull().default(0),
    imageObjectKeys: jsonb("image_object_keys").$type<string[]>(),
    ...timestamps,
  },
  (table) => [
    index("post_title_gin_idx").using("gin", table.title.op("gin_trgm_ops")),
    index("post_status_idx").on(table.status),
    index("post_created_at_idx").on(table.createdAt),
  ]
);

export const comment = pgTable(
  "comment",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    postId: text("post_id").references(() => post.id, { onDelete: "cascade" }),
    authorId: text("author_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    content: text("content").notNull(),
    ...timestamps,
  },
  (table) => [index("comment_post_id_idx").on(table.postId)]
);

export const termPostRelation = pgTable(
  "term_post_relation",
  {
    termId: text("term_id")
      .notNull()
      .references(() => term.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.termId, table.postId] }),
    index("term_post_relation_post_id_idx").on(table.postId),
  ]
);

export const postBookmark = pgTable(
  "post_bookmark",
  {
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    postId: text("post_id")
      .references(() => post.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.postId] }),
    index("post_bookmark_post_id_idx").on(table.postId),
  ]
);

export const postLikes = pgTable(
  "post_like",
  {
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    postId: text("post_id")
      .references(() => post.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.postId] }),
    index("post_like_post_id_idx").on(table.postId),
  ]
);

export const postRating = pgTable(
  "post_rating",
  {
    id: text("id").notNull().$defaultFn(generateId),
    postId: text("post_id")
      .references(() => post.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    rating: integer("rating").notNull(),
    review: text("review").notNull().default(""),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.postId] }),
    index("post_rating_post_id_idx").on(table.postId),
    index("post_rating_created_at_idx").on(table.createdAt),
  ]
);

export const tutorials = pgTable("tutorial", {
  id: text("id").primaryKey().$defaultFn(generateId),
  title: text("title").notNull(),
  description: text("content").notNull(),
  embedUrl: text("embed_url").notNull(),
  ...timestamps,
});

export const postRelations = relations(post, ({ many }) => ({
  terms: many(termPostRelation),
  comments: many(comment),
  favorites: many(postBookmark),
  likes: many(postLikes),
  ratings: many(postRating),
}));

export const termRelations = relations(term, ({ many }) => ({
  posts: many(termPostRelation),
}));

export const commentRelations = relations(comment, ({ one }) => ({
  post: one(post, {
    fields: [comment.postId],
    references: [post.id],
  }),
}));

export const termPostRelationRelations = relations(
  termPostRelation,
  ({ one }) => ({
    term: one(term, {
      fields: [termPostRelation.termId],
      references: [term.id],
    }),
    post: one(post, {
      fields: [termPostRelation.postId],
      references: [post.id],
    }),
  })
);

export const postBookmarkRelations = relations(postBookmark, ({ one }) => ({
  post: one(post, {
    fields: [postBookmark.postId],
    references: [post.id],
  }),
}));

export const postRatingRelations = relations(postRating, ({ one }) => ({
  post: one(post, {
    fields: [postRating.postId],
    references: [post.id],
  }),
  user: one(user, {
    fields: [postRating.userId],
    references: [user.id],
  }),
}));
