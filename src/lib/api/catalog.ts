import { mediaUrl } from "./client";
import { storeApi } from "./store";
import { LookupKind, type LookupDto, type ProductDto, type SkuDto } from "./types";
import type { ShoeCategory, ShoeProduct } from "@/data/shoes";

const ACCENTS = ["#ed3b6b", "#c8102e", "#3b82f6", "#c6e600", "#8b5cff", "#38bdf8"];

const COLOR_HEX: Record<string, string> = {
  trắng: "#ffffff",
  white: "#ffffff",
  đen: "#1a1a1a",
  black: "#1a1a1a",
  xám: "#9e9e9e",
  gray: "#9e9e9e",
  grey: "#9e9e9e",
  "xanh navy": "#1e3a5f",
  navy: "#1e3a5f",
  đỏ: "#c8102e",
  red: "#c8102e",
  be: "#d6c4a8",
  beige: "#d6c4a8",
  xanh: "#3b82f6",
  blue: "#3b82f6",
};

const CATEGORY_MAP: Record<string, ShoeCategory> = {
  lifestyle: "lifestyle",
  "giày lifestyle": "lifestyle",
  running: "running",
  "giày chạy bộ": "running",
  "chạy bộ": "running",
  training: "training",
  "giày tập luyện": "training",
  "tập luyện": "training",
  basketball: "basketball",
  "giày bóng rổ": "basketball",
  "bóng rổ": "basketball",
  skate: "training",
  "giày skate": "training",
};

export type CatalogLookups = {
  categories: LookupDto[];
  brands: LookupDto[];
  colors: LookupDto[];
  sizes: LookupDto[];
  byId: Map<string, LookupDto>;
};

