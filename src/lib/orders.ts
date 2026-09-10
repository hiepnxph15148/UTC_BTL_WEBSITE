export type StoredOrder = {
  id: string;
  product: string;
  date: string;
  payment: string;
  customer: string;
  status: "Processing" | "Delivered" | "Shipped" | "Canceled";
  amount: number;
  items?: {
    name: string;
    qty: number;
    size: number;
    price: number;
  }[];
};

export const ORDERS_STORAGE_KEY = "nike-utc-orders-v1";

export function readOrdersFromStorage(): StoredOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeOrdersToStorage(orders: StoredOrder[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

export function appendOrder(order: StoredOrder) {
  const next = [order, ...readOrdersFromStorage()];
  writeOrdersToStorage(next);
  return next;
}
