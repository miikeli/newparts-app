import { Router } from "express";
import { type Collection, type Filter, type Sort } from "mongodb";
import { type ProductDocument } from "../services/products";
import { type BrandDocument, type CategoryDocument } from "../services/taxonomy";

const defaultPageSize = 24;
const maxPageSize = 100;
const allowedSortFields = new Set(["name", "pricePi", "stock"]);

const readString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const readPositiveInteger = (value: unknown, fallback: number) => {
  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

const serializePublicCategory = (
  category: CategoryDocument,
  productCount = 0,
) => ({
  id: category.id,
  name: category.name,
  nameMe: category.nameMe ?? category.name,
  nameEn: category.nameEn ?? category.name,
  slug: category.slug,
  parentId: category.parentId ?? null,
  active: category.active,
  sortOrder: category.sortOrder,
  image: category.image ?? "",
  productCount,
});

const serializePublicBrand = (brand: BrandDocument, productCount = 0) => ({
  id: brand.id,
  name: brand.name,
  slug: brand.slug,
  active: brand.active,
  logo: brand.logo ?? "",
  productCount,
});

const serializePublicProduct = (
  product: ProductDocument,
  refs?: {
    brand?: BrandDocument;
    category?: CategoryDocument;
  },
) => {
  const brand = refs?.brand;
  const category = refs?.category;

  return {
    id: product.id,
    name: product.name,
    nameMe: product.nameMe ?? product.name,
    nameEn: product.nameEn ?? product.name,
    sku: product.sku,
    mpn: product.mpn,
    brand: brand?.name ?? product.brand,
    brandId: product.brandId,
    brandSlug: brand?.slug ?? "",
    brandData: brand ? serializePublicBrand(brand) : undefined,
    category: category?.name ?? product.category,
    categoryId: product.categoryId,
    categorySlug: category?.slug ?? "",
    categoryData: category ? serializePublicCategory(category) : undefined,
    pricePi: product.pricePi,
    stock: product.stock,
    description: product.description,
    descriptionMe: product.descriptionMe ?? product.description,
    descriptionEn: product.descriptionEn ?? product.description,
    images: product.images,
    specifications: product.specifications,
    fitments: product.fitments,
    shippingInfo: "shippingInfo" in product
      ? (product as ProductDocument & { shippingInfo?: string }).shippingInfo ?? ""
      : "",
    warranty: "warranty" in product
      ? (product as ProductDocument & { warranty?: string }).warranty ?? ""
      : "",
    returnPolicy: "returnPolicy" in product
      ? (product as ProductDocument & { returnPolicy?: string }).returnPolicy ?? ""
      : "",
  };
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
  const brandsBySlug: { [slug: string]: BrandDocument } = {};
  const categoriesById: { [id: string]: CategoryDocument } = {};
  const categoriesBySlug: { [slug: string]: CategoryDocument } = {};

  brands.forEach((brand) => {
    brandsById[brand.id] = brand;
    brandsBySlug[brand.slug] = brand;
  });

  categories.forEach((category) => {
    categoriesById[category.id] = category;
    categoriesBySlug[category.slug] = category;
  });

  return { brands, categories, brandsById, brandsBySlug, categoriesById, categoriesBySlug };
};

const countActiveProductsByField = async (
  productCollection: Collection<ProductDocument>,
  field: "brandId" | "categoryId",
) => {
  const rows = await productCollection
    .aggregate<{ _id: string; count: number }>([
      {
        $match: {
          active: true,
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

const buildProductFilter = (
  query: { [key: string]: unknown },
  relations: Awaited<ReturnType<typeof loadRelationMaps>>,
) => {
  const filter: Filter<ProductDocument> = {
    active: true,
    deletedAt: { $exists: false },
  };
  const search = readString(query.q) || readString(query.search);
  const brandParam = readString(query.brandId) || readString(query.brand);
  const categoryParam =
    readString(query.categoryId) || readString(query.category);

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { sku: pattern },
      { mpn: pattern },
      { name: pattern },
      { nameMe: pattern },
      { nameEn: pattern },
      { description: pattern },
      { descriptionMe: pattern },
      { descriptionEn: pattern },
      { brand: pattern },
      { category: pattern },
    ];
  }

  if (brandParam) {
    filter.brandId = relations.brandsById[brandParam]
      ? brandParam
      : relations.brandsBySlug[brandParam]?.id ?? brandParam;
  }

  if (categoryParam) {
    filter.categoryId = relations.categoriesById[categoryParam]
      ? categoryParam
      : relations.categoriesBySlug[categoryParam]?.id ?? categoryParam;
  }

  return filter;
};

const buildSort = (query: { [key: string]: unknown }): Sort => {
  const requestedSort = readString(query.sort);
  const sortBy = allowedSortFields.has(requestedSort) ? requestedSort : "name";
  const sortDir = readString(query.sortDir) === "desc" ? -1 : 1;

  return { [sortBy]: sortDir, id: 1 };
};

export default function mountProductEndpoints(router: Router) {
  router.get("/", async (req, res) => {
    try {
      const collections = requireCollections(req);

      if (!collections) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Database not ready",
        });
      }

      const page = readPositiveInteger(req.query.page, 1);
      const pageSize = Math.min(
        readPositiveInteger(req.query.limit ?? req.query.pageSize, defaultPageSize),
        maxPageSize,
      );
      const relations = await loadRelationMaps(
        collections.brandCollection,
        collections.categoryCollection,
      );
      const filter = buildProductFilter(req.query, relations);
      const [products, total, productCountsByBrand, productCountsByCategory] =
        await Promise.all([
          collections.productCollection
            .find(filter)
            .sort(buildSort(req.query))
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .toArray(),
          collections.productCollection.countDocuments(filter),
          countActiveProductsByField(collections.productCollection, "brandId"),
          countActiveProductsByField(collections.productCollection, "categoryId"),
        ]);

      return res.status(200).json({
        products: products.map((product) =>
          serializePublicProduct(product, {
            brand: relations.brandsById[product.brandId],
            category: relations.categoriesById[product.categoryId],
          }),
        ),
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        categoryFilterMode: "direct",
        categories: relations.categories
          .filter((category) => category.active)
          .map((category) =>
            serializePublicCategory(
              category,
              productCountsByCategory[category.id] ?? 0,
            ),
          )
          .sort(
            (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
          ),
        brands: relations.brands
          .filter((brand) => brand.active)
          .map((brand) =>
            serializePublicBrand(brand, productCountsByBrand[brand.id] ?? 0),
          )
          .sort((a, b) => a.name.localeCompare(b.name)),
      });
    } catch (err) {
      console.error(
        "Public products request failed",
        err instanceof Error ? err.message : "Unknown error",
      );
      return res.status(500).json({
        error: "internal_error",
        message: "Products request failed",
      });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
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
        active: true,
        deletedAt: { $exists: false },
      });

      if (!product) {
        return res.status(404).json({
          error: "not_found",
          message: "Product not found",
        });
      }

      const [brand, category] = await Promise.all([
        product.brandId
          ? collections.brandCollection.findOne({
              id: product.brandId,
              deletedAt: { $exists: false },
            })
          : null,
        product.categoryId
          ? collections.categoryCollection.findOne({
              id: product.categoryId,
              deletedAt: { $exists: false },
            })
          : null,
      ]);

      return res.status(200).json({
        product: serializePublicProduct(product, {
          brand: brand ?? undefined,
          category: category ?? undefined,
        }),
      });
    } catch (err) {
      console.error(
        "Public product detail request failed",
        err instanceof Error ? err.message : "Unknown error",
      );
      return res.status(500).json({
        error: "internal_error",
        message: "Product request failed",
      });
    }
  });
}
