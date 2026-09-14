import { apiFetch } from "./client";
import type {
  AddressDto,
  AddressInput,
  CartLineDto,
  CheckoutInput,
  DiscountDto,
  DiscountInput,
  InventoryDto,
  LookupDto,
  LookupInput,
  LookupKind,
  MovementDto,
  NoteInput,
  NotificationDto,
  OrderDetailDto,
  OrderDto,
  OrderState,
  PageQuery,
  PlaceOrderInput,
  ProductDto,
  ProductInput,
  QuoteDto,
  ReportDto,
  ReturnActionInput,
  ReturnDto,
  ReturnInput,
  ShipmentInput,
  SkuDto,
  SkuInput,
  StockInput,
} from "./types";

function pageParams(query: PageQuery = {}) {
  return {
    Skip: query.skip ?? 0,
    Take: query.take ?? 50,
    Search: query.search,
  };
}

export const storeApi = {
  getLookups(kind?: LookupKind) {
    return apiFetch<LookupDto[]>("/api/app/store/lookups", {
      searchParams: { kind },
    });
  },

  createLookup(input: LookupInput) {
    return apiFetch<LookupDto>("/api/app/store/lookup", {
      method: "POST",
      auth: true,
      json: input,
    });
  },

  updateLookup(id: string, input: LookupInput) {
    return apiFetch<LookupDto>(`/api/app/store/${id}/lookup`, {
      method: "PUT",
      auth: true,
      json: input,
    });
  },

  getProducts(
    query: PageQuery & { categoryId?: string; brandId?: string } = {},
  ) {
    return apiFetch<ProductDto[]>("/api/app/store/products", {
      searchParams: {
        ...pageParams(query),
        categoryId: query.categoryId,
        brandId: query.brandId,
      },
    });
  },

  getProduct(id: string) {
    return apiFetch<ProductDto>(`/api/app/store/${id}/product`);
  },

  getSkus(productId: string) {
    return apiFetch<SkuDto[]>(`/api/app/store/skus/${productId}`);
  },

  getAdminSkus(productId: string) {
    return apiFetch<SkuDto[]>(`/api/app/store/admin-skus/${productId}`, {
      auth: true,
    });
  },

  createSku(productId: string, input: SkuInput) {
    return apiFetch<SkuDto>(`/api/app/store/sku/${productId}`, {
      method: "POST",
      auth: true,
      json: input,
    });
  },

  updateSku(id: string, input: SkuInput) {
    return apiFetch<SkuDto>(`/api/app/store/${id}/sku`, {
      method: "PUT",
      auth: true,
      json: input,
    });
  },

  uploadProductImage(productId: string, file: File) {
    const body = new FormData();
    body.append("file", file);
    return apiFetch<ProductDto>(`/api/products/${productId}/image/upload`, {
      method: "POST",
      auth: true,
      body,
    });
  },

  setProductImageUrl(productId: string, imageUrl: string) {
    return apiFetch<ProductDto>(`/api/products/${productId}/image`, {
      method: "PUT",
      auth: true,
      json: { imageUrl },
    });
  },

  deleteProductImage(productId: string) {
    return apiFetch<ProductDto>(`/api/products/${productId}/image`, {
      method: "DELETE",
      auth: true,
    });
  },

  getAdminProducts(query: PageQuery = {}) {
    return apiFetch<ProductDto[]>("/api/app/store/admin-products", {
      auth: true,
      searchParams: pageParams(query),
    });
  },

  createProduct(input: ProductInput) {
    return apiFetch<ProductDto>("/api/app/store/product", {
      method: "POST",
      auth: true,
      json: input,
    });
  },

  updateProduct(id: string, input: ProductInput) {
    return apiFetch<ProductDto>(`/api/app/store/${id}/product`, {
      method: "PUT",
      auth: true,
      json: input,
    });
  },

  getCart() {
    return apiFetch<CartLineDto[]>("/api/app/store/cart", { auth: true });
  },

  setCartItem(skuId: string, quantity: number) {
    return apiFetch<void>(`/api/app/store/set-cart-item/${skuId}`, {
      method: "POST",
      auth: true,
      json: { quantity },
    });
  },

  removeCartItem(skuId: string) {
    return apiFetch<void>(`/api/app/store/cart-item/${skuId}`, {
      method: "DELETE",
      auth: true,
    });
  },

  getAddresses() {
    return apiFetch<AddressDto[]>("/api/app/store/addresses", { auth: true });
  },

  createAddress(input: AddressInput) {
    return apiFetch<AddressDto>("/api/app/store/address", {
      method: "POST",
      auth: true,
      json: input,
    });
  },

  updateAddress(id: string, input: AddressInput) {
    return apiFetch<AddressDto>(`/api/app/store/${id}/address`, {
      method: "PUT",
      auth: true,
      json: input,
    });
  },

  deleteAddress(id: string) {
    return apiFetch<void>(`/api/app/store/${id}/address`, {
      method: "DELETE",
      auth: true,
    });
  },

  quote(input: CheckoutInput) {
    return apiFetch<QuoteDto>("/api/app/store/quote", {
      method: "POST",
      auth: true,
      json: input,
    });
  },

  placeOrder(input: PlaceOrderInput) {
    return apiFetch<OrderDetailDto>("/api/app/store/place-order", {
      method: "POST",
      auth: true,
      json: input,
    });
  },

  getMyOrders(query: PageQuery = {}) {
    return apiFetch<OrderDto[]>("/api/app/store/my-orders", {
      auth: true,
      searchParams: pageParams(query),
    });
  },

  getMyOrder(id: string) {
    return apiFetch<OrderDetailDto>(`/api/app/store/${id}/my-order`, {
      auth: true,
    });
  },

  cancelMyOrder(id: string, input: NoteInput) {
    return apiFetch<void>(`/api/app/store/${id}/cancel-my-order`, {
      method: "POST",
      auth: true,
      json: input,
    });
  },

  getAdminOrders(query: PageQuery & { state?: OrderState } = {}) {
    return apiFetch<OrderDto[]>("/api/app/store/admin-orders", {
      auth: true,
      searchParams: {
        ...pageParams(query),
        state: query.state,
      },
    });
  },

  getAdminOrder(id: string) {
    return apiFetch<OrderDetailDto>(`/api/app/store/${id}/admin-order`, {
      auth: true,
    });
  },

  confirmOrder(id: string) {
    return apiFetch<void>(`/api/app/store/${id}/confirm-order`, {
      method: "POST",
      auth: true,
    });
  },

  cancelOrder(id: string, input: NoteInput) {
    return apiFetch<void>(`/api/app/store/${id}/cancel-order`, {
      method: "POST",
      auth: true,
      json: input,
    });
  },

  expireReservations() {
    return apiFetch<void>("/api/app/store/expire-reservations", {
      method: "POST",
      auth: true,
    });
  },

  addOrderNote(id: string, input: NoteInput) {
    return apiFetch<void>(`/api/app/store/${id}/order-note`, {
      method: "POST",
      auth: true,
      json: input,
    });
  },

  shipOrder(id: string, input: ShipmentInput) {
    return apiFetch<void>(`/api/app/store/${id}/ship-order`, {
      method: "POST",
      auth: true,
      json: input,
    });
  },

  deliverOrder(id: string) {
    return apiFetch<void>(`/api/app/store/${id}/deliver-order`, {
      method: "POST",
      auth: true,
    });
  },

  receiveFailedDelivery(id: string, input: NoteInput) {
    return apiFetch<void>(`/api/app/store/${id}/receive-failed-delivery`, {
      method: "POST",
      auth: true,
      json: input,
    });
  },

  collectCod(id: string, input: NoteInput) {
    return apiFetch<void>(`/api/app/store/${id}/collect-cod`, {
      method: "POST",
      auth: true,
      json: input,
    });
  },

  getInventory(query: PageQuery = {}) {
    return apiFetch<InventoryDto[]>("/api/app/store/inventory", {
      auth: true,
      searchParams: pageParams(query),
    });
  },

  adjustStock(input: StockInput) {
    return apiFetch<InventoryDto>("/api/app/store/adjust-stock", {
      method: "POST",
      auth: true,
      json: input,
    });
  },

  getStockMovements(skuId: string, query: PageQuery = {}) {
    return apiFetch<MovementDto[]>(`/api/app/store/stock-movements/${skuId}`, {
      auth: true,
      searchParams: pageParams(query),
    });
  },

  getAdminReturns(query: PageQuery = {}) {
    return apiFetch<ReturnDto[]>("/api/app/store/admin-returns", {
      auth: true,
      searchParams: pageParams(query),
    });
  },

  getMyReturns(query: PageQuery = {}) {
    return apiFetch<ReturnDto[]>("/api/app/store/my-returns", {
      auth: true,
      searchParams: pageParams(query),
    });
  },

  requestReturn(orderId: string, input: ReturnInput) {
    return apiFetch<ReturnDto>(`/api/app/store/request-return/${orderId}`, {
      method: "POST",
      auth: true,
      json: input,
    });
  },

  processReturn(id: string, input: ReturnActionInput) {
    return apiFetch<ReturnDto>(`/api/app/store/${id}/process-return`, {
      method: "POST",
      auth: true,
      json: input,
    });
  },

  getNotifications(query: PageQuery = {}) {
    return apiFetch<NotificationDto[]>("/api/app/store/notifications", {
      auth: true,
      searchParams: pageParams(query),
    });
  },

  markNotificationRead(id: string) {
    return apiFetch<void>(`/api/app/store/${id}/mark-notification-read`, {
      method: "POST",
      auth: true,
    });
  },

  getDiscounts(query: PageQuery = {}) {
    return apiFetch<DiscountDto[]>("/api/app/store/discounts", {
      auth: true,
      searchParams: pageParams(query),
    });
  },

  createDiscount(input: DiscountInput) {
    return apiFetch<DiscountDto>("/api/app/store/discount", {
      method: "POST",
      auth: true,
      json: input,
    });
  },

  updateDiscount(id: string, input: DiscountInput) {
    return apiFetch<DiscountDto>(`/api/app/store/${id}/discount`, {
      method: "PUT",
      auth: true,
      json: input,
    });
  },

  disableDiscount(id: string) {
    return apiFetch<void>(`/api/app/store/${id}/disable-discount`, {
      method: "POST",
      auth: true,
    });
  },

  getReport(from: string, to: string) {
    return apiFetch<ReportDto>("/api/app/store/report", {
      auth: true,
      searchParams: { from, to },
    });
  },
};
