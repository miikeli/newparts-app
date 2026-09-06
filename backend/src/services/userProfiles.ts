import crypto from "crypto";
import {
  validateUserShippingAddress,
  type ShippingAddress,
  type UserShippingAddress,
} from "../models/shippingAddress";

export const maxShippingAddresses = 10;
const addressIdRetryLimit = 5;

export type UserProfileDocument = {
  pi_uid: string;
  username?: string;
  shippingAddress?: unknown;
  addresses?: unknown;
  defaultShippingAddressId?: unknown;
  created_at?: Date;
  updated_at?: Date;
};

export type UserProfileView = {
  pi_uid: string;
  username?: string;
  addresses: UserShippingAddress[];
  defaultShippingAddressId?: string;
  shippingAddress: ShippingAddress | null;
  created_at?: Date;
  updated_at?: Date;
};

export type ProfileCollection = {
  findOne: (query: unknown) => Promise<UserProfileDocument | null>;
  updateOne: (
    filter: unknown,
    update: unknown,
    options?: unknown,
  ) => Promise<unknown>;
};

export class AddressIdGenerationError extends Error {
  constructor() {
    super("Could not generate a unique shipping address id");
  }
}

const createAddressId = () =>
  `addr_${crypto.randomBytes(8).toString("hex")}`;

const readSafeString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

export const createUniqueAddressId = (
  addresses: Array<{ id?: string }>,
) => {
  const existingIds = new Set(
    addresses
      .map((address) => readSafeString(address.id))
      .filter((id): id is string => Boolean(id)),
  );

  for (let attempt = 0; attempt < addressIdRetryLimit; attempt += 1) {
    const addressId = createAddressId();

    if (!existingIds.has(addressId)) {
      return addressId;
    }
  }

  throw new AddressIdGenerationError();
};

export const serializeAddress = (address: UserShippingAddress) => ({
  id: address.id,
  label: address.label,
  fullName: address.fullName,
  phone: address.phone,
  address1: address.address1,
  address2: address.address2,
  city: address.city,
  postalCode: address.postalCode,
  country: address.country,
  countryCode: address.countryCode,
  created_at: address.created_at,
  updated_at: address.updated_at,
});

export const toShippingSnapshot = (address?: ShippingAddress) =>
  address
    ? {
        fullName: address.fullName,
        phone: address.phone,
        address1: address.address1,
        address2: address.address2,
        city: address.city,
        postalCode: address.postalCode,
        country: address.country,
        countryCode: address.countryCode,
      }
    : null;

export const serializeUserProfile = (profile: UserProfileView) => ({
  pi_uid: profile.pi_uid,
  username: profile.username,
  addresses: profile.addresses.map(serializeAddress),
  defaultShippingAddressId: profile.defaultShippingAddressId,
  shippingAddress: toShippingSnapshot(
    profile.addresses.find(
      (address) => address.id === profile.defaultShippingAddressId,
    ),
  ),
  created_at: profile.created_at,
  updated_at: profile.updated_at,
});

export const findDefaultAddress = (profile: UserProfileView) =>
  profile.addresses.find(
    (address) => address.id === profile.defaultShippingAddressId,
  );

const normalizeStoredAddress = (
  input: unknown,
  fallbackId: string,
  now: Date,
) => {
  const source =
    typeof input === "object" && input !== null && !Array.isArray(input)
      ? (input as { [field: string]: unknown })
      : {};
  const id = readSafeString(source.id) ?? fallbackId;
  const createdAt = source.created_at instanceof Date ? source.created_at : now;
  const validation = validateUserShippingAddress(input, id, now, createdAt);

  return validation.ok ? validation.value : null;
};

export const loadProfileView = async (
  profileCollection: ProfileCollection,
  piUid: string,
  username?: string,
): Promise<UserProfileView> => {
  const now = new Date();
  const profile = await profileCollection.findOne({ pi_uid: piUid });

  if (!profile) {
    return {
      pi_uid: piUid,
      username,
      addresses: [],
      shippingAddress: null,
    };
  }

  let addresses: UserShippingAddress[] = [];
  let shouldPersistMigration = false;

  if (Array.isArray(profile.addresses)) {
    profile.addresses.forEach((address) => {
      const source =
        typeof address === "object" && address !== null && !Array.isArray(address)
          ? (address as { [field: string]: unknown })
          : {};
      const fallbackId = createUniqueAddressId(addresses);

      if (!readSafeString(source.id)) {
        shouldPersistMigration = true;
      }

      const normalizedAddress = normalizeStoredAddress(address, fallbackId, now);

      if (normalizedAddress) {
        addresses.push(normalizedAddress);
      }
    });
  }

  if (addresses.length === 0 && profile.shippingAddress) {
    const migratedAddress = normalizeStoredAddress(
      {
        ...(typeof profile.shippingAddress === "object" &&
        profile.shippingAddress !== null
          ? profile.shippingAddress
          : {}),
        id: createUniqueAddressId(addresses),
        label: "Primarna adresa",
      },
      createUniqueAddressId(addresses),
      now,
    );

    if (migratedAddress) {
      addresses = [migratedAddress];
      shouldPersistMigration = true;
    }
  }

  const requestedDefaultId = readSafeString(profile.defaultShippingAddressId);
  const defaultShippingAddressId = addresses.some(
    (address) => address.id === requestedDefaultId,
  )
    ? requestedDefaultId
    : addresses[0]?.id;

  if (
    shouldPersistMigration ||
    requestedDefaultId !== defaultShippingAddressId
  ) {
    const update =
      defaultShippingAddressId
        ? {
            $set: {
              addresses,
              defaultShippingAddressId,
              updated_at: now,
            },
          }
        : {
            $set: {
              addresses,
              updated_at: now,
            },
            $unset: {
              defaultShippingAddressId: "",
            },
          };

    await profileCollection.updateOne({ pi_uid: piUid }, update);
  }

  return {
    pi_uid: profile.pi_uid,
    username: profile.username ?? username,
    addresses,
    defaultShippingAddressId,
    shippingAddress: toShippingSnapshot(
      addresses.find((address) => address.id === defaultShippingAddressId),
    ),
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
};

export const persistProfileAddresses = async (
  profileCollection: ProfileCollection,
  piUid: string,
  username: string | undefined,
  addresses: UserShippingAddress[],
  defaultShippingAddressId?: string,
) => {
  const now = new Date();
  const update =
    defaultShippingAddressId
      ? {
          $set: {
            username,
            addresses,
            defaultShippingAddressId,
            updated_at: now,
          },
          $setOnInsert: {
            pi_uid: piUid,
            created_at: now,
          },
        }
      : {
          $set: {
            username,
            addresses,
            updated_at: now,
          },
          $setOnInsert: {
            pi_uid: piUid,
            created_at: now,
          },
          $unset: {
            defaultShippingAddressId: "",
          },
        };

  await profileCollection.updateOne({ pi_uid: piUid }, update, {
    upsert: true,
  });
};
