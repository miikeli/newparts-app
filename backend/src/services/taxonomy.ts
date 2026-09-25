import crypto from "crypto";
import { type AnyBulkWriteOperation, type Collection, type Filter } from "mongodb";
import { catalogProducts } from "../data/products";
import { type ProductDocument } from "./products";

export type CategoryDocument = {
  id: string;
  name: string;
  nameMe?: string;
  nameEn?: string;
  slug: string;
  parentId?: string | null;
  active: boolean;
  sortOrder: number;
  description?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

export type BrandDocument = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  description?: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

type ValidationResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      errors: { [field: string]: string };
    };

type ProductTaxonomyFields = Pick<
  ProductDocument,
  "id" | "brand" | "brandId" | "category" | "categoryId"
>;

const maxTextLengths = {
  id: 80,
  name: 120,
  slug: 120,
  description: 1000,
  image: 600,
  logo: 600,
};

const categoryLegacyMap: { [name: string]: string } = {
  Kočnice: "brake-pads",
  Filteri: "filters",
  Paljenje: "ignition",
  Motor: "engine",
  Ovjes: "suspension",
  Upravljanje: "steering",
  Gorivo: "fuel",
  Hlađenje: "cooling",
  Elektrika: "electrical",
  Klima: "climate",
};

const categoryLocalizedNames: {
  [id: string]: { nameMe: string; nameEn: string };
} = {
  "brake-system": {
    nameMe: "Kočioni sistem",
    nameEn: "Brake System",
  },
  "brake-pads": {
    nameMe: "Kočione pločice",
    nameEn: "Brake Pads",
  },
  "brake-rotors": {
    nameMe: "Kočioni diskovi",
    nameEn: "Brake Rotors",
  },
  engine: {
    nameMe: "Motor",
    nameEn: "Engine",
  },
  filters: {
    nameMe: "Filteri",
    nameEn: "Filters",
  },
  ignition: {
    nameMe: "Paljenje",
    nameEn: "Ignition",
  },
  suspension: {
    nameMe: "Ovjes",
    nameEn: "Suspension",
  },
  electrical: {
    nameMe: "Elektrika",
    nameEn: "Electrical",
  },
  steering: {
    nameMe: "Upravljanje",
    nameEn: "Steering",
  },
  fuel: {
    nameMe: "Gorivo",
    nameEn: "Fuel",
  },
  cooling: {
    nameMe: "Hlađenje",
    nameEn: "Cooling",
  },
  climate: {
    nameMe: "Klima",
    nameEn: "Climate Control",
  },
};

const readString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const readOptionalBoolean = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const readInteger = (value: unknown, fallback: number) => {
  const parsed = Number(value);

  return Number.isSafeInteger(parsed) ? parsed : fallback;
};

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxTextLengths.slug);

const createEntityId = (prefix: string, slug: string) =>
  `${prefix}_${slug || crypto.randomBytes(4).toString("hex")}`;

const pushLengthError = (
  errors: { [field: string]: string },
  field: string,
  value: string | undefined,
  maxLength: number,
) => {
  if (value && value.length > maxLength) {
    errors[field] = `Max ${maxLength} characters`;
  }
};

const validateSlug = (
  slug: string,
  errors: { [field: string]: string },
) => {
  if (!slug) {
    errors.slug = "Required";
    return;
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug = "Use lowercase letters, numbers and hyphens";
  }
};

export const getCategoryIdForLegacyName = (name: string) =>
  categoryLegacyMap[name] || createEntityId("cat", slugify(name));

export const getBrandIdForLegacyName = (name: string) =>
  createEntityId("brand", slugify(name));

const getCategoryLocalizedNames = (id: string, fallbackName: string) =>
  categoryLocalizedNames[id] ?? {
    nameMe: fallbackName,
    nameEn: fallbackName,
  };

