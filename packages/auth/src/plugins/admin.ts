import { ac, roles } from "@repo/shared/permissions";
import { admin as createAdminPlugin } from "better-auth/plugins";

export const adminPlugin = () =>
  createAdminPlugin({
    ac,
    roles,
    adminRoles: ["owner"],
    bannedUserMessage:
      "Tu cuenta ha sido baneada de esta aplicación. Por favor contacta con el soporte si verdaderamente crees que esto es un error.",
  });
