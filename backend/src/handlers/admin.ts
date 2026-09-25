import { Router } from "express";
import { type Collection, type Filter, type Sort } from "mongodb";
import { requireAdminUser, isAdminAuthError } from "../services/adminAuth";
import {
  serializeProduct,
  validateProductInput,
  type ProductDocument,
} from "../services/products";
import {
  assertNoCategoryCycle,
  serializeBrand,
  serializeCategory,
  validateBrandInput,
  validateCategoryInput,
  type BrandDocument,
  type CategoryDocument,
} from "../services/taxonomy";

const allowedProductSortFields = new Set(["name", "pricePi", "stock"]);
const allowedCategorySortFields = new Set(["name", "slug", "sortOrder"]);
const allowedBrandSortFields = new Set(["name", "slug"]);
const maxPageSize = 100;

const readString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const readPositiveInteger = (value: unknown, fallback: number) => {
  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isDuplicateKeyError = (err: unknown) =>
  typeof err === "object" &&
  err !== null &&
  "code" in err &&
  (err as { code?: unknown }).code === 11000;

const getProductCollection = (req: {
  app: { locals: { productCollection?: unknown } };
}) => req.app.locals.productCollection as
  | Collection<ProductDocument>
  | undefined;

const getCategoryCollection = (req: {
  app: { locals: { categoryCollection?: unknown } };
}) => req.app.locals.categoryCollection as
  | Collection<CategoryDocument>
  | undefined;

const getBrandCollection = (req: {
  app: { locals: { brandCollection?: unknown } };
}) => req.app.locals.brandCollection as Collection<BrandDocument> | undefined;

const sendAdminError = (
  res: { status: (statusCode: number) => { json: (body: unknown) => unknown } },
  err: unknown,
) => {
  if (isAdminAuthError(err)) {
    return res.status(err.statusCode).json({
      error: err.error,
      message: err.message,
    });
  }

  console.error(
    "Admin request failed",
    err instanceof Error ? err.message : "Unknown error",
  );
  return res.status(500).json({
    error: "internal_error",
    message: "Admin request failed",
  });
};

const requireCollections = (req: {
  app: {
    locals: {
      productCollection?: unknown;
      categoryCollection?: unknown;
      brandCollection?: unknown;
    };
  };
}) => {
  const productCollection = getProductCollection(req);
  const categoryCollection = getCategoryCollection(req);
  const brandCollection = getBrandCollection(req);

  if (!productCollection || !categoryCollection || !brandCollection) {
    return null;
  }

  return { productCollection, categoryCollection, brandCollection };
};

const buildProductFilter = (query: {
  search?: unknown;
  categoryId?: unknown;
  category?: unknown;
  brandId?: unknown;
  brand?: unknown;
  stockStatus?: unknown;
  status?: unknown;
}) => {
  const filter: Filter<ProductDocument> = { deletedAt: { $exists: false } };
  const search = readString(query.search);
  const categoryId = readString(query.categoryId) || readString(query.category);
  const brandId = readString(query.brandId) || readString(query.brand);
  const stockStatus = readString(query.stockStatus);
  const status = readString(query.status);

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { sku: pattern },
      { name: pattern },
      { nameMe: pattern },
      { nameEn: pattern },
      { descriptionMe: pattern },
      { descriptionEn: pattern },
      { brand: pattern },
      { category: pattern },
      { mpn: pattern },
    ];
  }

  if (categoryId) {
    filter.categoryId = categoryId;
  }

  if (brandId) {
    filter.brandId = brandId;
  }

  if (stockStatus === "out") {
    filter.stock = { $lte: 0 };
  } else if (stockStatus === "low") {
    filter.stock = { $gt: 0, $lte: 10 };
  } else if (stockStatus === "in") {
    filter.stock = { $gt: 10 };
  }

  if (status === "active") {
    filter.active = true;
  } else if (status === "inactive") {
    filter.active = false;
  }

  return filter;
};

