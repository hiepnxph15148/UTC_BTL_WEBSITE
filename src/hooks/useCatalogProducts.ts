"use client";

import { useEffect, useState } from "react";
import {
  fetchCatalogProducts,
  productMatchesSearch,
  slugifyCategory,
  type CatalogLookups,
} from "@/lib/api";
import { homeShoes, shoes, type ShoeProduct } from "@/data/shoes";
import type { LookupDto } from "@/lib/api/types";

type State = {
  shoes: ShoeProduct[];
  lookups: CatalogLookups | null;
  loading: boolean;
  error: string | null;
  fromApi: boolean;
};

function filterBySearch(list: ShoeProduct[], search?: string) {
  const q = search?.trim();
  if (!q) return list;
  return list.filter((shoe) => productMatchesSearch(shoe, q));
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
  allPages?: boolean;
  fallback?: ShoeProduct[];
}) {
  const categoryId = options?.categoryId;
  const search = options?.search;
  const take = options?.take ?? 100;
  const allPages = options?.allPages ?? false;
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
      // Search luôn lọc phía client (không phân biệt hoa thường / dấu).
      search: undefined,
      take,
      allPages: allPages || Boolean(search?.trim()),
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
  }, [categoryId, search, take, allPages]);

  return state;
}

export function useHomeCatalog() {
  return useCatalogProducts({ take: 20, fallback: homeShoes });
}

export type CollectionSection = {
  id: string;
  label: string;
  accent: string;
  /** UUID danh mục API (nếu có). */
  categoryId?: string;
};

const SECTION_ACCENTS = [
  "#c8102e",
  "#3b82f6",
  "#c6e600",
  "#8b5cff",
  "#ed3b6b",
  "#38bdf8",
];

/** Danh mục hiển thị trên Bộ sưu tập: ưu tiên lookup API. */
export function buildCollectionSections(
  lookups: CatalogLookups | null,
  shoesList: ShoeProduct[],
): CollectionSection[] {
  const fromApi = (lookups?.categories || [])
    .filter((c) => c.active !== false)
    .map((c, index) => ({
      id: slugifyCategory(c.name || c.id),
      label: c.name || "Danh mục",
      accent: SECTION_ACCENTS[index % SECTION_ACCENTS.length],
      categoryId: c.id,
    }))
    .filter((c) =>
      shoesList.some(
        (s) => s.categoryId === c.categoryId || s.category === c.id,
      ),
    );

  if (fromApi.length) return fromApi;

  // Fallback demo: nhóm theo ShoeCategory có sẵn trong list
  const seen = new Set<string>();
  const demo: CollectionSection[] = [];
  for (const shoe of shoesList) {
    if (seen.has(shoe.category)) continue;
    seen.add(shoe.category);
    demo.push({
      id: shoe.category,
      label: shoe.category,
      accent: SECTION_ACCENTS[demo.length % SECTION_ACCENTS.length],
    });
  }
  return demo;
}

export function resolveCollectionCategory(
  param: string,
  sections: CollectionSection[],
  lookups: CatalogLookups | null,
): CollectionSection | null {
  const bySection =
    sections.find((s) => s.id === param || s.categoryId === param) || null;
  if (bySection) return bySection;

  const lookup = (lookups?.categories || []).find(
    (c: LookupDto) =>
      c.id === param || slugifyCategory(c.name || "") === param,
  );
  if (!lookup) return null;
  return {
    id: slugifyCategory(lookup.name || lookup.id),
    label: lookup.name || "Danh mục",
    accent: SECTION_ACCENTS[0],
    categoryId: lookup.id,
  };
}
