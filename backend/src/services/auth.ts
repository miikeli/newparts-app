import { type Request } from "express";
import platformAPIClient from "./platformAPIClient";
import "../types/session";

export type AuthError = {
  statusCode: number;
  error: string;
  message: string;
  logMessage: string;
};

export const createAuthError = (
  statusCode: number,
  error: string,
  message: string,
  logMessage: string,
): AuthError => ({
  statusCode,
  error,
  message,
  logMessage,
});

export const isAuthError = (err: unknown): err is AuthError =>
  typeof err === "object" &&
  err !== null &&
  "statusCode" in err &&
  "error" in err &&
  "message" in err &&
  "logMessage" in err;

const readSafeString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export const getAuthenticatedUserUid = async (req: Request) => {
  const sessionUserUid = readSafeString(req.session.currentUser?.uid);

  if (sessionUserUid) {
    return sessionUserUid;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw createAuthError(
      401,
      "unauthorized",
      "Missing Pi access token",
      "No session user and no Bearer token were provided",
    );
  }

  const accessToken = authHeader.substring(7).trim();

  if (!accessToken) {
    throw createAuthError(
      401,
      "unauthorized",
      "Missing Pi access token",
      "Bearer token was empty",
    );
  }

  try {
    const me = await platformAPIClient.get("/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const bearerUserUid = readSafeString(me.data?.uid);

    if (!bearerUserUid) {
      throw new Error("Pi /v2/me response did not include uid");
    }

    return bearerUserUid;
  } catch {
    throw createAuthError(
      401,
      "invalid_token",
      "Invalid Pi access token",
      "Pi access token verification failed",
    );
  }
};

export const sendAuthError = (
  res: { status: (statusCode: number) => { json: (body: unknown) => unknown } },
  err: AuthError,
) =>
  res.status(err.statusCode).json({
    error: err.error,
    message: err.message,
  });
