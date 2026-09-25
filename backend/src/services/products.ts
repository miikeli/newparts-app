import crypto from "crypto";
import { type Collection, type Filter } from "mongodb";
import { catalogProducts, findCatalogProductById } from "../data/products";
import {
  getBrandIdForLegacyName,
  getCategoryIdForLegacyName,
  type BrandDocument,
  type CategoryDocument,
} from "./taxonomy";

export type ProductSpecification = {
  key: string;
  value: string;
};

export type ProductFitment = {
  year: string;
  make: string;
  model: string;
  submodel: string;
  notes: string;
};

export type ProductDocument = {
  id: string;
  name: string;
  nameMe?: string;
  nameEn?: string;
  sku: string;
  mpn: string;
  brand: string;
  brandId: string;
  category: string;
  categoryId: string;
  pricePi: number;
  stock: number;
  active: boolean;
  description: string;
  descriptionMe?: string;
  descriptionEn?: string;
  images: string[];
  specifications: ProductSpecification[];
  fitments: ProductFitment[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

export type PaymentProduct = {
  id: string;
  name: string;
  brand: string;
  sku: string;
  mpn: string;
  price: number;
  stock: number;
  image: string;
};

type ProductValidationResult =
  | {
      ok: true;
      value: Omit<ProductDocument, "createdAt" | "updatedAt">;
    }
  | {
      ok: false;
      errors: { [field: string]: string };
    };

const maxTextLengths = {
  id: 80,
  name: 160,
  sku: 80,
  mpn: 80,
  brand: 100,
  category: 100,
  description: 3000,
  image: 600,
  specKey: 80,
  specValue: 300,
  fitmentField: 80,
  fitmentNotes: 300,
};

const readString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const readOptionalBoolean = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const readFiniteNumber = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const hasPiAmountPrecision = (value: number) =>
  /^\d+(\.\d{1,7})?$/.test(String(value));

const createProductId = (name: string, sku: string) => {
  const base = `${sku || name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${base || "product"}-${crypto.randomBytes(3).toString("hex")}`;
};

const pushLengthError = (
  errors: { [field: string]: string },
  field: string,
  value: string,
  maxLength: number,
) => {
  if (value.length > maxLength) {
    errors[field] = `Max ${maxLength} characters`;
  }
};

const readStringArray = (
  input: unknown,
  errors: { [field: string]: string },
) => {
  if (!Array.isArray(input)) {
    return [];
  }

  if (input.length > 12) {
    errors.images = "Max 12 images";
  }

  return input
    .map(readString)
    .filter(Boolean)
    .slice(0, 12);
};

const readSpecifications = (
  input: unknown,
  errors: { [field: string]: string },
) => {
  if (!Array.isArray(input)) {
    return [];
  }

  if (input.length > 50) {
    errors.specifications = "Max 50 specification rows";
  }

  return input
    .slice(0, 50)
    .map((item) => {
      const source =
        typeof item === "object" && item !== null && !Array.isArray(item)
          ? (item as { [field: string]: unknown })
          : {};

      return {
        key: readString(source.key),
        value: readString(source.value),
      };
    })
    .filter((item) => item.key || item.value);
};

const readFitments = (
  input: unknown,
  errors: { [field: string]: string },
) => {
  if (!Array.isArray(input)) {
    return [];
  }

  if (input.length > 150) {
    errors.fitments = "Max 150 fitment rows";
  }

  return input
    .slice(0, 150)
    .map((item) => {
      const source =
        typeof item === "object" && item !== null && !Array.isArray(item)
          ? (item as { [field: string]: unknown })
          : {};

      return {
        year: readString(source.year),
        make: readString(source.make),
        model: readString(source.model),
        submodel: readString(source.submodel),
        notes: readString(source.notes),
      };
    })
    .filter(
      (item) =>
        item.year || item.make || item.model || item.submodel || item.notes,
    );
};

export const validateProductInput = (
  input: unknown,
  existingId?: string,
  refs?: {
    brand?: Pick<BrandDocument, "id" | "name">;
    category?: Pick<CategoryDocument, "id" | "name">;
  },
): ProductValidationResult => {
  const source =
    typeof input === "object" && input !== null && !Array.isArray(input)
      ? (input as { [field: string]: unknown })
      : {};
  const errors: { [field: string]: string } = {};
  const name = readString(source.name);
  const nameMe = readString(source.nameMe);
  const nameEn = readString(source.nameEn);
  const sku = readString(source.sku);
  const mpn = readString(source.mpn);
  const brand = readString(source.brand);
  const brandId = readString(source.brandId);
  const category = readString(source.category);
  const categoryId = readString(source.categoryId);
  const description = readString(source.description);
  const descriptionMe = readString(source.descriptionMe);
  const descriptionEn = readString(source.descriptionEn);
  const pricePi = readFiniteNumber(source.pricePi);
  const stock = readFiniteNumber(source.stock);
  const requestedId = readString(source.id);
  const canonicalName = name || nameMe || nameEn;
  const canonicalDescription = description || descriptionMe || descriptionEn;
  const id = (existingId ?? requestedId) || createProductId(canonicalName, sku);
  const images = readStringArray(source.images, errors);
  const specifications = readSpecifications(source.specifications, errors);
  const fitments = readFitments(source.fitments, errors);

  if (!canonicalName) {
    errors.name = "Required";
  }

  if (!sku) {
    errors.sku = "Required";
  }

  if (!mpn) {
    errors.mpn = "Required";
  }

  if (!brand && !refs?.brand) {
    errors.brand = "Required";
  }

  if (!category && !refs?.category) {
    errors.category = "Required";
  }

  if (!brandId) {
    errors.brandId = "Required";
  }

  if (!categoryId) {
    errors.categoryId = "Required";
  }

  if (pricePi === undefined || pricePi <= 0 || !hasPiAmountPrecision(pricePi)) {
    errors.pricePi = "Use a positive Pi amount with up to 7 decimals";
  }

  if (
    stock === undefined ||
    !Number.isSafeInteger(stock) ||
    stock < 0 ||
    stock > 100000
  ) {
    errors.stock = "Use an integer stock quantity between 0 and 100000";
  }

  pushLengthError(errors, "id", id, maxTextLengths.id);
  pushLengthError(errors, "name", canonicalName, maxTextLengths.name);
  pushLengthError(errors, "nameMe", nameMe, maxTextLengths.name);
  pushLengthError(errors, "nameEn", nameEn, maxTextLengths.name);
  pushLengthError(errors, "sku", sku, maxTextLengths.sku);
  pushLengthError(errors, "mpn", mpn, maxTextLengths.mpn);
  pushLengthError(errors, "brand", brand, maxTextLengths.brand);
  pushLengthError(errors, "brandId", brandId, maxTextLengths.id);
  pushLengthError(errors, "category", category, maxTextLengths.category);
  pushLengthError(errors, "categoryId", categoryId, maxTextLengths.id);
  pushLengthError(errors, "description", canonicalDescription, maxTextLengths.description);
  pushLengthError(errors, "descriptionMe", descriptionMe, maxTextLengths.description);
  pushLengthError(errors, "descriptionEn", descriptionEn, maxTextLengths.description);

  images.forEach((image, index) =>
    pushLengthError(errors, `images.${index}`, image, maxTextLengths.image),
  );

  specifications.forEach((spec, index) => {
    pushLengthError(errors, `specifications.${index}.key`, spec.key, maxTextLengths.specKey);
    pushLengthError(errors, `specifications.${index}.value`, spec.value, maxTextLengths.specValue);
  });

  fitments.forEach((fitment, index) => {
    pushLengthError(errors, `fitments.${index}.year`, fitment.year, maxTextLengths.fitmentField);
    pushLengthError(errors, `fitments.${index}.make`, fitment.make, maxTextLengths.fitmentField);
    pushLengthError(errors, `fitments.${index}.model`, fitment.model, maxTextLengths.fitmentField);
    pushLengthError(errors, `fitments.${index}.submodel`, fitment.submodel, maxTextLengths.fitmentField);
    pushLengthError(errors, `fitments.${index}.notes`, fitment.notes, maxTextLengths.fitmentNotes);
  });

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value: {
      id,
      name: canonicalName,
      nameMe: nameMe || canonicalName,
      nameEn: nameEn || canonicalName,
      sku,
      mpn,
      brand: refs?.brand?.name ?? brand,
      brandId,
      category: refs?.category?.name ?? category,
      categoryId,
      pricePi: Number((pricePi as number).toFixed(7)),
      stock: stock as number,
      active: readOptionalBoolean(source.active, true),
      description: canonicalDescription,
      descriptionMe: descriptionMe || canonicalDescription,
      descriptionEn: descriptionEn || canonicalDescription,
      images,
      specifications,
      fitments,
    },
  };
};

const catalogToProductDocument = (now: Date): ProductDocument[] =>
  catalogProducts.map((product) => ({
    id: product.id,
    name: product.name,
    nameMe: product.nameMe,
    nameEn: product.nameEn,
    sku: product.sku,
    mpn: product.mpn,
    brand: product.brand,
    brandId: getBrandIdForLegacyName(product.brand),
    category: product.category,
    categoryId: getCategoryIdForLegacyName(product.category),
    pricePi: product.price,
    stock: product.stock,
    active: product.active,
    description: product.description,
    descriptionMe: product.descriptionMe,
    descriptionEn: product.descriptionEn,
    images: product.images,
    specifications: product.specifications,
    fitments: product.fitments,
    createdAt: now,
    updatedAt: now,
  }));

export const seedProductsCollection = async (
  productCollection: Collection<ProductDocument>,
) => {
  const now = new Date();
  const seedProducts = catalogToProductDocument(now);

  for (const product of seedProducts) {
    await productCollection.updateOne(
      { id: product.id },
      { $setOnInsert: product },
      { upsert: true },
    );

    await productCollection.updateOne(
      {
        id: product.id,
        $or: [
          { nameMe: { $exists: false } },
          { nameMe: "" },
          { nameEn: { $exists: false } },
          { nameEn: "" },
          { descriptionMe: { $exists: false } },
          { descriptionMe: "" },
          { descriptionEn: { $exists: false } },
          { descriptionEn: "" },
        ],
      },
      {
        $set: {
          nameMe: product.nameMe,
          nameEn: product.nameEn,
          descriptionMe: product.descriptionMe,
          descriptionEn: product.descriptionEn,
          updatedAt: now,
        },
      },
    );
  }
};

export const serializeProduct = (
  product: ProductDocument,
  refs?: {
    brand?: Pick<BrandDocument, "name" | "active">;
    category?: Pick<CategoryDocument, "name" | "active">;
  },
) => ({
  id: product.id,
  name: product.name,
  nameMe: product.nameMe ?? product.name,
  nameEn: product.nameEn ?? product.name,
  sku: product.sku,
  mpn: product.mpn,
  brand: refs?.brand?.name ?? product.brand,
  brandId: product.brandId,
  brandActive: refs?.brand?.active,
  category: refs?.category?.name ?? product.category,
  categoryId: product.categoryId,
  categoryActive: refs?.category?.active,
  pricePi: product.pricePi,
  stock: product.stock,
  active: product.active,
  description: product.description,
  descriptionMe: product.descriptionMe ?? product.description,
  descriptionEn: product.descriptionEn ?? product.description,
  images: product.images,
  specifications: product.specifications,
  fitments: product.fitments,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const mongoProductToPaymentProduct = (
  product: ProductDocument,
): PaymentProduct => ({
  id: product.id,
  name: product.name,
  brand: product.brand,
  sku: product.sku,
  mpn: product.mpn,
  price: product.pricePi,
  stock: product.stock,
  image: product.images[0] ?? "",
});

export const findProductForPayment = async (
  productCollection: Collection<ProductDocument> | undefined,
  productId: string,
) => {
  if (productCollection) {
    const product = await productCollection.findOne({
      id: productId,
    } as Filter<ProductDocument>);

    return product && product.active && !product.deletedAt
      ? mongoProductToPaymentProduct(product)
      : undefined;
  }

  const fallbackProduct = findCatalogProductById(productId);

  return fallbackProduct && fallbackProduct.active
    ? {
        id: fallbackProduct.id,
        name: fallbackProduct.name,
        brand: fallbackProduct.brand,
        sku: fallbackProduct.sku,
        mpn: fallbackProduct.mpn,
        price: fallbackProduct.price,
        stock: fallbackProduct.stock,
        image: fallbackProduct.image,
      }
    : undefined;
};