export const validateCategoryInput = (
  input: unknown,
  existingId?: string,
): ValidationResult<Omit<CategoryDocument, "createdAt" | "updatedAt" | "deletedAt">> => {
  const source =
    typeof input === "object" && input !== null && !Array.isArray(input)
      ? (input as { [field: string]: unknown })
      : {};
  const errors: { [field: string]: string } = {};
  const name = readString(source.name);
  const nameMe = readString(source.nameMe);
  const nameEn = readString(source.nameEn);
  const canonicalName = name || nameEn || nameMe;
  const slug = slugify(readString(source.slug) || canonicalName);
  const parentId = readString(source.parentId) || null;
  const id = existingId || readString(source.id) || createEntityId("cat", slug);
  const active = readOptionalBoolean(source.active, true);
  const sortOrder = readInteger(source.sortOrder, 0);
  const description = readString(source.description);
  const image = readString(source.image);

  if (!canonicalName) {
    errors.name = "Required";
  }

  validateSlug(slug, errors);

  if (!Number.isSafeInteger(sortOrder) || sortOrder < -100000 || sortOrder > 100000) {
    errors.sortOrder = "Use an integer sort order";
  }

  if (parentId && parentId === id) {
    errors.parentId = "Category cannot be its own parent";
  }

  pushLengthError(errors, "id", id, maxTextLengths.id);
  pushLengthError(errors, "name", canonicalName, maxTextLengths.name);
  pushLengthError(errors, "nameMe", nameMe, maxTextLengths.name);
  pushLengthError(errors, "nameEn", nameEn, maxTextLengths.name);
  pushLengthError(errors, "slug", slug, maxTextLengths.slug);
  pushLengthError(errors, "description", description, maxTextLengths.description);
  pushLengthError(errors, "image", image, maxTextLengths.image);

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      id,
      name: canonicalName,
      nameMe: nameMe || canonicalName,
      nameEn: nameEn || canonicalName,
      slug,
      parentId,
      active,
      sortOrder,
      description: description || undefined,
      image: image || undefined,
    },
  };
};

export const validateBrandInput = (
  input: unknown,
  existingId?: string,
): ValidationResult<Omit<BrandDocument, "createdAt" | "updatedAt" | "deletedAt">> => {
  const source =
    typeof input === "object" && input !== null && !Array.isArray(input)
      ? (input as { [field: string]: unknown })
      : {};
  const errors: { [field: string]: string } = {};
  const name = readString(source.name);
  const slug = slugify(readString(source.slug) || name);
  const id = existingId || readString(source.id) || createEntityId("brand", slug);
  const active = readOptionalBoolean(source.active, true);
  const description = readString(source.description);
  const logo = readString(source.logo);

  if (!name) {
    errors.name = "Required";
  }

  validateSlug(slug, errors);
  pushLengthError(errors, "id", id, maxTextLengths.id);
  pushLengthError(errors, "name", name, maxTextLengths.name);
  pushLengthError(errors, "slug", slug, maxTextLengths.slug);
  pushLengthError(errors, "description", description, maxTextLengths.description);
  pushLengthError(errors, "logo", logo, maxTextLengths.logo);

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      id,
      name,
      slug,
      active,
      description: description || undefined,
      logo: logo || undefined,
    },
  };
};

export const serializeCategory = (
  category: CategoryDocument,
  productCount = 0,
  parentName?: string,
) => ({
  id: category.id,
  name: category.name,
  nameMe: category.nameMe ?? category.name,
  nameEn: category.nameEn ?? category.name,
  slug: category.slug,
  parentId: category.parentId ?? null,
  parentName,
  active: category.active,
  sortOrder: category.sortOrder,
  description: category.description ?? "",
  image: category.image ?? "",
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
  productCount,
});

export const serializeBrand = (brand: BrandDocument, productCount = 0) => ({
  id: brand.id,
  name: brand.name,
  slug: brand.slug,
  active: brand.active,
  description: brand.description ?? "",
  logo: brand.logo ?? "",
  createdAt: brand.createdAt,
  updatedAt: brand.updatedAt,
  productCount,
});