const buildEntityFilter = (query: {
  search?: unknown;
  status?: unknown;
  parentId?: unknown;
}) => {
  const filter: Filter<CategoryDocument | BrandDocument> = {
    deletedAt: { $exists: false },
  };
  const search = readString(query.search);
  const status = readString(query.status);
  const parentId = readString(query.parentId);

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { name: pattern },
      { nameMe: pattern },
      { nameEn: pattern },
      { slug: pattern },
    ];
  }

  if (status === "active") {
    filter.active = true;
  } else if (status === "inactive") {
    filter.active = false;
  }

  if (parentId) {
    (filter as Filter<CategoryDocument>).parentId = parentId;
  }

  return filter;
};

const loadRelationMaps = async (
  brandCollection: Collection<BrandDocument>,
  categoryCollection: Collection<CategoryDocument>,
) => {
  const [brands, categories] = await Promise.all([
    brandCollection.find({ deletedAt: { $exists: false } }).toArray(),
    categoryCollection.find({ deletedAt: { $exists: false } }).toArray(),
  ]);
  const brandsById: { [id: string]: BrandDocument } = {};
  const categoriesById: { [id: string]: CategoryDocument } = {};

  brands.forEach((brand) => {
    brandsById[brand.id] = brand;
  });

  categories.forEach((category) => {
    categoriesById[category.id] = category;
  });

  return { brands, categories, brandsById, categoriesById };
};

const countProducts = async (
  productCollection: Collection<ProductDocument>,
  field: "brandId" | "categoryId",
  id: string,
) =>
  productCollection.countDocuments({
    [field]: id,
    deletedAt: { $exists: false },
  } as Filter<ProductDocument>);

const countProductsByField = async (
  productCollection: Collection<ProductDocument>,
  field: "brandId" | "categoryId",
) => {
  const rows = await productCollection
    .aggregate<{ _id: string; count: number }>([
      {
        $match: {
          deletedAt: { $exists: false },
          [field]: { $type: "string" },
        },
      },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    ])
    .toArray();
  const counts: { [id: string]: number } = {};

  rows.forEach((row) => {
    if (row._id) {
      counts[row._id] = row.count;
    }
  });

  return counts;
};

const sendValidationErrors = (
  res: { status: (statusCode: number) => { json: (body: unknown) => unknown } },
  message: string,
  errors: { [field: string]: string },
) =>
  res.status(400).json({
    error: "invalid_input",
    message,
    errors,
  });

const ensureUniqueSlug = async <T extends { id: string; slug: string }>(
  collection: Collection<T>,
  slug: string,
  id: string,
) => {
  const existing = await collection.findOne({
    slug,
    id: { $ne: id },
    deletedAt: { $exists: false },
  } as Filter<T>);

  return !existing;
};

const getProductRefs = async (
  collections: {
    brandCollection: Collection<BrandDocument>;
    categoryCollection: Collection<CategoryDocument>;
  },
  body: { brandId?: unknown; categoryId?: unknown },
) => {
  const brandId = readString(body?.brandId);
  const categoryId = readString(body?.categoryId);
  const [brand, category] = await Promise.all([
    brandId
      ? collections.brandCollection.findOne({
          id: brandId,
          deletedAt: { $exists: false },
        })
      : null,
    categoryId
      ? collections.categoryCollection.findOne({
          id: categoryId,
          deletedAt: { $exists: false },
        })
      : null,
  ]);
  const errors: { [field: string]: string } = {};

  if (brandId && !brand) {
    errors.brandId = "Brand does not exist";
  }

  if (categoryId && !category) {
    errors.categoryId = "Category does not exist";
  }

  return { brand, category, errors };
};

