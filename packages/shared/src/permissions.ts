import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

export const statement = {
  ...defaultStatements,
  dashboard: ["view"],
  files: ["upload"],
  posts: ["create", "update", "delete", "list"],
  comics: ["create", "update", "delete", "list"],
  terms: ["create", "update", "delete", "list"],
  comments: ["create", "self-update", "self-delete", "update", "delete"],
  ratings: ["create", "self-update", "self-delete", "delete"],
} as const;

export const ac = createAccessControl(statement);

const user = ac.newRole({
  comments: ["create", "self-update", "self-delete"],
  ratings: ["create", "self-update", "self-delete"],
});

const moderator = ac.newRole({
  files: ["upload"],
  comics: ["create", "update", "delete"],
  dashboard: ["view"],
  ratings: ["create", "self-update", "self-delete", "delete"],
});

const admin = ac.newRole({
  files: ["upload"],
  posts: ["create", "list", "update", "delete"],
  comics: ["create", "list", "update", "delete"],
  terms: ["create", "list", "update", "delete"],
  dashboard: ["view"],
  ratings: ["create", "self-update", "self-delete", "delete"],
});

const owner = ac.newRole({
  ...adminAc.statements,
  files: ["upload"],
  posts: ["create", "list", "update", "delete"],
  comics: ["create", "list", "update", "delete"],
  terms: ["create", "list", "update", "delete"],
  dashboard: ["view"],
  ratings: ["create", "self-update", "self-delete", "delete"],
});

export const roles = {
  owner,
  admin,
  moderator,
  user,
};

type Statement = typeof statement;

type PermissionMap = {
  [K in keyof Statement]: Statement[K][number];
};

export type Permissions = {
  [K in keyof PermissionMap]?: PermissionMap[K][];
};

export type Role = keyof typeof roles;
