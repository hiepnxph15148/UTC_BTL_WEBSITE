/** DTOs từ ShoeStore OpenAPI (camelCase). */

export enum LookupKind {
  Category = 0,
  Brand = 1,
  Color = 2,
  Size = 3,
}

export enum OrderState {
  Pending = 0,
  Confirmed = 1,
  Shipped = 2,
  Delivered = 3,
  Cancelled = 4,
}

export enum CodState {
  Unpaid = 0,
  Collected = 1,
  PartiallyRefunded = 2,
  Refunded = 3,
}

export type LookupDto = {
  id: string;
  kind: LookupKind;
  name: string | null;
  active: boolean;
};

export type ProductDto = {
  id: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  imageUrl: string | null;
  categoryId: string;
  brandId: string;
  published: boolean;
};

export type ProductInput = {
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  categoryId: string;
  brandId: string;
  published: boolean;
};

export type SkuDto = {
  id: string;
  productId: string;
  colorId: string;
  sizeId: string;
  code: string | null;
  price: number;
  active: boolean;
  available: number;
};

export type CartLineDto = {
  skuId: string;
  code: string | null;
  quantity: number;
  unitPrice: number;
  available: number;
};

export type AddressDto = {
  id: string;
  recipient: string | null;
  phone: string | null;
  fullAddress: string | null;
  isDefault: boolean;
};

export type AddressInput = {
  recipient: string;
  phone: string;
  fullAddress: string;
  isDefault?: boolean;
};

export type CheckoutInput = {
  addressId: string;
  coupon?: string | null;
};

export type PlaceOrderInput = {
  addressId: string;
  coupon?: string | null;
  idempotencyKey: string;
  expectedTotal: number;
};

export type QuoteLineDto = {
  skuId: string;
  code: string | null;
  productName: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
};

export type QuoteDto = {
  items: QuoteLineDto[] | null;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  discountId: string | null;
  currency: string | null;
};

export type OrderDto = {
  id: string;
  number: string | null;
  state: OrderState;
  paymentState: CodState;
  addressSnapshot: string | null;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  refunded: number;
  reservationExpiresAt: string;
  carrier: string | null;
  trackingCode: string | null;
};

export type OrderLineDto = {
  id: string;
  skuId: string;
  productName: string | null;
  skuCode: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
};

export type OrderDetailDto = {
  order: OrderDto;
  items: OrderLineDto[] | null;
  history: { at: string; actorId: string | null; action: string | null; note: string | null }[] | null;
};

export type ReportDto = {
  from: string;
  to: string;
  orders: number;
  cancelled: number;
  deliveredSales: number;
  codCollected: number;
  refunded: number;
  netCollected: number;
  openReturns: number;
  lowStockSkus: number;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
};

export type AbpErrorBody = {
  error?: {
    code?: string | null;
    message?: string | null;
    details?: string | null;
    validationErrors?: { message?: string | null; members?: string[] | null }[] | null;
  } | null;
};

export type PageQuery = {
  skip?: number;
  take?: number;
  search?: string;
};
