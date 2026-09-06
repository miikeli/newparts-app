import { Router } from "express";

import {
  getAuthenticatedUserUid,
  isAuthError,
  sendAuthError,
} from "../services/auth";
import { validateShippingAddress, validateUserShippingAddress } from "../models/shippingAddress";
import platformAPIClient from "../services/platformAPIClient";
import {
  AddressIdGenerationError,
  createUniqueAddressId,
  findDefaultAddress,
  loadProfileView,
  maxShippingAddresses,
  persistProfileAddresses,
  serializeAddress,
  serializeUserProfile,
  type ProfileCollection,
} from "../services/userProfiles";

const getSessionUsername = (req: {
  session: { currentUser?: { username?: string } | null };
}) =>
  typeof req.session.currentUser?.username === "string"
    ? req.session.currentUser.username
    : undefined;

const readSafeString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const getProfileCollection = (req: {
  app: { locals: { userProfileCollection?: unknown } };
}) => req.app.locals.userProfileCollection as ProfileCollection | undefined;

const handleAddressIdGenerationError = (
  res: { status: (statusCode: number) => { json: (body: unknown) => unknown } },
  err: unknown,
) => {
  if (!(err instanceof AddressIdGenerationError)) {
    return false;
  }

  res.status(500).json({
    error: "address_id_generation_failed",
    message: "Could not create a unique address id",
  });

  return true;
};

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
      const profileCollection = getProfileCollection(req);

      if (!profileCollection) {
        return res.status(503).json({ error: "service_unavailable", message: "Database not ready" });
      }

      const profile = await loadProfileView(
        profileCollection,
        piUid,
        getSessionUsername(req),
      );

      return res.status(200).json({
        profile: serializeUserProfile(profile),
      });
    } catch (err) {
      if (isAuthError(err)) {
        return sendAuthError(res, err);
      }

      if (handleAddressIdGenerationError(res, err)) {
        return;
      }

      console.error("Error loading user profile");
      return res.status(500).json({ error: "internal_error", message: "Failed to load profile" });
    }
  });

  router.put("/profile", async (req, res) => {
    try {
      const piUid = await getAuthenticatedUserUid(req);
      const profileCollection = getProfileCollection(req);

      if (!profileCollection) {
        return res.status(503).json({ error: "service_unavailable", message: "Database not ready" });
      }

      const validation = validateShippingAddress(req.body?.shippingAddress);

      if (!validation.ok) {
        return res.status(400).json({
          error: "invalid_shipping_address",
          message: "Shipping address is invalid",
          errors: validation.errors,
        });
      }

      const profile = await loadProfileView(
        profileCollection,
        piUid,
        getSessionUsername(req),
      );
      const now = new Date();
      const existingDefault = findDefaultAddress(profile) ?? profile.addresses[0];
      const addressValidation = validateUserShippingAddress(
        validation.value,
        existingDefault?.id ?? createUniqueAddressId(profile.addresses),
        now,
        existingDefault?.created_at,
      );

      if (!addressValidation.ok) {
        return res.status(400).json({
          error: "invalid_shipping_address",
          message: "Shipping address is invalid",
          errors: addressValidation.errors,
        });
      }

      const addresses = existingDefault
        ? profile.addresses.map((address) =>
            address.id === existingDefault.id ? addressValidation.value : address,
          )
        : [addressValidation.value];

      await persistProfileAddresses(
        profileCollection,
        piUid,
        getSessionUsername(req),
        addresses,
        addressValidation.value.id,
      );

      const updatedProfile = await loadProfileView(
        profileCollection,
        piUid,
        getSessionUsername(req),
      );

      return res.status(200).json({
        profile: serializeUserProfile(updatedProfile),
      });
    } catch (err) {
      if (isAuthError(err)) {
        return sendAuthError(res, err);
      }

      if (handleAddressIdGenerationError(res, err)) {
        return;
      }

      console.error("Error saving user profile");
      return res.status(500).json({ error: "internal_error", message: "Failed to save profile" });
    }
  });

  router.get("/addresses", async (req, res) => {
    try {
      const piUid = await getAuthenticatedUserUid(req);
      const profileCollection = getProfileCollection(req);

      if (!profileCollection) {
        return res.status(503).json({ error: "service_unavailable", message: "Database not ready" });
      }

      const profile = await loadProfileView(
        profileCollection,
        piUid,
        getSessionUsername(req),
      );

      return res.status(200).json({
        addresses: profile.addresses.map(serializeAddress),
        defaultShippingAddressId: profile.defaultShippingAddressId,
      });
    } catch (err) {
      if (isAuthError(err)) {
        return sendAuthError(res, err);
      }

      if (handleAddressIdGenerationError(res, err)) {
        return;
      }

      console.error("Error loading user addresses");
      return res.status(500).json({ error: "internal_error", message: "Failed to load addresses" });
    }
  });

  router.post("/addresses", async (req, res) => {
    try {
      const piUid = await getAuthenticatedUserUid(req);
      const profileCollection = getProfileCollection(req);

      if (!profileCollection) {
        return res.status(503).json({ error: "service_unavailable", message: "Database not ready" });
      }

      const profile = await loadProfileView(
        profileCollection,
        piUid,
        getSessionUsername(req),
      );

      if (profile.addresses.length >= maxShippingAddresses) {
        return res.status(400).json({
          error: "address_limit_reached",
          message: `You can save up to ${maxShippingAddresses} shipping addresses`,
        });
      }

      const now = new Date();
      const validation = validateUserShippingAddress(
        req.body,
        createUniqueAddressId(profile.addresses),
        now,
      );

      if (!validation.ok) {
        return res.status(400).json({
          error: "invalid_shipping_address",
          message: "Shipping address is invalid",
          errors: validation.errors,
        });
      }

      const addresses = [...profile.addresses, validation.value];
      const defaultShippingAddressId =
        profile.defaultShippingAddressId ?? validation.value.id;

      await persistProfileAddresses(
        profileCollection,
        piUid,
        getSessionUsername(req),
        addresses,
        defaultShippingAddressId,
      );

      return res.status(201).json({
        address: serializeAddress(validation.value),
        addresses: addresses.map(serializeAddress),
        defaultShippingAddressId,
      });
    } catch (err) {
      if (isAuthError(err)) {
        return sendAuthError(res, err);
      }

      if (handleAddressIdGenerationError(res, err)) {
        return;
      }

      console.error("Error creating user address");
      return res.status(500).json({ error: "internal_error", message: "Failed to create address" });
    }
  });

  router.put("/addresses/:addressId", async (req, res) => {
    try {
      const piUid = await getAuthenticatedUserUid(req);
      const profileCollection = getProfileCollection(req);
      const addressId = readSafeString(req.params.addressId);

      if (!profileCollection) {
        return res.status(503).json({ error: "service_unavailable", message: "Database not ready" });
      }

      if (!addressId) {
        return res.status(400).json({ error: "invalid_request", message: "Address id is required" });
      }

      const profile = await loadProfileView(
        profileCollection,
        piUid,
        getSessionUsername(req),
      );
      const existingAddress = profile.addresses.find(
        (address) => address.id === addressId,
      );

      if (!existingAddress) {
        return res.status(404).json({ error: "not_found", message: "Address not found" });
      }

      const validation = validateUserShippingAddress(
        req.body,
        addressId,
        new Date(),
        existingAddress.created_at,
      );

      if (!validation.ok) {
        return res.status(400).json({
          error: "invalid_shipping_address",
          message: "Shipping address is invalid",
          errors: validation.errors,
        });
      }

      const addresses = profile.addresses.map((address) =>
        address.id === addressId ? validation.value : address,
      );

      await persistProfileAddresses(
        profileCollection,
        piUid,
        getSessionUsername(req),
        addresses,
        profile.defaultShippingAddressId,
      );

      return res.status(200).json({
        address: serializeAddress(validation.value),
        addresses: addresses.map(serializeAddress),
        defaultShippingAddressId: profile.defaultShippingAddressId,
      });
    } catch (err) {
      if (isAuthError(err)) {
        return sendAuthError(res, err);
      }

      if (handleAddressIdGenerationError(res, err)) {
        return;
      }

      console.error("Error updating user address");
      return res.status(500).json({ error: "internal_error", message: "Failed to update address" });
    }
  });

  router.delete("/addresses/:addressId", async (req, res) => {
    try {
      const piUid = await getAuthenticatedUserUid(req);
      const profileCollection = getProfileCollection(req);
      const addressId = readSafeString(req.params.addressId);

      if (!profileCollection) {
        return res.status(503).json({ error: "service_unavailable", message: "Database not ready" });
      }

      if (!addressId) {
        return res.status(400).json({ error: "invalid_request", message: "Address id is required" });
      }

      const profile = await loadProfileView(
        profileCollection,
        piUid,
        getSessionUsername(req),
      );

      if (!profile.addresses.some((address) => address.id === addressId)) {
        return res.status(404).json({ error: "not_found", message: "Address not found" });
      }

      const addresses = profile.addresses.filter(
        (address) => address.id !== addressId,
      );
      const defaultShippingAddressId =
        profile.defaultShippingAddressId === addressId
          ? addresses[0]?.id
          : profile.defaultShippingAddressId;

      await persistProfileAddresses(
        profileCollection,
        piUid,
        getSessionUsername(req),
        addresses,
        defaultShippingAddressId,
      );

      return res.status(200).json({
        addresses: addresses.map(serializeAddress),
        defaultShippingAddressId,
      });
    } catch (err) {
      if (isAuthError(err)) {
        return sendAuthError(res, err);
      }

      if (handleAddressIdGenerationError(res, err)) {
        return;
      }

      console.error("Error deleting user address");
      return res.status(500).json({ error: "internal_error", message: "Failed to delete address" });
    }
  });

  router.put("/addresses/:addressId/default", async (req, res) => {
    try {
      const piUid = await getAuthenticatedUserUid(req);
      const profileCollection = getProfileCollection(req);
      const addressId = readSafeString(req.params.addressId);

      if (!profileCollection) {
        return res.status(503).json({ error: "service_unavailable", message: "Database not ready" });
      }

      if (!addressId) {
        return res.status(400).json({ error: "invalid_request", message: "Address id is required" });
      }

      const profile = await loadProfileView(
        profileCollection,
        piUid,
        getSessionUsername(req),
      );

      if (!profile.addresses.some((address) => address.id === addressId)) {
        return res.status(404).json({ error: "not_found", message: "Address not found" });
      }

      await persistProfileAddresses(
        profileCollection,
        piUid,
        getSessionUsername(req),
        profile.addresses,
        addressId,
      );

      return res.status(200).json({
        addresses: profile.addresses.map(serializeAddress),
        defaultShippingAddressId: addressId,
      });
    } catch (err) {
      if (isAuthError(err)) {
        return sendAuthError(res, err);
      }

      if (handleAddressIdGenerationError(res, err)) {
        return;
      }

      console.error("Error setting default user address");
      return res.status(500).json({ error: "internal_error", message: "Failed to set default address" });
    }
  });
}