export default function mountAdminEndpoints(router: Router) {
  router.get("/me", async (req, res) => {
    try {
      const adminUser = await requireAdminUser(req);

      return res.status(200).json({ admin: adminUser });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.get("/products", async (req, res) => {
    try {
      await requireAdminUser(req);
      const collections = requireCollections(req);

      if (!collections) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Database not ready",
        });
      }

      const page = readPositiveInteger(req.query.page, 1);
      const pageSize = Math.min(
        readPositiveInteger(req.query.pageSize, 10),
        maxPageSize,
      );
      const sortBy = allowedProductSortFields.has(readString(req.query.sortBy))
        ? readString(req.query.sortBy)
        : "name";
      const sortDir = readString(req.query.sortDir) === "desc" ? -1 : 1;
      const filter = buildProductFilter(req.query);
      const sort: Sort = { [sortBy]: sortDir, id: 1 };
      const [products, total, relations] = await Promise.all([
        collections.productCollection
          .find(filter)
          .sort(sort)
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .toArray(),
        collections.productCollection.countDocuments(filter),
        loadRelationMaps(
          collections.brandCollection,
          collections.categoryCollection,
        ),
      ]);
      const [productCountsByBrand, productCountsByCategory] =
        await Promise.all([
          countProductsByField(collections.productCollection, "brandId"),
          countProductsByField(collections.productCollection, "categoryId"),
        ]);

      return res.status(200).json({
        products: products.map((product) =>
          serializeProduct(product, {
            brand: relations.brandsById[product.brandId],
            category: relations.categoriesById[product.categoryId],
          }),
        ),
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        categories: relations.categories
          .map((category) =>
            serializeCategory(
              category,
              productCountsByCategory[category.id] ?? 0,
              category.parentId
                ? relations.categoriesById[category.parentId]?.name
                : undefined,
            ),
          )
          .sort(
            (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
          ),
        brands: relations.brands
          .map((brand) =>
            serializeBrand(brand, productCountsByBrand[brand.id] ?? 0),
          )
          .sort((a, b) => a.name.localeCompare(b.name)),
      });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.get("/products/:id", async (req, res) => {
    try {
      await requireAdminUser(req);
      const collections = requireCollections(req);
      const id = readString(req.params.id);

      if (!collections) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Database not ready",
        });
      }

      const product = await collections.productCollection.findOne({
        id,
        deletedAt: { $exists: false },
      });

      if (!product) {
        return res.status(404).json({
          error: "not_found",
          message: "Product not found",
        });
      }

      const relations = await loadRelationMaps(
        collections.brandCollection,
        collections.categoryCollection,
      );

      return res.status(200).json({
        product: serializeProduct(product, {
          brand: relations.brandsById[product.brandId],
          category: relations.categoriesById[product.categoryId],
        }),
      });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.post("/products", async (req, res) => {
    try {
      await requireAdminUser(req);
      const collections = requireCollections(req);

      if (!collections) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Database not ready",
        });
      }

      const refs = await getProductRefs(collections, req.body);

      if (Object.keys(refs.errors).length > 0) {
        return sendValidationErrors(
          res,
          "Product input is invalid",
          refs.errors,
        );
      }

      const validation = validateProductInput(req.body, undefined, {
        brand: refs.brand ?? undefined,
        category: refs.category ?? undefined,
      });

      if (!validation.ok) {
        return res.status(400).json({
          error: "invalid_product",
          message: "Product input is invalid",
          errors: validation.errors,
        });
      }

      const now = new Date();
      const product = {
        ...validation.value,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await collections.productCollection.insertOne(product);
      } catch (err) {
        if (isDuplicateKeyError(err)) {
          return res.status(409).json({
            error: "duplicate_product",
            message: "Product id or SKU already exists",
          });
        }

        throw err;
      }

      return res.status(201).json({
        product: serializeProduct(product, {
          brand: refs.brand ?? undefined,
          category: refs.category ?? undefined,
        }),
      });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.put("/products/:id", async (req, res) => {
    try {
      await requireAdminUser(req);
      const collections = requireCollections(req);
      const id = readString(req.params.id);

      if (!collections) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Database not ready",
        });
      }

      const existingProduct = await collections.productCollection.findOne({
        id,
        deletedAt: { $exists: false },
      });

      if (!existingProduct) {
        return res.status(404).json({
          error: "not_found",
          message: "Product not found",
        });
      }

      const refs = await getProductRefs(collections, req.body);

      if (Object.keys(refs.errors).length > 0) {
        return sendValidationErrors(
          res,
          "Product input is invalid",
          refs.errors,
        );
      }

      const validation = validateProductInput(req.body, id, {
        brand: refs.brand ?? undefined,
        category: refs.category ?? undefined,
      });

      if (!validation.ok) {
        return res.status(400).json({
          error: "invalid_product",
          message: "Product input is invalid",
          errors: validation.errors,
        });
      }

      const product: ProductDocument = {
        ...validation.value,
        createdAt: existingProduct.createdAt,
        updatedAt: new Date(),
      };

      try {
        await collections.productCollection.updateOne({ id }, { $set: product });
      } catch (err) {
        if (isDuplicateKeyError(err)) {
          return res.status(409).json({
            error: "duplicate_product",
            message: "SKU already exists",
          });
        }

        throw err;
      }

      return res.status(200).json({
        product: serializeProduct(product, {
          brand: refs.brand ?? undefined,
          category: refs.category ?? undefined,
        }),
      });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.patch("/products/:id/toggle-active", async (req, res) => {
    try {
      await requireAdminUser(req);
      const productCollection = getProductCollection(req);
      const id = readString(req.params.id);

      if (!productCollection) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Database not ready",
        });
      }

      const product = await productCollection.findOne({
        id,
        deletedAt: { $exists: false },
      });

      if (!product) {
        return res.status(404).json({
          error: "not_found",
          message: "Product not found",
        });
      }

      const active = !product.active;
      const updatedAt = new Date();
      await productCollection.updateOne(
        { id },
        { $set: { active, updatedAt } },
      );

      return res.status(200).json({
        product: serializeProduct({ ...product, active, updatedAt }),
      });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.delete("/products/:id", async (req, res) => {
    try {
      await requireAdminUser(req);
      const productCollection = getProductCollection(req);
      const id = readString(req.params.id);

      if (!productCollection) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Database not ready",
        });
      }

      const result = await productCollection.updateOne(
        { id, deletedAt: { $exists: false } },
        {
          $set: {
            active: false,
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          error: "not_found",
          message: "Product not found",
        });
      }

      return res.status(200).json({ message: "Product deleted" });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.get("/categories", async (req, res) => {
    try {
      await requireAdminUser(req);
      const collections = requireCollections(req);

      if (!collections) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Database not ready",
        });
      }

      const page = readPositiveInteger(req.query.page, 1);
      const pageSize = Math.min(
        readPositiveInteger(req.query.pageSize, 25),
        maxPageSize,
      );
      const sortBy = allowedCategorySortFields.has(readString(req.query.sortBy))
        ? readString(req.query.sortBy)
        : "sortOrder";
      const sortDir = readString(req.query.sortDir) === "desc" ? -1 : 1;
      const filter = buildEntityFilter(req.query) as Filter<CategoryDocument>;
      const sort: Sort = { [sortBy]: sortDir, name: 1 };
      const [categories, total, allCategories] = await Promise.all([
        collections.categoryCollection
          .find(filter)
          .sort(sort)
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .toArray(),
        collections.categoryCollection.countDocuments(filter),
        collections.categoryCollection
          .find({ deletedAt: { $exists: false } })
          .toArray(),
      ]);
      const categoriesById: { [id: string]: CategoryDocument } = {};
      const counts = await countProductsByField(
        collections.productCollection,
        "categoryId",
      );

      allCategories.forEach((category) => {
        categoriesById[category.id] = category;
      });

      return res.status(200).json({
        categories: categories.map((category) =>
          serializeCategory(
            category,
            counts[category.id] ?? 0,
            category.parentId
              ? categoriesById[category.parentId]?.name
              : undefined,
          ),
        ),
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.get("/categories/:id", async (req, res) => {
    try {
      await requireAdminUser(req);
      const collections = requireCollections(req);
      const id = readString(req.params.id);

      if (!collections) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Database not ready",
        });
      }

      const category = await collections.categoryCollection.findOne({
        id,
        deletedAt: { $exists: false },
      });

      if (!category) {
        return res.status(404).json({
          error: "not_found",
          message: "Category not found",
        });
      }

      const productCount = await countProducts(
        collections.productCollection,
        "categoryId",
        category.id,
      );

      return res.status(200).json({
        category: serializeCategory(category, productCount),
      });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.post("/categories", async (req, res) => {
    try {
      await requireAdminUser(req);
      const collections = requireCollections(req);

      if (!collections) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Database not ready",
        });
      }

      const validation = validateCategoryInput(req.body);

      if (!validation.ok) {
        return sendValidationErrors(
          res,
          "Category input is invalid",
          validation.errors,
        );
      }

      if (
        !(await ensureUniqueSlug(
          collections.categoryCollection,
          validation.value.slug,
          validation.value.id,
        ))
      ) {
        return sendValidationErrors(res, "Category input is invalid", {
          slug: "Slug already exists",
        });
      }

      if (validation.value.parentId) {
        const parent = await collections.categoryCollection.findOne({
          id: validation.value.parentId,
          deletedAt: { $exists: false },
        });

        if (!parent) {
          return sendValidationErrors(res, "Category input is invalid", {
            parentId: "Parent category does not exist",
          });
        }
      }

      try {
        await assertNoCategoryCycle(
          collections.categoryCollection,
          validation.value.id,
          validation.value.parentId,
        );
      } catch {
        return sendValidationErrors(res, "Category input is invalid", {
          parentId: "Category parent would create a cycle",
        });
      }

      const now = new Date();
      const category: CategoryDocument = {
        ...validation.value,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await collections.categoryCollection.insertOne(category);
      } catch (err) {
        if (isDuplicateKeyError(err)) {
          return res.status(409).json({
            error: "duplicate_category",
            message: "Category id or slug already exists",
          });
        }

        throw err;
      }

      return res.status(201).json({ category: serializeCategory(category) });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.put("/categories/:id", async (req, res) => {
    try {
      await requireAdminUser(req);
      const collections = requireCollections(req);
      const id = readString(req.params.id);

      if (!collections) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Database not ready",
        });
      }

      const existing = await collections.categoryCollection.findOne({
        id,
        deletedAt: { $exists: false },
      });

      if (!existing) {
        return res.status(404).json({
          error: "not_found",
          message: "Category not found",
        });
      }

      const validation = validateCategoryInput(req.body, id);

      if (!validation.ok) {
        return sendValidationErrors(
          res,
          "Category input is invalid",
          validation.errors,
        );
      }

      if (
        !(await ensureUniqueSlug(
          collections.categoryCollection,
          validation.value.slug,
          id,
        ))
      ) {
        return sendValidationErrors(res, "Category input is invalid", {
          slug: "Slug already exists",
        });
      }

      if (validation.value.parentId) {
        const parent = await collections.categoryCollection.findOne({
          id: validation.value.parentId,
          deletedAt: { $exists: false },
        });

        if (!parent) {
          return sendValidationErrors(res, "Category input is invalid", {
            parentId: "Parent category does not exist",
          });
        }
      }

      try {
        await assertNoCategoryCycle(
          collections.categoryCollection,
          id,
          validation.value.parentId,
        );
      } catch {
        return sendValidationErrors(res, "Category input is invalid", {
          parentId: "Category parent would create a cycle",
        });
      }

      const category: CategoryDocument = {
        ...validation.value,
        createdAt: existing.createdAt,
        updatedAt: new Date(),
      };

      await collections.categoryCollection.updateOne({ id }, { $set: category });
      await collections.productCollection.updateMany(
        { categoryId: id, deletedAt: { $exists: false } },
        { $set: { category: category.name, updatedAt: new Date() } },
      );

      return res.status(200).json({ category: serializeCategory(category) });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.patch("/categories/:id/toggle-active", async (req, res) => {
    try {
      await requireAdminUser(req);
      const categoryCollection = getCategoryCollection(req);
      const id = readString(req.params.id);

      if (!categoryCollection) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Database not ready",
        });
      }

      const category = await categoryCollection.findOne({
        id,
        deletedAt: { $exists: false },
      });

      if (!category) {
        return res.status(404).json({
          error: "not_found",
          message: "Category not found",
        });
      }

      const active = !category.active;
      const updatedAt = new Date();
      await categoryCollection.updateOne(
        { id },
        { $set: { active, updatedAt } },
      );

      return res.status(200).json({
        category: serializeCategory({ ...category, active, updatedAt }),
      });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.delete("/categories/:id", async (req, res) => {
    try {
      await requireAdminUser(req);
      const collections = requireCollections(req);
      const id = readString(req.params.id);

      if (!collections) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Database not ready",
        });
      }

      const productCount = await countProducts(
        collections.productCollection,
        "categoryId",
        id,
      );

      if (productCount > 0) {
        return res.status(409).json({
          error: "category_in_use",
          message: `Category is used by ${productCount} products`,
        });
      }

      const childCount = await collections.categoryCollection.countDocuments({
        parentId: id,
        deletedAt: { $exists: false },
      });

      if (childCount > 0) {
        return res.status(409).json({
          error: "category_has_children",
          message: `Category has ${childCount} child categories`,
        });
      }

      const result = await collections.categoryCollection.updateOne(
        { id, deletedAt: { $exists: false } },
        {
          $set: {
            active: false,
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          error: "not_found",
          message: "Category not found",
        });
      }

      return res.status(200).json({ message: "Category deleted" });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.get("/brands", async (req, res) => {
    try {
      await requireAdminUser(req);
      const collections = requireCollections(req);

      if (!collections) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Database not ready",
        });
      }

      const page = readPositiveInteger(req.query.page, 1);
      const pageSize = Math.min(
        readPositiveInteger(req.query.pageSize, 25),
        maxPageSize,
      );
      const sortBy = allowedBrandSortFields.has(readString(req.query.sortBy))
        ? readString(req.query.sortBy)
        : "name";
      const sortDir = readString(req.query.sortDir) === "desc" ? -1 : 1;
      const filter = buildEntityFilter(req.query) as Filter<BrandDocument>;
      const sort: Sort = { [sortBy]: sortDir, name: 1 };
      const [brands, total] = await Promise.all([
        collections.brandCollection
          .find(filter)
          .sort(sort)
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .toArray(),
        collections.brandCollection.countDocuments(filter),
      ]);
      const counts = await countProductsByField(
        collections.productCollection,
        "brandId",
      );

      return res.status(200).json({
        brands: brands.map((brand) =>
          serializeBrand(brand, counts[brand.id] ?? 0),
        ),
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.get("/brands/:id", async (req, res) => {
    try {
      await requireAdminUser(req);
      const collections = requireCollections(req);
      const id = readString(req.params.id);

      if (!collections) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Database not ready",
        });
      }

      const brand = await collections.brandCollection.findOne({
        id,
        deletedAt: { $exists: false },
      });

      if (!brand) {
        return res.status(404).json({
          error: "not_found",
          message: "Brand not found",
        });
      }

      const productCount = await countProducts(
        collections.productCollection,
        "brandId",
        brand.id,
      );

      return res.status(200).json({ brand: serializeBrand(brand, productCount) });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.post("/brands", async (req, res) => {
    try {
      await requireAdminUser(req);
      const brandCollection = getBrandCollection(req);

      if (!brandCollection) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Database not ready",
        });
      }

      const validation = validateBrandInput(req.body);

      if (!validation.ok) {
        return sendValidationErrors(
          res,
          "Brand input is invalid",
          validation.errors,
        );
      }

      if (
        !(await ensureUniqueSlug(
          brandCollection,
          validation.value.slug,
          validation.value.id,
        ))
      ) {
        return sendValidationErrors(res, "Brand input is invalid", {
          slug: "Slug already exists",
        });
      }

      const now = new Date();
      const brand: BrandDocument = {
        ...validation.value,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await brandCollection.insertOne(brand);
      } catch (err) {
        if (isDuplicateKeyError(err)) {
          return res.status(409).json({
            error: "duplicate_brand",
            message: "Brand id or slug already exists",
          });
        }

        throw err;
      }

      return res.status(201).json({ brand: serializeBrand(brand) });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.put("/brands/:id", async (req, res) => {
    try {
      await requireAdminUser(req);
      const collections = requireCollections(req);
      const id = readString(req.params.id);

      if (!collections) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Database not ready",
        });
      }

      const existing = await collections.brandCollection.findOne({
        id,
        deletedAt: { $exists: false },
      });

      if (!existing) {
        return res.status(404).json({
          error: "not_found",
          message: "Brand not found",
        });
      }

      const validation = validateBrandInput(req.body, id);

      if (!validation.ok) {
        return sendValidationErrors(
          res,
          "Brand input is invalid",
          validation.errors,
        );
      }

      if (
        !(await ensureUniqueSlug(
          collections.brandCollection,
          validation.value.slug,
          id,
        ))
      ) {
        return sendValidationErrors(res, "Brand input is invalid", {
          slug: "Slug already exists",
        });
      }

      const brand: BrandDocument = {
        ...validation.value,
        createdAt: existing.createdAt,
        updatedAt: new Date(),
      };

      await collections.brandCollection.updateOne({ id }, { $set: brand });
      await collections.productCollection.updateMany(
        { brandId: id, deletedAt: { $exists: false } },
        { $set: { brand: brand.name, updatedAt: new Date() } },
      );

      return res.status(200).json({ brand: serializeBrand(brand) });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.patch("/brands/:id/toggle-active", async (req, res) => {
    try {
      await requireAdminUser(req);
      const brandCollection = getBrandCollection(req);
      const id = readString(req.params.id);

      if (!brandCollection) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Database not ready",
        });
      }

      const brand = await brandCollection.findOne({
        id,
        deletedAt: { $exists: false },
      });

      if (!brand) {
        return res.status(404).json({
          error: "not_found",
          message: "Brand not found",
        });
      }

      const active = !brand.active;
      const updatedAt = new Date();
      await brandCollection.updateOne(
        { id },
        { $set: { active, updatedAt } },
      );

      return res.status(200).json({
        brand: serializeBrand({ ...brand, active, updatedAt }),
      });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.delete("/brands/:id", async (req, res) => {
    try {
      await requireAdminUser(req);
      const collections = requireCollections(req);
      const id = readString(req.params.id);

      if (!collections) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Database not ready",
        });
      }

      const productCount = await countProducts(
        collections.productCollection,
        "brandId",
        id,
      );

      if (productCount > 0) {
        return res.status(409).json({
          error: "brand_in_use",
          message: `Brand is used by ${productCount} products`,
        });
      }

      const result = await collections.brandCollection.updateOne(
        { id, deletedAt: { $exists: false } },
        {
          $set: {
            active: false,
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          error: "not_found",
          message: "Brand not found",
        });
      }

      return res.status(200).json({ message: "Brand deleted" });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });
}
