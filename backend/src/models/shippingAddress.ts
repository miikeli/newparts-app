export type ShippingAddress = {
  fullName: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  country: string;
  countryCode: string;
};

export type UserShippingAddress = ShippingAddress & {
  id: string;
  label?: string;
  created_at: Date;
  updated_at: Date;
};

type ValidationResult =
  | {
      ok: true;
      value: ShippingAddress;
    }
  | {
      ok: false;
      errors: { [field: string]: string };
    };

type UserAddressValidationResult =
  | {
      ok: true;
      value: UserShippingAddress;
    }
  | {
      ok: false;
      errors: { [field: string]: string };
    };

const maxLengths: { [field in keyof ShippingAddress]: number } = {
  fullName: 100,
  phone: 32,
  address1: 140,
  address2: 140,
  city: 80,
  postalCode: 24,
  country: 80,
  countryCode: 2,
};

const maxLabelLength = 60;

const requiredFields: Array<keyof ShippingAddress> = [
  "fullName",
  "phone",
  "address1",
  "city",
  "postalCode",
  "country",
  "countryCode",
];

const readTrimmedString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const readOptionalTrimmedString = (value: unknown) => {
  const trimmed = readTrimmedString(value);

  return trimmed || undefined;
};

export const validateShippingAddress = (input: unknown): ValidationResult => {
  const source =
    typeof input === "object" && input !== null && !Array.isArray(input)
      ? (input as { [field: string]: unknown })
      : {};

  const address: ShippingAddress = {
    fullName: readTrimmedString(source.fullName),
    phone: readTrimmedString(source.phone),
    address1: readTrimmedString(source.address1),
    address2: readTrimmedString(source.address2),
    city: readTrimmedString(source.city),
    postalCode: readTrimmedString(source.postalCode),
    country: readTrimmedString(source.country),
    countryCode: readTrimmedString(source.countryCode).toUpperCase(),
  };
  const errors: { [field: string]: string } = {};

  requiredFields.forEach((field) => {
    if (!address[field]) {
      errors[field] = "Required";
    }
  });

  Object.keys(maxLengths).forEach((fieldName) => {
    const field = fieldName as keyof ShippingAddress;

    if (address[field].length > maxLengths[field]) {
      errors[field] = `Max ${maxLengths[field]} characters`;
    }
  });

  if (address.countryCode && !/^[A-Z]{2}$/.test(address.countryCode)) {
    errors.countryCode = "Use a 2-letter country code";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value: address,
  };
};

export const validateUserShippingAddress = (
  input: unknown,
  addressId: string,
  now: Date,
  createdAt?: Date,
): UserAddressValidationResult => {
  const baseValidation = validateShippingAddress(input);
  const source =
    typeof input === "object" && input !== null && !Array.isArray(input)
      ? (input as { [field: string]: unknown })
      : {};
  const label = readOptionalTrimmedString(source.label);
  const errors: { [field: string]: string } = {};

  if (!baseValidation.ok) {
    Object.assign(errors, baseValidation.errors);
  }

  if (label && label.length > maxLabelLength) {
    errors.label = `Max ${maxLabelLength} characters`;
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value: {
      ...(baseValidation as { ok: true; value: ShippingAddress }).value,
      id: addressId,
      ...(label ? { label } : {}),
      created_at: createdAt ?? now,
      updated_at: now,
    },
  };
};

export const isValidShippingAddress = (
  input: unknown,
): input is ShippingAddress => validateShippingAddress(input).ok;
