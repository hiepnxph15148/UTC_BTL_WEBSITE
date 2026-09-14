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

export enum ReturnKind {
  Refund = 0,
  Exchange = 1,
}

export enum ReturnState {
  Requested = 0,
  Approved = 1,
  Rejected = 2,
  Received = 3,
  Completed = 4,
}

export enum DiscountKind {
  Fixed = 0,
  Percentage = 1,
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

export type LookupInput = {
  kind: LookupKind;
  name: string;
  active: boolean;
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

export type SkuInput = {
  colorId: string;
  sizeId: string;
  code: string;
  price: number;
  active: boolean;
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

export type HistoryDto = {
  at: string;
  actorId: string | null;
  action: string | null;
  note: string | null;
};

export type OrderDetailDto = {
  order: OrderDto;
  items: OrderLineDto[] | null;
  history: HistoryDto[] | null;
};

export type NoteInput = {
  note: string;
};

export type ShipmentInput = {
  carrier: string;
  trackingCode: string;
};

export type InventoryDto = {
  skuId: string;
  code: string | null;
  onHand: number;
  reserved: number;
  available: number;
};

export type StockInput = {
  skuId: string;
  delta: number;
  reason: string;
};

export type MovementDto = {
  id: string;
  skuId: string;
  delta: number;
  balance: number;
  reason: string | null;
  orderId: string | null;
  at: string;
};

export type ReturnDto = {
  id: string;
  orderId: string;
  orderLineId: string;
  kind: ReturnKind;
  state: ReturnState;
  quantity: number;
  reason: string | null;
  replacementSkuId: string | null;
  refundAmount: number;
  restock: boolean;
};

export type ReturnInput = {
  orderLineId: string;
  quantity: number;
  kind: ReturnKind;
  replacementSkuId?: string | null;
  reason: string;
};

export type ReturnActionInput = {
  note: string;
  state: ReturnState;
  restock: boolean;
};

export type NotificationDto = {
  id: string;
  orderId: string | null;
  message: string | null;
  isRead: boolean;
  at: string;
};

export type ProfileDto = {
  extraProperties?: Record<string, unknown> | null;
  userName: string | null;
  email: string | null;
  name: string | null;
  surname: string | null;
  phoneNumber: string | null;
  isExternal: boolean;
  hasPassword: boolean;
  concurrencyStamp: string | null;
};

export type UpdateProfileDto = {
  extraProperties?: Record<string, unknown> | null;
  userName?: string | null;
  email?: string | null;
  name?: string | null;
  surname?: string | null;
  phoneNumber?: string | null;
  concurrencyStamp?: string | null;
};

export type ChangePasswordInput = {
  currentPassword?: string | null;
  newPassword: string;
};

export type SendPasswordResetCodeDto = {
  email: string;
  appName: string;
  returnUrl?: string | null;
  returnUrlHash?: string | null;
};

export type VerifyPasswordResetTokenInput = {
  userId: string;
  resetToken: string;
};

export type ResetPasswordDto = {
  userId: string;
  resetToken: string;
  password: string;
};

export type DiscountDto = {
  id: string;
  code: string | null;
  name: string | null;
  productId: string | null;
  kind: DiscountKind;
  value: number;
  maxDiscount: number;
  minimumSubtotal: number;
  startsAt: string;
  endsAt: string;
  usageLimit: number;
  perCustomerLimit: number;
  active: boolean;
};

export type DiscountInput = {
  code?: string | null;
  name: string;
  productId?: string | null;
  kind: DiscountKind;
  value: number;
  maxDiscount: number;
  minimumSubtotal: number;
  startsAt: string;
  endsAt: string;
  usageLimit: number;
  perCustomerLimit: number;
  active: boolean;
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
