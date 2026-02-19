export type AdminUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  role: string;
  banned: boolean;
  banReason: string | null;
  banExpires: number | null;
};
