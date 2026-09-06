import { Router } from "express";
import { type Collection, type Filter, type Sort } from "mongodb";
import { requireAdminUser, isAdminAuthError } from "../services/adminAuth";
import {
  serializeProduct,
  validateProductInput,
  type ProductDocument,
} from "../services/products";

const allowedSortFields = new Set(["name", "pricePi", "stock"]);
const maxPageSize = 50;

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

  console.error("Admin request failed", err instanceof Error ? err.message : "Unknown error");
  return res.status(500).json({
    error: "internal_error",
    message: "Admin request failed",
  });
};

const buildProductFilter = (query: {
  search?: unknown;
  category?: unknown;
  brand?: unknown;
  stockStatus?: unknown;
  status?: unknown;
}) => {
  const filter: Filter<ProductDocument> = { deletedAt: { $exists: false } };
  const search = readString(query.search);
  const category = readString(query.category);
  const brand = readString(query.brand);
  const stockStatus = readString(query.stockStatus);
  const status = readString(query.status);

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { sku: pattern },
      { name: pattern },
      { brand: pattern },
      { mpn: pattern },
    ];
  }

  if (category) {
    filter.category = category;
  }

  if (brand) {
    filter.brand = brand;
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
      const productCollection = getProductCollection(req);

      if (!productCollection) {
        return res.status(503).json({ error: "service_unavailable", message: "Database not ready" });
      }

      const page = readPositiveInteger(req.query.page, 1);
      const pageSize = Math.min(
        readPositiveInteger(req.query.pageSize, 10),
        maxPageSize,
      );
      const sortBy = allowedSortFields.has(readString(req.query.sortBy))
        ? readString(req.query.sortBy)
        : "name";
      const sortDir = readString(req.query.sortDir) === "desc" ? -1 : 1;
      const filter = buildProductFilter(req.query);
      const sort: Sort = { [sortBy]: sortDir, id: 1 };
      const [products, total, categories, brands] = await Promise.all([
        productCollection
          .find(filter)
          .sort(sort)
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .toArray(),
        productCollection.countDocuments(filter),
        productCollection.distinct("category", { deletedAt: { $exists: false } }),
        productCollection.distinct("brand", { deletedAt: { $exists: false } }),
      ]);

      return res.status(200).json({
        products: products.map(serializeProduct),
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        categories: categories.filter(Boolean).sort(),
        brands: brands.filter(Boolean).sort(),
      });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.get("/products/:id", async (req, res) => {
    try {
      await requireAdminUser(req);
      const productCollection = getProductCollection(req);
      const id = readString(req.params.id);

      if (!productCollection) {
        return res.status(503).json({ error: "service_unavailable", message: "Database not ready" });
      }

      const product = await productCollection.findOne({
        id,
        deletedAt: { $exists: false },
      });

      if (!product) {
        return res.status(404).json({ error: "not_found", message: "Product not found" });
      }

      return res.status(200).json({ product: serializeProduct(product) });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.post("/products", async (req, res) => {
    try {
      await requireAdminUser(req);
      const productCollection = getProductCollection(req);
      const validation = validateProductInput(req.body);

      if (!productCollection) {
        return res.status(503).json({ error: "service_unavailable", message: "Database not ready" });
      }

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
        await productCollection.insertOne(product);
      } catch (err) {
        if (isDuplicateKeyError(err)) {
          return res.status(409).json({
            error: "duplicate_product",
            message: "Product id or SKU already exists",
          });
        }

        throw err;
      }

      return res.status(201).json({ product: serializeProduct(product) });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });

  router.put("/products/:id", async (req, res) => {
    try {
      await requireAdminUser(req);
      const productCollection = getProductCollection(req);
      const id = readString(req.params.id);

      if (!productCollection) {
        return res.status(503).json({ error: "service_unavailable", message: "Database not ready" });
      }

      const existingProduct = await productCollection.findOne({
        id,
        deletedAt: { $exists: false },
      });

      if (!existingProduct) {
        return res.status(404).json({ error: "not_found", message: "Product not found" });
      }

      const validation = validateProductInput(req.body, id);

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
        await productCollection.updateOne({ id }, { $set: product });
      } catch (err) {
        if (isDuplicateKeyError(err)) {
          return res.status(409).json({
            error: "duplicate_product",
            message: "SKU already exists",
          });
        }

        throw err;
      }

      return res.status(200).json({ product: serializeProduct(product) });
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
        return res.status(503).json({ error: "service_unavailable", message: "Database not ready" });
      }

      const product = await productCollection.findOne({
        id,
        deletedAt: { $exists: false },
      });

      if (!product) {
        return res.status(404).json({ error: "not_found", message: "Product not found" });
      }

      const active = !product.active;
      await productCollection.updateOne(
        { id },
        { $set: { active, updatedAt: new Date() } },
      );

      return res.status(200).json({
        product: serializeProduct({ ...product, active, updatedAt: new Date() }),
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
        return res.status(503).json({ error: "service_unavailable", message: "Database not ready" });
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
        return res.status(404).json({ error: "not_found", message: "Product not found" });
      }

      return res.status(200).json({ message: "Product deleted" });
    } catch (err) {
      return sendAdminError(res, err);
    }
  });
}