const defaultCategories: Omit<CategoryDocument, "createdAt" | "updatedAt">[] = [
  {
    id: "brake-system",
    name: "Brake System",
    nameMe: "Kočioni sistem",
    nameEn: "Brake System",
    slug: "brake-system",
    parentId: null,
    active: true,
    sortOrder: 10,
    description: "Brake system replacement parts.",
  },
  {
    id: "brake-pads",
    name: "Brake Pads",
    nameMe: "Kočione pločice",
    nameEn: "Brake Pads",
    slug: "brake-pads",
    parentId: "brake-system",
    active: true,
    sortOrder: 11,
    description: "Front and rear brake pad sets.",
  },
  {
    id: "brake-rotors",
    name: "Brake Rotors",
    nameMe: "Kočioni diskovi",
    nameEn: "Brake Rotors",
    slug: "brake-rotors",
    parentId: "brake-system",
    active: true,
    sortOrder: 12,
    description: "Brake discs and rotors.",
  },
  {
    id: "engine",
    name: "Engine",
    nameMe: "Motor",
    nameEn: "Engine",
    slug: "engine",
    parentId: null,
    active: true,
    sortOrder: 20,
    description: "Engine service and repair parts.",
  },
  {
    id: "filters",
    name: "Filters",
    nameMe: "Filteri",
    nameEn: "Filters",
    slug: "filters",
    parentId: "engine",
    active: true,
    sortOrder: 21,
    description: "Oil, air and service filters.",
  },
  {
    id: "ignition",
    name: "Ignition",
    nameMe: "Paljenje",
    nameEn: "Ignition",
    slug: "ignition",
    parentId: "engine",
    active: true,
    sortOrder: 22,
    description: "Ignition service parts.",
  },
  {
    id: "suspension",
    name: "Suspension",
    nameMe: "Ovjes",
    nameEn: "Suspension",
    slug: "suspension",
    parentId: null,
    active: true,
    sortOrder: 30,
    description: "Suspension and ride control parts.",
  },
  {
    id: "electrical",
    name: "Electrical",
    nameMe: "Elektrika",
    nameEn: "Electrical",
    slug: "electrical",
    parentId: null,
    active: true,
    sortOrder: 40,
    description: "Electrical and battery parts.",
  },
];

export const assertNoCategoryCycle = async (
  categoryCollection: Collection<CategoryDocument>,
  categoryId: string,
  parentId?: string | null,
) => {
  if (!parentId) {
    return;
  }

  let currentParentId: string | null | undefined = parentId;

  for (let depth = 0; depth < 50 && currentParentId; depth += 1) {
    if (currentParentId === categoryId) {
      throw new Error("category_parent_cycle");
    }

    const parent: CategoryDocument | null = await categoryCollection.findOne({
      id: currentParentId,
      deletedAt: { $exists: false },
    } as Filter<CategoryDocument>);

    currentParentId = parent?.parentId;
  }
};

const bulkUpsertCategories = async (
  categoryCollection: Collection<CategoryDocument>,
  categories: Omit<CategoryDocument, "createdAt" | "updatedAt">[],
  now: Date,
) => {
  if (categories.length === 0) {
    return;
  }

  const operations: AnyBulkWriteOperation<CategoryDocument>[] = categories.map(
    (category) => ({
      updateOne: {
        filter: { id: category.id },
        update: {
          $setOnInsert: {
            ...category,
            createdAt: now,
            updatedAt: now,
          },
        },
        upsert: true,
      },
    }),
  );

  await categoryCollection.bulkWrite(operations, { ordered: true });
};

const bulkUpsertBrands = async (
  brandCollection: Collection<BrandDocument>,
  brands: Omit<BrandDocument, "createdAt" | "updatedAt">[],
  now: Date,
) => {
  if (brands.length === 0) {
    return;
  }

  const operations: AnyBulkWriteOperation<BrandDocument>[] = brands.map(
    (brand) => ({
      updateOne: {
        filter: { id: brand.id },
        update: {
          $setOnInsert: {
            ...brand,
            createdAt: now,
            updatedAt: now,
          },
        },
        upsert: true,
      },
    }),
  );

  await brandCollection.bulkWrite(operations, { ordered: true });
};

const bulkUpdateProductTaxonomy = async (
  productCollection: Collection<ProductDocument>,
  operations: AnyBulkWriteOperation<ProductDocument>[],
) => {
  if (operations.length === 0) {
    return;
  }

  await productCollection.bulkWrite(operations, { ordered: false });
};

