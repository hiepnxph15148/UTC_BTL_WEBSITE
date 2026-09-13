"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  cartCount,
  cartTotal,
  clearGuestCart,
  readGuestCart,
  writeGuestCart,
  type CartItem,
} from "@/lib/cart";
import { getShoePriceValue, type ShoeProduct } from "@/data/shoes";
import { findSku, formatVnd, storeApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type AddPayload = {
  shoe: ShoeProduct;
  color: string;
  size: number;
  qty?: number;
  colorIndex?: number;
  sizeIndex?: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  hydrated: boolean;
  syncing: boolean;
  error: string | null;
  addItem: (payload: AddPayload) => Promise<string | null>;
  updateQty: (id: string, qty: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

function makeCartId(shoeId: string, color: string, size: number) {
  return `${shoeId}__${color}__${size}`;
}

function mapApiLines(
  lines: Awaited<ReturnType<typeof storeApi.getCart>>,
): CartItem[] {
  return lines.map((line) => ({
    id: line.skuId,
    shoeId: line.skuId,
    skuId: line.skuId,
    name: line.code || "SKU",
    nameAccent: "",
    price: formatVnd(line.unitPrice),
    priceValue: line.unitPrice,
    color: "#9e9e9e",
    size: 0,
    hero: encodeURI("/item/image 1.png"),
    accent: "#ed3b6b",
    qty: line.quantity,
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, hydrated: authHydrated, session } = useAuth();
  const userKey = session?.userName?.toLowerCase() || null;

  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** user đã merge guest → API trong phiên này (tránh merge lặp khi effect re-run). */
  const mergedForUserRef = useRef<string | null>(null);
  const lastUserRef = useRef<string | null>(null);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) return;
    setSyncing(true);
    setError(null);
    try {
      const lines = await storeApi.getCart();
      setItems(mapApiLines(lines));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được giỏ hàng");
    } finally {
      setSyncing(false);
    }
  }, [isAuthenticated]);

  /** Đẩy giỏ guest (có skuId) lên giỏ account trên API, rồi xóa guest. */
  const mergeGuestIntoApiCart = useCallback(async (): Promise<boolean> => {
    const guest = readGuestCart();
    const withSku = guest.filter((g) => g.skuId && g.qty > 0);
    if (!withSku.length) {
      clearGuestCart();
      await refreshCart();
      return true;
    }

    setSyncing(true);
    setError(null);
    try {
      const server = await storeApi.getCart();
      const qtyBySku = new Map(server.map((l) => [l.skuId, l.quantity]));

      for (const item of withSku) {
        const skuId = item.skuId!;
        const nextQty = (qtyBySku.get(skuId) ?? 0) + item.qty;
        await storeApi.setCartItem(skuId, nextQty);
        qtyBySku.set(skuId, nextQty);
      }

      clearGuestCart();
      const lines = await storeApi.getCart();
      setItems(mapApiLines(lines));
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không gộp được giỏ guest vào tài khoản",
      );
      try {
        const lines = await storeApi.getCart();
        setItems(mapApiLines(lines));
      } catch {
        /* ignore */
      }
      return false;
    } finally {
      setSyncing(false);
    }
  }, [refreshCart]);

  // Khi auth sẵn sàng / đổi account: load đúng giỏ
  useEffect(() => {
    if (!authHydrated) return;

    let cancelled = false;

    async function sync() {
      if (isAuthenticated && userKey) {
        // Đổi account → clear UI trước khi load giỏ mới
        if (lastUserRef.current && lastUserRef.current !== userKey) {
          setItems([]);
          mergedForUserRef.current = null;
        }
        lastUserRef.current = userKey;

        if (mergedForUserRef.current !== userKey) {
          const ok = await mergeGuestIntoApiCart();
          if (!cancelled && ok) mergedForUserRef.current = userKey;
        } else {
          await refreshCart();
        }
      } else {
        lastUserRef.current = null;
        mergedForUserRef.current = null;
        // Logout / guest: chỉ hiện giỏ guest — không lộ giỏ account
        if (!cancelled) {
          setItems(readGuestCart());
          setError(null);
        }
      }
      if (!cancelled) setHydrated(true);
    }

    void sync();
    return () => {
      cancelled = true;
    };
  }, [
    authHydrated,
    isAuthenticated,
    userKey,
    mergeGuestIntoApiCart,
    refreshCart,
  ]);

  // Guest: persist localStorage
  useEffect(() => {
    if (!hydrated || isAuthenticated) return;
    writeGuestCart(items);
  }, [items, hydrated, isAuthenticated]);

  const addItem = useCallback(
    async ({
      shoe,
      color,
      size,
      qty = 1,
      colorIndex,
      sizeIndex,
    }: AddPayload): Promise<string | null> => {
      setError(null);
      const sku = findSku(shoe, color, size, { colorIndex, sizeIndex });

      if (isAuthenticated) {
        if (!sku) {
          const msg = shoe.skus?.length
            ? "Không tìm thấy SKU cho màu/size đã chọn. Hãy chọn lại."
            : "Sản phẩm chưa có SKU từ API — không thêm được khi đã đăng nhập.";
          setError(msg);
          return msg;
        }
        if (sku.available < qty) {
          const msg = `Không đủ tồn kho (còn ${sku.available}).`;
          setError(msg);
          return msg;
        }
        setSyncing(true);
        try {
          const lines = await storeApi.getCart();
          const existing = lines.find((l) => l.skuId === sku.id);
          const nextQty = (existing?.quantity ?? 0) + qty;
          await storeApi.setCartItem(sku.id, nextQty);
          await refreshCart();
          return null;
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Thêm giỏ thất bại";
          setError(msg);
          return msg;
        } finally {
          setSyncing(false);
        }
      }

      // Guest — bắt buộc có skuId để sau này merge được
      if (!sku) {
        const msg =
          "Sản phẩm chưa có SKU từ API — đăng nhập hoặc chọn sản phẩm từ catalog API.";
        setError(msg);
        return msg;
      }

      const id = sku.id;
      const priceValue = sku.price ?? getShoePriceValue(shoe);
      setItems((prev) => {
        const existing = prev.find((item) => item.skuId === id || item.id === id);
        if (existing) {
          return prev.map((item) =>
            item.id === existing.id ? { ...item, qty: item.qty + qty } : item,
          );
        }
        return [
          ...prev,
          {
            id,
            shoeId: shoe.id,
            skuId: sku.id,
            name: shoe.name,
            nameAccent: shoe.nameAccent,
            price: shoe.price,
            priceValue,
            color,
            size,
            hero: shoe.hero,
            accent: shoe.accent,
            qty,
          },
        ];
      });
      return null;
    },
    [isAuthenticated, refreshCart],
  );

  const updateQty = useCallback(
    async (id: string, qty: number) => {
      setError(null);
      if (isAuthenticated) {
        setSyncing(true);
        try {
          if (qty <= 0) await storeApi.removeCartItem(id);
          else await storeApi.setCartItem(id, qty);
          await refreshCart();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Cập nhật giỏ thất bại");
        } finally {
          setSyncing(false);
        }
        return;
      }

      setItems((prev) =>
        prev
          .map((item) => (item.id === id ? { ...item, qty } : item))
          .filter((item) => item.qty > 0),
      );
    },
    [isAuthenticated, refreshCart],
  );

  const removeItem = useCallback(
    async (id: string) => {
      setError(null);
      if (isAuthenticated) {
        setSyncing(true);
        try {
          await storeApi.removeCartItem(id);
          await refreshCart();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Xóa giỏ thất bại");
        } finally {
          setSyncing(false);
        }
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    },
    [isAuthenticated, refreshCart],
  );

  const clearCart = useCallback(async () => {
    setError(null);
    if (isAuthenticated) {
      setSyncing(true);
      try {
        const lines = await storeApi.getCart();
        for (const line of lines) {
          await storeApi.removeCartItem(line.skuId);
        }
        setItems([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Xóa giỏ thất bại");
      } finally {
        setSyncing(false);
      }
      return;
    }
    setItems([]);
    clearGuestCart();
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      items,
      count: cartCount(items),
      total: cartTotal(items),
      hydrated,
      syncing,
      error,
      addItem,
      updateQty,
      removeItem,
      clearCart,
      refreshCart,
    }),
    [
      items,
      hydrated,
      syncing,
      error,
      addItem,
      updateQty,
      removeItem,
      clearCart,
      refreshCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
