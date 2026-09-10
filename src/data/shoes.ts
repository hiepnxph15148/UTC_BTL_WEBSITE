export type ShoeCategory =
  | "lifestyle"
  | "running"
  | "training"
  | "basketball";

export type ShoeProduct = {
  id: string;
  name: string;
  nameAccent: string;
  price: string;
  colors: string[];
  sizes: number[];
  accent: string;
  thumbBg: string;
  hero: string;
  angles: [string, string, string];
  category: ShoeCategory;
};

export const categories: {
  id: ShoeCategory | "all";
  label: string;
  blurb: string;
  accent: string;
}[] = [
  {
    id: "all",
    label: "All",
    blurb: "Toàn bộ bộ sưu tập",
    accent: "#ed3b6b",
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    blurb: "Everyday kicks — street & casual",
    accent: "#c8102e",
  },
  {
    id: "running",
    label: "Running",
    blurb: "Road & trail performance",
    accent: "#3b82f6",
  },
  {
    id: "training",
    label: "Training",
    blurb: "Gym, court & multi-sport",
    accent: "#c6e600",
  },
  {
    id: "basketball",
    label: "Basketball",
    blurb: "Court ready — grip & bounce",
    accent: "#8b5cff",
  },
];

/** Các mục hiển thị trên Collections (không gồm All) */
export const categorySections = categories.filter(
  (c): c is { id: ShoeCategory; label: string; blurb: string; accent: string } =>
    c.id !== "all",
);

const item = (n: number) => encodeURI(`/item/image ${n}.png`);

export const shoes: ShoeProduct[] = [
  {
    id: "impact-4",
    name: "Nike Impact",
    nameAccent: "4",
    price: "$250.90",
    colors: ["#d6c4a8", "#c62828", "#c6e600", "#1a1a1a"],
    sizes: [6, 7, 8, 9],
    accent: "#ed3b6b",
    thumbBg: "#ed3b6b",
    hero: item(1),
    angles: [item(1), item(9), item(8)],
    category: "lifestyle",
  },
  {
    id: "air-max-1",
    name: "Nike Air Max",
    nameAccent: "1",
    price: "$189.00",
    colors: ["#ffffff", "#c8102e", "#1a1a1a", "#9e9e9e"],
    sizes: [6, 7, 8, 9],
    accent: "#c8102e",
    thumbBg: "#2d61ff",
    hero: item(2),
    angles: [item(2), item(3), item(4)],
    category: "lifestyle",
  },
  {
    id: "air-max-impact",
    name: "Nike Air Max",
    nameAccent: "Impact",
    price: "$220.50",
    colors: ["#7ec8c0", "#ed3b6b", "#c6e600", "#1a3a5c"],
    sizes: [6, 7, 8, 9],
    accent: "#ed3b6b",
    thumbBg: "#2d61ff",
    hero: item(5),
    angles: [item(5), item(6), item(7)],
    category: "lifestyle",
  },
  {
    id: "air-max-sc",
    name: "Nike Air Max",
    nameAccent: "SC",
    price: "$165.00",
    colors: ["#ffffff", "#c0c0c0", "#c6e600", "#8a8a8a"],
    sizes: [6, 7, 8, 9],
    accent: "#c6e600",
    thumbBg: "#2d61ff",
    hero: item(10),
    angles: [item(10), item(11), item(12)],
    category: "basketball",
  },
  {
    id: "air-max-lite",
    name: "Nike Air Max",
    nameAccent: "Lite",
    price: "$140.00",
    colors: ["#ffffff", "#d0d0d0", "#b8b8b8", "#1a1a1a"],
    sizes: [6, 7, 8, 9],
    accent: "#ed3b6b",
    thumbBg: "#2d61ff",
    hero: item(13),
    angles: [item(13), item(14), item(15)],
    category: "training",
  },
  // Tạm dùng /item — thay bằng item_sport khi có ảnh tương thích
  {
    id: "quest-6",
    name: "Nike Quest",
    nameAccent: "6",
    price: "$175.00",
    colors: ["#1a1a1a", "#3b82f6", "#ed3b6b", "#ffffff"],
    sizes: [6, 7, 8, 9, 10],
    accent: "#3b82f6",
    thumbBg: "#1e3a8a",
    hero: item(3),
    angles: [item(3), item(4), item(2)],
    category: "running",
  },
  {
    id: "killshot-2",
    name: "Nike Killshot",
    nameAccent: "2",
    price: "$110.00",
    colors: ["#f5f0e8", "#1a1a1a", "#c8102e", "#2d61ff"],
    sizes: [6, 7, 8, 9],
    accent: "#c6e600",
    thumbBg: "#3c3d41",
    hero: item(6),
    angles: [item(6), item(7), item(5)],
    category: "training",
  },
  {
    id: "quest-6-road",
    name: "Nike Quest",
    nameAccent: "Road",
    price: "$159.00",
    colors: ["#3b82f6", "#ffffff", "#1a1a1a", "#ed3b6b"],
    sizes: [7, 8, 9, 10],
    accent: "#38bdf8",
    thumbBg: "#0ea5e9",
    hero: item(8),
    angles: [item(8), item(9), item(1)],
    category: "running",
  },
  {
    id: "killshot-court",
    name: "Nike Killshot",
    nameAccent: "Court",
    price: "$125.00",
    colors: ["#ffffff", "#c8102e", "#1a1a1a", "#8b5cff"],
    sizes: [6, 7, 8, 9],
    accent: "#8b5cff",
    thumbBg: "#4c1d95",
    hero: item(11),
    angles: [item(11), item(12), item(10)],
    category: "basketball",
  },
];

/** Home carousel: 5 mẫu gốc */
export const homeShoes = shoes.slice(0, 5);

export function getShoeById(id: string) {
  return shoes.find((shoe) => shoe.id === id);
}

export function getShoesByCategory(category: ShoeCategory | "all") {
  if (category === "all") return shoes;
  return shoes.filter((shoe) => shoe.category === category);
}

export function parsePrice(price: string) {
  return Number(price.replace(/[^0-9.]/g, "")) || 0;
}