const uniqueById = <T extends { id: string }>(items: T[]) => {
  const byId = new Map<string, T>();

  items.forEach((item) => {
    if (!byId.has(item.id)) {
      byId.set(item.id, item);
    }
  });

  return Array.from(byId.values());
};

const uniqueByIdOrSlug = <T extends { id: string; slug: string }>(items: T[]) => {
  const result: T[] = [];
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();

  items.forEach((item) => {
    if (seenIds.has(item.id) || seenSlugs.has(item.slug)) {
      return;
    }

    seenIds.add(item.id);
    seenSlugs.add(item.slug);
    result.push(item);
  });

  return result;
};

const buildBrandSeeds = (names: unknown[]) =>
  uniqueById(
    names
      .map((brandName) => String(brandName).trim())
      .filter(Boolean)
      .map((name) => ({
        id: getBrandIdForLegacyName(name),
        name,
        slug: slugify(name),
        active: true,
        description: "",
        logo: "",
      })),
  );

const buildCategorySeeds = (names: unknown[]) =>
  uniqueById(
    names
      .map((categoryName) => String(categoryName).trim())
      .filter(Boolean)
      .map((name) => {
        const id = getCategoryIdForLegacyName(name);
        const localized = getCategoryLocalizedNames(id, name);

        return {
          id,
          name: localized.nameEn,
          nameMe: localized.nameMe,
          nameEn: localized.nameEn,
          slug: slugify(localized.nameEn),
          parentId: null,
          active: true,
          sortOrder: 100,
          description: "",
          image: "",
        };
      }),
  );

const buildCategoryLocalizationUpdates = (
  categories: CategoryDocument[],
) => {
  const operations: AnyBulkWriteOperation<CategoryDocument>[] = [];

  categories.forEach((category) => {
    const localized = getCategoryLocalizedNames(category.id, category.name);
    const update: Partial<CategoryDocument> = {};

    if (!category.nameMe) {
      update.nameMe = localized.nameMe;
    }

    if (!category.nameEn) {
      update.nameEn = localized.nameEn;
    }

    if (Object.keys(update).length > 0) {
      operations.push({
        updateOne: {
          filter: { id: category.id },
          update: { $set: { ...update, updatedAt: new Date() } },
        },
      });
    }
  });

  return operations;
};

const indexBrandRelations = (brands: BrandDocument[]) => {
  const brandByName: { [name: string]: BrandDocument } = {};
  const brandById: { [id: string]: BrandDocument } = {};
  const brandBySlug: { [slug: string]: BrandDocument } = {};

  brands.forEach((brand) => {
    brandByName[brand.name] = brand;
    brandByName[brand.name.toLowerCase()] = brand;
    brandById[brand.id] = brand;
    brandBySlug[brand.slug] = brand;
  });

  return { brandByName, brandById, brandBySlug };
};

const indexCategoryRelations = (
  categories: CategoryDocument[],
  categoryNames: unknown[],
) => {
  const categoryByLegacyName: { [name: string]: CategoryDocument } = {};
  const categoryById: { [id: string]: CategoryDocument } = {};
  const categoryBySlug: { [slug: string]: CategoryDocument } = {};

  categories.forEach((category) => {
    categoryByLegacyName[category.name] = category;
    categoryByLegacyName[category.name.toLowerCase()] = category;
    categoryById[category.id] = category;
    categoryBySlug[category.slug] = category;
  });

  categoryNames.forEach((name) => {
    const label = String(name);
    const categoryId = getCategoryIdForLegacyName(label);
    const category = categoryById[categoryId];

    if (category) {
      categoryByLegacyName[label] = category;
      categoryByLegacyName[label.toLowerCase()] = category;
    }
  });

  return { categoryByLegacyName, categoryById, categoryBySlug };
};

