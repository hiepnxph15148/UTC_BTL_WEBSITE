export type CartItem = {
  id: string;
  shoeId: string;
  /** SKU UUID khi đồng bộ với backend. */
  skuId?: string;
  name: string;
  nameAccent: string;
  price: string;
  priceValue: number;
  color: string;
  size: number;
  hero: string;
  accent: string;
  qty: number;
};

/** Chỉ dùng cho khách chưa đăng nhập. Giỏ account nằm trên API. */
export const GUEST_CART_STORAGE_KEY = "nike-utc-cart-guest-v1";

/** Key cũ — migrate một lần rồi xóa. */
const LEGACY_CART_STORAGE_KEY = "nike-utc-cart-v1";

export function readGuestCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      window.localStorage.getItem(GUEST_CART_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];

    // Migrate legacy → guest key
    if (
      window.localStorage.getItem(LEGACY_CART_STORAGE_KEY) &&
      !window.localStorage.getItem(GUEST_CART_STORAGE_KEY)
    ) {
      writeGuestCart(parsed);
      window.localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
    }

    return parsed;
  } catch {
    return [];
  }
}

export function writeGuestCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
  window.localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
}

export function clearGuestCart() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
}

/** @deprecated dùng readGuestCart */
export function readCartFromStorage() {
  return readGuestCart();
}

/** @deprecated dùng writeGuestCart */
export function writeCartToStorage(items: CartItem[]) {
  writeGuestCart(items);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.priceValue * item.qty, 0);
}
