/** Base URL gọi từ browser — proxy Next `/api/abp` gắn cookie Identity. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "/api/abp";

/** Origin thật của ShoeStore API (server-side proxy). */
export const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN?.replace(/\/$/, "") ||
  "https://utc-btl-website.onrender.com/";

export const OIDC_CLIENT_ID =
  process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || "ShoeStore_App";

export const OIDC_SCOPE =
  process.env.NEXT_PUBLIC_OIDC_SCOPE ||
  "openid profile email offline_access ShoeStore";

export const AUTH_STORAGE_KEY = "shoestore-auth-v1";
export const AUTH_COOKIE_NAME = "shoestore_sid";
/** Tên cookie antiforgery phía API (vd .AspNetCore.Antiforgery.xxx). */
export const AF_NAME_COOKIE = "shoestore_af_n";
export const AF_VALUE_COOKIE = "shoestore_af";
export const XSRF_COOKIE_NAME = "shoestore_xsrf";