const buildProductTaxonomyUpdates = (
  products: ProductTaxonomyFields[],
  brandIndexes: ReturnType<typeof indexBrandRelations>,
  categoryIndexes: ReturnType<typeof indexCategoryRelations>,
) => {
  const operations: AnyBulkWriteOperation<ProductDocument>[] = [];

  for (const product of products) {
    const productBrand = typeof product.brand === "string" ? product.brand : "";
    const productCategory =
      typeof product.category === "string" ? product.category : "";
    const legacyBrandId = productBrand
      ? getBrandIdForLegacyName(productBrand)
      : "";
    const legacyCategoryId = productCategory
      ? getCategoryIdForLegacyName(productCategory)
      : "";
    const brand = product.brandId
      ? brandIndexes.brandById[product.brandId]
      : brandIndexes.brandByName[productBrand] ||
        brandIndexes.brandByName[productBrand.toLowerCase()] ||
        brandIndexes.brandById[legacyBrandId] ||
        brandIndexes.brandBySlug[slugify(productBrand)];
    const category = product.categoryId
      ? categoryIndexes.categoryById[product.categoryId]
      : categoryIndexes.categoryByLegacyName[productCategory] ||
        categoryIndexes.categoryByLegacyName[productCategory.toLowerCase()] ||
        categoryIndexes.categoryById[legacyCategoryId] ||
        categoryIndexes.categoryBySlug[slugify(productCategory)];
    const update: Partial<ProductDocument> = {};

    if (brand && product.brandId !== brand.id) {
      update.brandId = brand.id;
    }

    if (brand && product.brand !== brand.name) {
      update.brand = brand.name;
    }

    if (category && product.categoryId !== category.id) {
      update.categoryId = category.id;
    }

    if (category && product.category !== category.name) {
      update.category = category.name;
    }

    if (Object.keys(update).length > 0) {
      operations.push({
        updateOne: {
          filter: { id: product.id },
          update: { $set: { ...update, updatedAt: new Date() } },
        },
      });
    }
  }

  return operations;
};

export const seedTaxonomyAndProductRelations = async (
  productCollection: Collection<ProductDocument>,
  categoryCollection: Collection<CategoryDocument>,
  brandCollection: Collection<BrandDocument>,
) => {
  const now = new Date();

  const productBrands = await productCollection.distinct("brand", {
    deletedAt: { $exists: false },
  });
  const productCategories = await productCollection.distinct("category", {
    deletedAt: { $exists: false },
  });
  const catalogBrands = catalogProducts.map((product) => product.brand);
  const catalogCategories = catalogProducts.map((product) => product.category);
  const brandNames = Array.from(new Set([...catalogBrands, ...productBrands].filter(Boolean)));
  const categoryNames = Array.from(
    new Set([...catalogCategories, ...productCategories].filter(Boolean)),
  );

  await bulkUpsertCategories(
    categoryCollection,
    uniqueByIdOrSlug([
      ...defaultCategories,
      ...buildCategorySeeds(categoryNames),
    ]),
    now,
  );
  await bulkUpsertBrands(brandCollection, buildBrandSeeds(brandNames), now);

  const seededCategories = await categoryCollection.find({
    deletedAt: { $exists: false },
  } as Filter<CategoryDocument>).toArray();
  const categoryLocalizationUpdates =
    buildCategoryLocalizationUpdates(seededCategories);

  if (categoryLocalizationUpdates.length > 0) {
    await categoryCollection.bulkWrite(categoryLocalizationUpdates, {
      ordered: false,
    });
  }

  const brands = await brandCollection.find({
    deletedAt: { $exists: false },
  } as Filter<BrandDocument>).toArray();
  const categories = await categoryCollection.find({
    deletedAt: { $exists: false },
  } as Filter<CategoryDocument>).toArray();
  const brandIndexes = indexBrandRelations(brands);
  const categoryIndexes = indexCategoryRelations(categories, categoryNames);

  const products = await productCollection.find({
    deletedAt: { $exists: false },
  } as Filter<ProductDocument>)
    .project<ProductTaxonomyFields>({
      id: 1,
      brand: 1,
      brandId: 1,
      category: 1,
      categoryId: 1,
    })
    .toArray();
  const productUpdates = buildProductTaxonomyUpdates(
    products,
    brandIndexes,
    categoryIndexes,
  );

  await bulkUpdateProductTaxonomy(productCollection, productUpdates);
};
