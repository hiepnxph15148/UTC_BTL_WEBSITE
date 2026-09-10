export type CartItem = {
  id: string;
  shoeId: string;
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

export const CART_STORAGE_KEY = "nike-utc-cart-v1";

export function readCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCartToStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.priceValue * item.qty, 0);
}
