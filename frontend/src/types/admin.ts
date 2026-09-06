export type AdminUser = {
  uid: string;
  username?: string;
};

export type AdminProductSpecification = {
  key: string;
  value: string;
};

export type AdminProductFitment = {
  year: string;
  make: string;
  model: string;
  submodel: string;
  notes: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  sku: string;
  mpn: string;
  brand: string;
  brandId: string;
  brandActive?: boolean;
  category: string;
  categoryId: string;
  categoryActive?: boolean;
  pricePi: number;
  stock: number;
  active: boolean;
  description: string;
  images: string[];
  specifications: AdminProductSpecification[];
  fitments: AdminProductFitment[];
  createdAt: string;
  updatedAt: string;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parentName?: string;
  active: boolean;
  sortOrder: number;
  description: string;
  image: string;
  productCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminBrand = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  description: string;
  logo: string;
  productCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminProductsResponse = {
  products: AdminProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  categories: AdminCategory[];
  brands: AdminBrand[];
};

export type AdminProductResponse = {
  product: AdminProduct;
};

export type AdminCategoriesResponse = {
  categories: AdminCategory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AdminCategoryResponse = {
  category: AdminCategory;
};

export type AdminBrandsResponse = {
  brands: AdminBrand[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AdminBrandResponse = {
  brand: AdminBrand;
};
