export function validateLnbitsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:") return false;

    const h = parsed.hostname;

    if (h === "localhost") return false;
    if (/^127\./.test(h)) return false;
    if (/^10\./.test(h)) return false;
    if (/^192\.168\./.test(h)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
    if (h === "169.254.169.254") return false;
    if (h === "metadata.google.internal") return false;

    return true;
  } catch {
    return false;
  }
}
