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
  created_at?: string;
  updated_at?: string;
};

export type UserProfile = {
  pi_uid: string;
  username?: string;
  addresses: UserShippingAddress[];
  defaultShippingAddressId?: string;
  shippingAddress: ShippingAddress | null;
  created_at?: string;
  updated_at?: string;
};

export type OrderSummary = {
  orderNumber: string;
  created_at?: string;
  status: string;
  itemCount: number;
  total: number;
  canViewDetail?: boolean;
};

export type OrderDetailItem = {
  productId?: string;
  name?: string;
  brand?: string;
  sku?: string;
  mpn?: string;
  image?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
};

export type OrderDetail = {
  orderNumber: string;
  created_at?: string;
  completed_at?: string;
  status: string;
  items: OrderDetailItem[];
  subtotal: number;
  total: number;
  shippingAddress: ShippingAddress | null;
  paid: boolean;
  cancelled: boolean;
  txid?: string | null;
};
