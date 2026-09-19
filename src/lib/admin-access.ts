/** Tài khoản được vào khu vực /admin (khớp SiteHeader + login redirect). */
export function isAdminUserName(userName?: string | null): boolean {
  const name = userName?.trim().toLowerCase() || "";
  return name === "admin" || name === "store-manager";
}
