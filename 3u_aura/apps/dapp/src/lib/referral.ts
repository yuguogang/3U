export const PENDING_REFERRAL_CODE_STORAGE_KEY = "aura:pending-referral-code";

export function normalizeReferralCode(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim().toUpperCase();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolvePendingReferralCode(urlReferralCode?: string | null) {
  const normalizedFromUrl = normalizeReferralCode(urlReferralCode);
  if (normalizedFromUrl) {
    return normalizedFromUrl;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return normalizeReferralCode(
    window.sessionStorage.getItem(PENDING_REFERRAL_CODE_STORAGE_KEY),
  );
}