export function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseSizeLabel(name: string | null | undefined): number {
  if (!name) return 0;
  const match = name.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

export function colorToHex(name: string | null | undefined): string {
  if (!name) return "#9e9e9e";
  const key = name.trim().toLowerCase();
  return COLOR_HEX[key] || "#9e9e9e";
}

export function categoryFromLookup(lookup?: LookupDto | null): ShoeCategory {
  if (!lookup?.name) return "lifestyle";
  const key = lookup.name.trim().toLowerCase();
  return CATEGORY_MAP[key] || "lifestyle";
}

export function slugifyCategory(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function fallbackImage(index: number) {
  const n = (index % 15) + 1;
  return encodeURI(`/item/image ${n}.png`);
}

export function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return { name: full, nameAccent: "" };
  return {
    name: parts.slice(0, -1).join(" "),
    nameAccent: parts[parts.length - 1] || "",
  };
}

export async function loadCatalogLookups(): Promise<CatalogLookups> {
  const [categories, brands, colors, sizes] = await Promise.all([
    storeApi.getLookups(LookupKind.Category),
    storeApi.getLookups(LookupKind.Brand),
    storeApi.getLookups(LookupKind.Color),
    storeApi.getLookups(LookupKind.Size),
  ]);
  const byId = new Map<string, LookupDto>();
  for (const item of [...categories, ...brands, ...colors, ...sizes]) {
    byId.set(item.id, item);
  }
  return { categories, brands, colors, sizes, byId };
}

export function mapProductToShoe(
  product: ProductDto,
  skus: SkuDto[],
  lookups: CatalogLookups,
  index = 0,
): ShoeProduct {
  const activeSkus = skus.filter((s) => s.active);
  const priceValue =
    activeSkus.length > 0
      ? Math.min(...activeSkus.map((s) => s.price))
      : 0;

  const colorIds = [...new Set(activeSkus.map((s) => s.colorId))];
  const colors = colorIds.map((id) =>
    colorToHex(lookups.byId.get(id)?.name),
  );

  // sizeIds phải cùng thứ tự với sizes (đã sort) — nếu lệch, BUY sẽ chọn sai SKU
  const sizePairs = [...new Set(activeSkus.map((s) => s.sizeId))]
    .map((id, i) => {
      const raw = lookups.byId.get(id)?.name;
      const parsed = parseSizeLabel(raw);
      return {
        id,
        // Lookup thiếu số → vẫn giữ slot theo thứ tự để khớp index UI
        value: parsed > 0 ? parsed : 38 + i,
      };
    })
    .sort((a, b) => a.value - b.value);
  const sizeIds = sizePairs.map((p) => p.id);
  const sizes = sizePairs.map((p) => p.value);

  const categoryLookup = lookups.byId.get(product.categoryId);
  const category = categoryFromLookup(categoryLookup);
  const { name, nameAccent } = splitName(product.name || "Sneaker");
  const accent = ACCENTS[index % ACCENTS.length];
  const hero =
    mediaUrl(product.imageUrl) ||
    fallbackImage(index);

  return {
    id: product.id,
    slug: product.slug || undefined,
    name,
    nameAccent,
    price: priceValue > 0 ? formatVnd(priceValue) : "Liên hệ",
    priceValue,
    colors: colors.length ? colors : ["#9e9e9e"],
    sizes: sizes.length ? sizes : [40],
    colorIds: colorIds.length ? colorIds : undefined,
    sizeIds: sizeIds.length ? sizeIds : undefined,
    skus: activeSkus,
    accent,
    thumbBg: accent,
    hero,
    angles: [hero, hero, hero],
    category,
    categoryId: product.categoryId,
    brandId: product.brandId,
    description: product.description,
  };
}

export function findSku(
  shoe: ShoeProduct,
  colorHex: string,
  sizeValue: number,
  opts?: { colorIndex?: number; sizeIndex?: number },
): SkuDto | undefined {
  if (!shoe.skus?.length) return undefined;

  const colorIndex =
    opts?.colorIndex ??
    shoe.colors.findIndex((c) => c.toLowerCase() === colorHex.toLowerCase());
  const sizeIndex =
    opts?.sizeIndex ?? shoe.sizes.findIndex((s) => s === sizeValue);

  if (
    colorIndex >= 0 &&
    sizeIndex >= 0 &&
    shoe.colorIds?.[colorIndex] &&
    shoe.sizeIds?.[sizeIndex]
  ) {
    const colorId = shoe.colorIds[colorIndex];
    const sizeId = shoe.sizeIds[sizeIndex];
    const hit = shoe.skus.find(
      (s) => s.colorId === colorId && s.sizeId === sizeId && s.active,
    );
    if (hit) return hit;
  }

  // Fallback: khớp theo lookup value nếu mảng index lệch
  if (shoe.colorIds && shoe.sizeIds) {
    const colorId =
      colorIndex >= 0 ? shoe.colorIds[colorIndex] : undefined;
    const sizeId = shoe.sizeIds.find((_, i) => shoe.sizes[i] === sizeValue);
    if (colorId && sizeId) {
      const hit = shoe.skus.find(
        (s) => s.colorId === colorId && s.sizeId === sizeId && s.active,
      );
      if (hit) return hit;
    }
  }

  // Fallback cuối: lấy theo index trong danh sách color/size thực tế của SKU
  const uniqueColorIds = [...new Set(shoe.skus.map((s) => s.colorId))];
  const uniqueSizeIds = [...new Set(shoe.skus.map((s) => s.sizeId))];
  const colorId =
    colorIndex >= 0
      ? uniqueColorIds[Math.min(colorIndex, uniqueColorIds.length - 1)]
      : uniqueColorIds[0];
  const sizeId =
    sizeIndex >= 0
      ? uniqueSizeIds[Math.min(sizeIndex, uniqueSizeIds.length - 1)]
      : uniqueSizeIds[0];
  if (colorId && sizeId) {
    const hit = shoe.skus.find(
      (s) => s.colorId === colorId && s.sizeId === sizeId && s.active,
    );
    if (hit) return hit;
  }

  return shoe.skus.find((s) => s.active) ?? shoe.skus[0];
}

/**
 * Demo shoes (impact-4, …) không có SKU — gắn lại từ catalog API khi có thể.
 * Trả null nếu kho không có biến thể mua được.
 */
export async function ensurePurchasableShoe(
  shoe: ShoeProduct,
): Promise<ShoeProduct | null> {
  if (shoe.skus?.some((s) => s.active)) return shoe;

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shoe.id)) {
    try {
      const got = await fetchCatalogProduct(shoe.id);
      if (got?.shoe.skus?.some((s) => s.active)) return got.shoe;
    } catch {
      // continue search
    }
  }

  const norm = (s: ShoeProduct) =>
    `${s.name} ${s.nameAccent}`.trim().toLowerCase();
  const target = norm(shoe);

  try {
    const queried = await fetchCatalogProducts({
      search: `${shoe.name} ${shoe.nameAccent}`.trim(),
      take: 40,
    });
    const pool = queried.shoes.filter((s) => s.skus?.some((x) => x.active));
    const matched =
      pool.find((s) => norm(s) === target) ||
      pool.find((s) => norm(s).includes(target) || target.includes(norm(s)));
    if (matched) return matched;

    const all = await fetchCatalogProducts({ take: 40 });
    const purchasable = all.shoes.filter((s) => s.skus?.some((x) => x.active));
    if (!purchasable.length) return null;

    // Map demo carousel theo thứ tự → sản phẩm kho (để MUA trên home demo vẫn được)
    const { homeShoes } = await import("@/data/shoes");
    const demoIndex = homeShoes.findIndex((h) => h.id === shoe.id);
    if (demoIndex >= 0) {
      return purchasable[demoIndex % purchasable.length] ?? purchasable[0];
    }

    const brand = shoe.name.split(/\s+/)[0]?.toLowerCase();
    if (brand) {
      const byBrand = purchasable.find((s) =>
        s.name.toLowerCase().includes(brand),
      );
      if (byBrand) return byBrand;
    }

    return purchasable[0] ?? null;
  } catch {
    return null;
  }
}

/** Lấy danh sách sản phẩm + SKU, map sang ShoeProduct cho UI. */
export async function fetchCatalogProducts(options?: {
  categoryId?: string;
  brandId?: string;
  search?: string;
  take?: number;
}): Promise<{ shoes: ShoeProduct[]; lookups: CatalogLookups }> {
  const lookups = await loadCatalogLookups();
  const products = await storeApi.getProducts({
    take: options?.take ?? 100,
    categoryId: options?.categoryId,
    brandId: options?.brandId,
    search: options?.search,
  });

  const shoes = await Promise.all(
    products.map(async (product, index) => {
      try {
        const skus = await storeApi.getSkus(product.id);
        return mapProductToShoe(product, skus, lookups, index);
      } catch {
        return mapProductToShoe(product, [], lookups, index);
      }
    }),
  );

  return { shoes, lookups };
}

export async function fetchCatalogProduct(
  id: string,
): Promise<{ shoe: ShoeProduct; lookups: CatalogLookups } | null> {
  const lookups = await loadCatalogLookups();
  try {
    const [product, skus] = await Promise.all([
      storeApi.getProduct(id),
      storeApi.getSkus(id),
    ]);
    return {
      shoe: mapProductToShoe(product, skus, lookups, 0),
      lookups,
    };
  } catch {
    return null;
  }
}
