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
};

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
  },
];
