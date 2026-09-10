"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  cartCount,
  cartTotal,
  readCartFromStorage,
  writeCartToStorage,
  type CartItem,
} from "@/lib/cart";
import { parsePrice, type ShoeProduct } from "@/data/shoes";

type AddPayload = {
  shoe: ShoeProduct;
  color: string;
  size: number;
  qty?: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  hydrated: boolean;
  addItem: (payload: AddPayload) => void;
  updateQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function makeCartId(shoeId: string, color: string, size: number) {
  return `${shoeId}__${color}__${size}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readCartFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeCartToStorage(items);
  }, [items, hydrated]);

  const addItem = useCallback(({ shoe, color, size, qty = 1 }: AddPayload) => {
    const id = makeCartId(shoe.id, color, size);
    setItems((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) =>
          item.id === id ? { ...item, qty: item.qty + qty } : item,
        );
      }
      return [
        ...prev,
        {
          id,
          shoeId: shoe.id,
          name: shoe.name,
          nameAccent: shoe.nameAccent,
          price: shoe.price,
          priceValue: parsePrice(shoe.price),
          color,
          size,
          hero: shoe.hero,
          accent: shoe.accent,
          qty,
        },
      ];
    });
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty } : item))
        .filter((item) => item.qty > 0),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      count: cartCount(items),
      total: cartTotal(items),
      hydrated,
      addItem,
      updateQty,
      removeItem,
      clearCart,
    }),
    [items, hydrated, addItem, updateQty, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
