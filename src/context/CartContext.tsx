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
  readCartMeta,
  readGuestCart,
  rememberCartMeta,
  rememberCartMetaFromItems,
  writeGuestCart,
  type CartDisplayMeta,
  type CartItem,
} from "@/lib/cart";
import { getShoePriceValue, type ShoeProduct } from "@/data/shoes";
import { findSku, formatVnd, storeApi, ApiError, ensurePurchasableShoe, humanizeStoreError } from "@/lib/api";
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

function displayMetaFromShoe(
  shoe: ShoeProduct,
  color: string,
  size: number,
): CartDisplayMeta {
  return {
    shoeId: shoe.id,
    name: shoe.name,
    nameAccent: shoe.nameAccent,
    color,
    size,
    hero: shoe.hero,
    accent: shoe.accent,
  };
}

function mapApiLines(
  lines: Awaited<ReturnType<typeof storeApi.getCart>>,
  meta: Record<string, CartDisplayMeta> = {},
  previous: CartItem[] = [],
): CartItem[] {
  const fromPrev: Record<string, CartDisplayMeta> = {};
  for (const item of previous) {
    const key = item.skuId || item.id;
    if (!key) continue;
    fromPrev[key] = {
      shoeId: item.shoeId,
      name: item.name,
      nameAccent: item.nameAccent,
      color: item.color,
      size: item.size,
      hero: item.hero,
      accent: item.accent,
    };
  }

  return lines.map((line) => {
    const m = meta[line.skuId] || fromPrev[line.skuId];
    return {
      id: line.skuId,
      shoeId: m?.shoeId || line.skuId,
      skuId: line.skuId,
      name: m?.name || line.code || "Sản phẩm",
      nameAccent: m?.nameAccent || "",
      price: formatVnd(line.unitPrice),
      priceValue: line.unitPrice,
      color: m?.color || "#9e9e9e",
      size: m?.size || 0,
      hero: m?.hero || encodeURI("/item/image 1.png"),
      accent: m?.accent || "#ed3b6b",
      qty: line.quantity,
    };
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, hydrated: authHydrated, session, logout } = useAuth();
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
      setItems((prev) => mapApiLines(lines, readCartMeta(), prev));
    } catch (err) {
      setError(
        humanizeStoreError(
          err instanceof Error ? err.message : "Không tải được giỏ hàng",
        ),
      );
    } finally {
      setSyncing(false);
    }
  }, [isAuthenticated]);

  /** Đẩy giỏ guest (có skuId) lên giỏ account trên API, rồi xóa guest. */
  const mergeGuestIntoApiCart = useCallback(async (): Promise<boolean> => {
    const guest = readGuestCart();
    rememberCartMetaFromItems(guest);
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
      setItems(mapApiLines(lines, readCartMeta(), guest));
      return true;
    } catch (err) {
      setError(
        humanizeStoreError(
          err instanceof Error
            ? err.message
            : "Không gộp được giỏ vào tài khoản",
        ),
      );
      try {
        const lines = await storeApi.getCart();
        setItems(mapApiLines(lines, readCartMeta(), guest));
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
    rememberCartMetaFromItems(items);
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
      let working = shoe;
      let sku = findSku(working, color, size, { colorIndex, sizeIndex });

      if (!sku) {
        const resolved = await ensurePurchasableShoe(working);
        if (resolved) {
          working = resolved;
          sku = findSku(working, color, size, { colorIndex, sizeIndex });
          // Demo size 6–9 vs kho 38–44: lấy theo index hoặc SKU đầu
          if (!sku && working.skus?.length) {
            const colors = [...new Set(working.skus.map((s) => s.colorId))];
            const sizes = [...new Set(working.skus.map((s) => s.sizeId))];
            const c =
              colors[
                Math.min(colorIndex ?? 0, Math.max(colors.length - 1, 0))
              ] ?? colors[0];
            const s =
              sizes[Math.min(sizeIndex ?? 0, Math.max(sizes.length - 1, 0))] ??
              sizes[0];
            sku =
              working.skus.find(
                (x) => x.colorId === c && x.sizeId === s && x.active,
              ) ||
              working.skus.find((x) => x.active) ||
              working.skus[0];
          }
        }
      }

      if (isAuthenticated) {
        if (!sku) {
          const msg =
            "Sản phẩm này chưa có trong kho để đặt hàng. Hãy chọn mẫu ở Bộ sưu tập.";
          setError(msg);
          return msg;
        }
        if (sku.available < qty) {
          const left = sku.available;
          const msg =
            left <= 0
              ? "Màu/size bạn chọn đã hết hàng. Hãy chọn size hoặc màu khác."
              : `Chỉ còn ${left} đôi cho màu/size này. Hãy giảm số lượng hoặc chọn size khác.`;
          setError(msg);
          return msg;
        }
        setSyncing(true);
        try {
          const lines = await storeApi.getCart();
          const existing = lines.find((l) => l.skuId === sku.id);
          const nextQty = (existing?.quantity ?? 0) + qty;
          await storeApi.setCartItem(sku.id, nextQty);
          const displayColor =
            working.colors[
              Math.min(colorIndex ?? 0, Math.max(working.colors.length - 1, 0))
            ] ?? color;
          const displaySize =
            working.sizes[
              Math.min(sizeIndex ?? 0, Math.max(working.sizes.length - 1, 0))
            ] ?? size;
          const meta = rememberCartMeta(
            sku.id,
            displayMetaFromShoe(working, displayColor, displaySize),
          );
          const refreshed = await storeApi.getCart();
          setItems((prev) => mapApiLines(refreshed, meta, prev));
          return null;
        } catch (err) {
          const raw =
            err instanceof Error ? err.message : "Không thêm được vào giỏ hàng.";
          const msg = humanizeStoreError(raw);
          const authFail =
            (err instanceof ApiError && err.status === 401) ||
            /đăng nhập|unauthorized|login/i.test(raw);
          if (authFail) {
            logout();
            setError(null);
            return "__NEED_LOGIN__";
          }
          setError(msg);
          return msg;
        } finally {
          setSyncing(false);
        }
      }

      // Guest — bắt buộc có skuId để sau này merge được
      if (!sku) {
        // Không setError sticky — UI mở popup đăng nhập
        return "__NEED_LOGIN__";
      }

      const id = sku.id;
      const priceValue = sku.price ?? getShoePriceValue(working);
      const displayColor =
        working.colors[
          Math.min(colorIndex ?? 0, Math.max(working.colors.length - 1, 0))
        ] ?? color;
      const displaySize =
        working.sizes[
          Math.min(sizeIndex ?? 0, Math.max(working.sizes.length - 1, 0))
        ] ?? size;
      rememberCartMeta(id, displayMetaFromShoe(working, displayColor, displaySize));
      setItems((prev) => {
        const existing = prev.find((item) => item.skuId === id || item.id === id);
        if (existing) {
          return prev.map((item) =>
            item.id === existing.id
              ? {
                  ...item,
                  qty: item.qty + qty,
                  color: displayColor,
                  size: displaySize,
                  hero: working.hero,
                  name: working.name,
                  nameAccent: working.nameAccent,
                  accent: working.accent,
                  shoeId: working.id,
                }
              : item,
          );
        }
        return [
          ...prev,
          {
            id,
            shoeId: working.id,
            skuId: sku.id,
            name: working.name,
            nameAccent: working.nameAccent,
            price: working.price,
            priceValue,
            color: displayColor,
            size: displaySize,
            hero: working.hero,
            accent: working.accent,
            qty,
          },
        ];
      });
      return null;
    },
    [isAuthenticated, logout],
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
          setError(
            humanizeStoreError(
              err instanceof Error ? err.message : "Không cập nhật được giỏ hàng",
            ),
          );
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
          setError(
            humanizeStoreError(
              err instanceof Error ? err.message : "Không xóa được sản phẩm",
            ),
          );
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
        setError(
          humanizeStoreError(
            err instanceof Error ? err.message : "Không xóa được giỏ hàng",
          ),
        );
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
