/** Product image rules — khớp backend PRODUCT-IMAGES.md */

export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MiB
export const PRODUCT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export function validateProductImageFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  const mimeOk = ALLOWED_MIME.has(file.type);
  const extOk = ALLOWED_EXT.has(ext);

  if (!mimeOk && !extOk) {
    return "Ảnh phải là JPEG, PNG hoặc WebP.";
  }
  if (file.size <= 0) {
    return "File ảnh trống.";
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return "Ảnh tối đa 5 MB.";
  }
  return null;
}
