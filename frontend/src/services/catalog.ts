import { axiosClient } from "../lib/axiosClient";
import type { Language } from "../i18n";

export type CatalogProductSpecification = {
  key: string;
  value: string;
};

export type CatalogProductFitment = {
  year: string;
  make: string;
  model: string;
  submodel: string;
  notes: string;
};

export type VehicleSelection = Omit<CatalogProductFitment, "notes">;

export type CatalogBrand = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  logo: string;
  productCount: number;
};

export type CatalogCategory = {
  id: string;
  name: string;
  nameMe?: string;
  nameEn?: string;
  slug: string;
  parentId: string | null;
  active: boolean;
  sortOrder: number;
  image: string;
  productCount: number;
};

export type CatalogProduct = {
  id: string;
  name: string;
  nameMe?: string;
  nameEn?: string;
  sku: string;
  mpn: string;
  brand: string;
  brandId: string;
  brandSlug?: string;
  brandData?: CatalogBrand;
  category: string;
  categoryId: string;
  categorySlug?: string;
  categoryData?: CatalogCategory;
  pricePi: number;
  stock: number;
  description: string;
  descriptionMe?: string;
  descriptionEn?: string;
  images: string[];
  specifications: CatalogProductSpecification[];
  fitments: CatalogProductFitment[];
  shippingInfo?: string;
  warranty?: string;
  returnPolicy?: string;
};

export type FetchProductsParams = {
  q?: string;
  brandId?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
  sort?: "name" | "pricePi" | "stock";
  sortDir?: "asc" | "desc";
};

export type ProductsResponse = {
  products: CatalogProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  categoryFilterMode: "direct";
  categories: CatalogCategory[];
  brands: CatalogBrand[];
};

export type ProductResponse = {
  product: CatalogProduct;
};

export const fetchProducts = async (params: FetchProductsParams = {}) => {
  const response = await axiosClient.get<ProductsResponse>("/products", {
    params,
  });

  return response.data;
};

export const fetchProductById = async (productId: string) => {
  const response = await axiosClient.get<ProductResponse>(
    `/products/${encodeURIComponent(productId)}`,
  );

  return response.data.product;
};

export const getLocalizedProductName = (
  product: CatalogProduct,
  language: Language,
) =>
  language === "en"
    ? product.nameEn || product.name || ""
    : product.nameMe || product.name || "";

export const getLocalizedProductDescription = (
  product: CatalogProduct,
  language: Language,
) =>
  language === "en"
    ? product.descriptionEn || product.description || ""
    : product.descriptionMe || product.description || "";

export const getLocalizedProductImages = (product: CatalogProduct) =>
  product.images;

export const getLocalizedCategoryName = (
  category: CatalogCategory | undefined,
  language: Language,
) => {
  if (!category) {
    return "";
  }

  return language === "en"
    ? category.nameEn || category.name || category.nameMe || ""
    : category.nameMe || category.name || category.nameEn || "";
};

export const getLocalizedProductCategory = (
  product: CatalogProduct,
  language: Language,
) =>
  getLocalizedCategoryName(product.categoryData, language) ||
  product.category ||
  "";
