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
  category: string;
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

export type AdminProductsResponse = {
  products: AdminProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  categories: string[];
  brands: string[];
};

export type AdminProductResponse = {
  product: AdminProduct;
};
