import { Router } from "express";

import {
  getAuthenticatedUserUid,
  isAuthError,
  sendAuthError,
} from "../services/auth";
import platformAPIClient from "../services/platformAPIClient";
import { validateShippingAddress } from "../models/shippingAddress";

const getSessionUsername = (req: { session: { currentUser?: { username?: string } | null } }) =>
  typeof req.session.currentUser?.username === "string"
    ? req.session.currentUser.username
    : undefined;

const serializeUserProfile = (profile: {
  pi_uid: string;
  username?: string;
  shippingAddress?: unknown;
  created_at?: Date;
  updated_at?: Date;
}) => ({
  pi_uid: profile.pi_uid,
  username: profile.username,
  shippingAddress: profile.shippingAddress ?? null,
  created_at: profile.created_at,
  updated_at: profile.updated_at,
});

export default function mountUserEndpoints(router: Router) {
  // handle the user auth accordingly
  router.post("/signin", async (req, res) => {
    const auth = req.body.authResult;
    const userCollection = req.app.locals.userCollection;

    if (!userCollection) {
      return res.status(503).json({ error: "service_unavailable", message: "Database not ready" });
    }

    try {
      // Verify the user's access token with the /me endpoint:
      const me = await platformAPIClient.get(`/v2/me`, { headers: { Authorization: `Bearer ${auth.accessToken}` } });

      if (me.data?.uid !== auth.user.uid) {
        return res.status(403).json({ error: "user_mismatch", message: "Authenticated Pi user mismatch" });
      }
    } catch {
      console.error("Error verifying access token");
      return res.status(401).json({ error: "invalid_token", message: "Invalid access token" });
    }

    try {
      let currentUser = await userCollection.findOne({ uid: auth.user.uid });

      if (currentUser) {
        await userCollection.updateOne(
          {
            _id: currentUser._id,
          },
          {
            $set: {
              accessToken: auth.accessToken,
            },
          },
        );
      } else {
        const insertResult = await userCollection.insertOne({
          username: auth.user.username,
          uid: auth.user.uid,
          roles: auth.user.roles,
          accessToken: auth.accessToken,
        });

        currentUser = await userCollection.findOne(insertResult.insertedId);
      }

      req.session.currentUser = currentUser;
      return res.status(200).json({ message: "User signed in" });
    } catch {
      console.error("Error during signin");
      return res.status(500).json({ error: "internal_error", message: "Failed to sign in" });
    }
  });

  // handle the user auth accordingly
  router.get("/signout", async (req, res) => {
    req.session.currentUser = null;
    return res.status(200).json({ message: "User signed out" });
  });

  router.get("/profile", async (req, res) => {
    try {
      const piUid = await getAuthenticatedUserUid(req);
      const profileCollection = req.app.locals.userProfileCollection;

      if (!profileCollection) {
        return res.status(503).json({ error: "service_unavailable", message: "Database not ready" });
      }

      const profile = await profileCollection.findOne({ pi_uid: piUid });

      if (!profile) {
        return res.status(200).json({
          profile: serializeUserProfile({
            pi_uid: piUid,
            username: getSessionUsername(req),
          }),
        });
      }

      return res.status(200).json({
        profile: serializeUserProfile(profile),
      });
    } catch (err) {
      if (isAuthError(err)) {
        return sendAuthError(res, err);
      }

      console.error("Error loading user profile");
      return res.status(500).json({ error: "internal_error", message: "Failed to load profile" });
    }
  });

  router.put("/profile", async (req, res) => {
    try {
      const piUid = await getAuthenticatedUserUid(req);
      const profileCollection = req.app.locals.userProfileCollection;
      const validation = validateShippingAddress(req.body?.shippingAddress);

      if (!profileCollection) {
        return res.status(503).json({ error: "service_unavailable", message: "Database not ready" });
      }

      if (!validation.ok) {
        return res.status(400).json({
          error: "invalid_shipping_address",
          message: "Shipping address is invalid",
          errors: validation.errors,
        });
      }

      const now = new Date();

      await profileCollection.updateOne(
        { pi_uid: piUid },
        {
          $set: {
            username: getSessionUsername(req),
            shippingAddress: validation.value,
            updated_at: now,
          },
          $setOnInsert: {
            pi_uid: piUid,
            created_at: now,
          },
        },
        { upsert: true },
      );

      const profile = await profileCollection.findOne({ pi_uid: piUid });

      return res.status(200).json({
        profile: serializeUserProfile(profile),
      });
    } catch (err) {
      if (isAuthError(err)) {
        return sendAuthError(res, err);
      }

      console.error("Error saving user profile");
      return res.status(500).json({ error: "internal_error", message: "Failed to save profile" });
    }
  });
}
