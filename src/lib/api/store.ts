import { apiFetch } from "./client";
import type {
  AddressDto,
  AddressInput,
  CartLineDto,
  CheckoutInput,
  LookupDto,
  LookupKind,
  OrderDetailDto,
  OrderDto,
  OrderState,
  PageQuery,
  PlaceOrderInput,
  ProductDto,
  ProductInput,
  QuoteDto,
  ReportDto,
  SkuDto,
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

  getAdminOrders(query: PageQuery & { state?: OrderState } = {}) {
    return apiFetch<OrderDto[]>("/api/app/store/admin-orders", {
      auth: true,
      searchParams: {
        ...pageParams(query),
        state: query.state,
      },
    });
  },

  getReport(from: string, to: string) {
    return apiFetch<ReportDto>("/api/app/store/report", {
      auth: true,
      searchParams: { from, to },
    });
  },
};
