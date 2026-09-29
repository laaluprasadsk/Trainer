export function safeInternalRedirect(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (/\\|[\u0000-\u001f]/.test(value)) return null;
  try {
    const decoded = decodeURIComponent(value);
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
    const parsed = new URL(value, "https://trainrr.invalid");
    if (parsed.origin !== "https://trainrr.invalid") return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}
