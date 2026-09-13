"use client";

import { useEffect, useState } from "react";
import { fetchCatalogProducts, type CatalogLookups } from "@/lib/api";
import { homeShoes, shoes, type ShoeProduct } from "@/data/shoes";

type State = {
  shoes: ShoeProduct[];
  lookups: CatalogLookups | null;
  loading: boolean;
  error: string | null;
  fromApi: boolean;
};

export function useCatalogProducts(options?: {
  categoryId?: string;
  search?: string;
  take?: number;
  fallback?: ShoeProduct[];
}) {
  const categoryId = options?.categoryId;
  const search = options?.search;
  const take = options?.take ?? 100;
  const fallback = options?.fallback ?? shoes;

  const [state, setState] = useState<State>({
    shoes: fallback,
    lookups: null,
    loading: true,
    error: null,
    fromApi: false,
  });

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetchCatalogProducts({
      categoryId,
      search,
      take,
    })
      .then(({ shoes: list, lookups }) => {
        if (cancelled) return;
        setState({
          shoes: list.length ? list : fallback,
          lookups,
          loading: false,
          error: list.length
            ? null
            : "API trả về danh sách rỗng — dùng dữ liệu demo",
          fromApi: list.length > 0,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          shoes: fallback,
          lookups: null,
          loading: false,
          error:
            err instanceof Error
              ? `${err.message} — đang dùng dữ liệu demo`
              : "Không kết nối được API — đang dùng dữ liệu demo",
          fromApi: false,
        });
      });

    return () => {
      cancelled = true;
    };
    // fallback is stable module export when defaulted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, search, take]);

  return state;
}

export function useHomeCatalog() {
  return useCatalogProducts({ take: 20, fallback: homeShoes });
}
