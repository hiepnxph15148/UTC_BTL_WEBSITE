/** Format API fields for human display (never raw UUID / JSON blobs). */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AddressSnapshot = {
  recipient: string;
  phone: string;
  fullAddress: string;
};

export function looksLikeUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return UUID_RE.test(value.trim());
}

export function looksLikeJsonBlob(value: string | null | undefined): boolean {
  if (!value) return false;
  const s = value.trim();
  return (
    (s.startsWith("{") && s.endsWith("}")) ||
    (s.startsWith("[") && s.endsWith("]"))
  );
}

/** Prefer human product title; skip UUID / JSON / empty. */
export function displayProductName(
  ...candidates: Array<string | null | undefined>
): string {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const s = candidate.trim();
    if (!s) continue;
    if (looksLikeUuid(s)) continue;
    if (looksLikeJsonBlob(s)) continue;
    if (s.toLowerCase() === "sku") continue;
    return s;
  }
  return "Sneaker";
}

export function displayOrderNumber(
  number: string | null | undefined,
  id?: string | null,
  fallback = "Order",
): string {
  if (number?.trim()) return number.trim();
  if (id && !looksLikeUuid(id)) return id;
  return fallback;
}

export function parseAddressSnapshot(
  raw: string | null | undefined,
): AddressSnapshot | null {
  if (!raw?.trim()) return null;
  const text = raw.trim();

  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const recipient =
        typeof parsed.recipient === "string" ? parsed.recipient.trim() : "";
      const phone = typeof parsed.phone === "string" ? parsed.phone.trim() : "";
      const fullAddress =
        typeof parsed.fullAddress === "string"
          ? parsed.fullAddress.trim()
          : typeof parsed.address === "string"
            ? parsed.address.trim()
            : "";
      if (recipient || phone || fullAddress) {
        return { recipient, phone, fullAddress };
      }
    }
  } catch {
    // not JSON — try legacy pipe format
  }

  if (text.includes("|")) {
    const parts = text
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) {
      return {
        recipient: parts[0] || "",
        phone: parts[1] || "",
        fullAddress: parts.slice(2).join(", "),
      };
    }
  }

  // Plain string that isn't JSON/UUID
  if (!looksLikeUuid(text) && !looksLikeJsonBlob(text)) {
    return { recipient: text, phone: "", fullAddress: "" };
  }

  return null;
}

export function formatAddressLines(
  raw: string | null | undefined,
): string[] {
  const parsed = parseAddressSnapshot(raw);
  if (!parsed) return [];
  return [parsed.recipient, parsed.phone, parsed.fullAddress].filter(Boolean);
}

export function formatAddressRecipient(
  raw: string | null | undefined,
  fallback = "—",
): string {
  const parsed = parseAddressSnapshot(raw);
  if (!parsed) return fallback;
  return parsed.recipient || parsed.fullAddress || fallback;
}
