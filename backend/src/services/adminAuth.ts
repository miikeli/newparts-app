import { type Request } from "express";
import env from "../environments";
import {
  createAuthError,
  getAuthenticatedUserUid,
  type AuthError,
} from "./auth";

const adminUidSet = new Set(
  env.admin_pi_uids
    .split(",")
    .map((uid) => uid.trim())
    .filter(Boolean),
);

export type AdminUser = {
  uid: string;
  username?: string;
};

export const requireAdminUser = async (req: Request): Promise<AdminUser> => {
  const uid = await getAuthenticatedUserUid(req);

  if (!adminUidSet.has(uid)) {
    throw createAuthError(
      403,
      "forbidden",
      "Admin access required",
      "Authenticated user is not in admin allowlist",
    );
  }

  return {
    uid,
    username: req.session.currentUser?.username,
  };
};

export const isAdminAuthError = (err: unknown): err is AuthError =>
  typeof err === "object" &&
  err !== null &&
  "statusCode" in err &&
  "error" in err &&
  "message" in err &&
  "logMessage" in err;
