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

function filterBySearch(list: ShoeProduct[], search?: string) {
  const q = search?.trim().toLowerCase();
  if (!q) return list;
  return list.filter((shoe) =>
    `${shoe.name} ${shoe.nameAccent} ${shoe.category}`
      .toLowerCase()
      .includes(q),
  );
}

function preferPurchasable(list: ShoeProduct[]) {
  const withSkus = list.filter((s) => (s.skus?.length ?? 0) > 0);
  return withSkus.length ? withSkus : list;
}

/** Catalog hook: API lỗi/rỗng → fallback demo im lặng, không banner. */
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

  const [state, setState] = useState<State>(() => ({
    shoes: filterBySearch(fallback, search),
    lookups: null,
    loading: true,
    error: null,
    fromApi: false,
  }));

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({
      ...prev,
      // Giữ list API cũ khi refetch — tránh nháy về demo (không mua được)
      shoes: prev.fromApi ? prev.shoes : filterBySearch(fallback, search),
      loading: true,
      error: null,
    }));

    fetchCatalogProducts({
      categoryId,
      search,
      take,
    })
      .then(({ shoes: list, lookups }) => {
        if (cancelled) return;
        const purchasable = preferPurchasable(list);
        const next = purchasable.length ? purchasable : fallback;
        setState({
          shoes: filterBySearch(next, search),
          lookups: purchasable.length ? lookups : null,
          loading: false,
          error: null,
          fromApi: purchasable.length > 0,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState((prev) => ({
          shoes: prev.fromApi ? prev.shoes : filterBySearch(fallback, search),
          lookups: prev.fromApi ? prev.lookups : null,
          loading: false,
          error: null,
          fromApi: prev.fromApi,
        }));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, search, take]);

  return state;
}

export function useHomeCatalog() {
  return useCatalogProducts({ take: 20, fallback: homeShoes });
}
