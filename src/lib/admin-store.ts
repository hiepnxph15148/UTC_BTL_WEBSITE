export type AdminCategory = {
  id: string;
  label: string;
  blurb: string;
  accent: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  nameAccent: string;
  price: string;
  category: string;
  accent: string;
  hero: string;
  colors: string[];
  sizes: number[];
  stock: number;
  sales: number;
  createdAt: string;
  source: "seed" | "custom";
};

const PRODUCTS_KEY = "nike-utc-admin-products-v1";
const CATEGORIES_KEY = "nike-utc-admin-categories-v1";

export function loadCustomProducts(): AdminProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    return raw ? (JSON.parse(raw) as AdminProduct[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomProducts(products: AdminProduct[]) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function loadCustomCategories(): AdminCategory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    return raw ? (JSON.parse(raw) as AdminCategory[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomCategories(categories: AdminCategory[]) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Fake doanh thu theo tháng cho Highcharts */
export const revenueSeries = {
  weekly: [
    { name: "Mon", value: 4200 },
    { name: "Tue", value: 5100 },
    { name: "Wed", value: 4800 },
    { name: "Thu", value: 6200 },
    { name: "Fri", value: 7100 },
    { name: "Sat", value: 8600 },
    { name: "Sun", value: 7900 },
  ],
  monthly: [
    { name: "Jul", value: 18200 },
    { name: "Aug", value: 20100 },
    { name: "Sep", value: 19500 },
    { name: "Oct", value: 22800 },
    { name: "Nov", value: 31200 },
    { name: "Dec", value: 48600 },
  ],
  yearly: [
    { name: "2021", value: 186000 },
    { name: "2022", value: 242000 },
    { name: "2023", value: 298000 },
    { name: "2024", value: 356000 },
    { name: "2025", value: 412000 },
    { name: "2026", value: 268000 },
  ],
};

export const fakeOrders = [
  {
    id: "#25426",
    product: "Nike Impact 4",
    date: "2026-03-01",
    payment: "PayPal",
    customer: "Kiran Nguyen",
    status: "Delivered",
    amount: 250.9,
  },
  {
    id: "#25425",
    product: "Nike Air Max 1",
    date: "2026-03-01",
    payment: "Visa",
    customer: "Aisha Tran",
    status: "Canceled",
    amount: 189,
  },
  {
    id: "#25424",
    product: "Nike Quest 6",
    date: "2026-02-28",
    payment: "Cash",
    customer: "Hugo Le",
    status: "Delivered",
    amount: 175,
  },
  {
    id: "#25423",
    product: "Nike Killshot 2",
    date: "2026-02-27",
    payment: "MoMo",
    customer: "Lina Pham",
    status: "Delivered",
    amount: 110,
  },
  {
    id: "#25422",
    product: "Nike Air Max SC",
    date: "2026-02-26",
    payment: "PayPal",
    customer: "Omar Vo",
    status: "Shipped",
    amount: 165,
  },
  {
    id: "#25421",
    product: "Nike Air Max Lite",
    date: "2026-02-25",
    payment: "Visa",
    customer: "Bessie Cooper",
    status: "Delivered",
    amount: 140,
  },
  {
    id: "#25420",
    product: "Nike Quest Road",
    date: "2026-02-24",
    payment: "Cash",
    customer: "Minh Do",
    status: "Processing",
    amount: 159,
  },
  {
    id: "#25419",
    product: "Nike Killshot Court",
    date: "2026-02-23",
    payment: "MoMo",
    customer: "An Bui",
    status: "Delivered",
    amount: 125,
  },
] as const;

export type OrderStatus = (typeof fakeOrders)[number]["status"];

export const fakeFeedback = [
  {
    id: "FB-101",
    orderId: "#25425",
    customer: "Aisha Tran",
    type: "Phản ánh",
    subject: "Hủy đơn nhưng chưa hoàn tiền",
    message:
      "Tôi đã hủy đơn #25425 hôm 01/03 nhưng chưa nhận được hoàn tiền về thẻ Visa.",
    date: "2026-03-02",
    status: "Open",
  },
  {
    id: "FB-102",
    orderId: "#25426",
    customer: "Kiran Nguyen",
    type: "Góp ý",
    subject: "Muốn thêm size 10.5",
    message: "Impact 4 rất đẹp, store nên bổ sung size 10.5 và 11.",
    date: "2026-03-01",
    status: "Reviewed",
  },
  {
    id: "FB-103",
    orderId: "#25422",
    customer: "Omar Vo",
    type: "Phản ánh",
    subject: "Giao hàng chậm",
    message: "Đơn Shipped từ 26/02 vẫn chưa có mã vận đơn cập nhật.",
    date: "2026-02-28",
    status: "Open",
  },
  {
    id: "FB-104",
    orderId: "#25423",
    customer: "Lina Pham",
    type: "Góp ý",
    subject: "Website dễ dùng",
    message: "Collections lọc category rất rõ, cảm ơn team.",
    date: "2026-02-27",
    status: "Closed",
  },
  {
    id: "FB-105",
    orderId: "#25420",
    customer: "Minh Do",
    type: "Phản ánh",
    subject: "Sai màu sản phẩm",
    message: "Đặt Quest Road màu xanh nhưng xác nhận đơn hiện màu khác.",
    date: "2026-02-25",
    status: "Open",
  },
] as const;
