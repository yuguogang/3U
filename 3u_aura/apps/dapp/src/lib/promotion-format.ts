const INTEGER_GROUP_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function toDecimalParts(value: string, decimals: number) {
  const normalized = value.trim() || "0";
  const sign = normalized.startsWith("-") ? "-" : "";
  const digits = sign ? normalized.slice(1) : normalized;
  const padded =
    digits.length > decimals ? digits : digits.padStart(decimals + 1, "0");
  const integerPartRaw = padded.slice(0, padded.length - decimals) || "0";
  const fractionPartRaw = decimals > 0 ? padded.slice(-decimals) : "";

  return {
    fractionPartRaw,
    integerPartRaw,
    sign,
  };
}

export function formatAtomicAmount(
  value: string | number | bigint | null | undefined,
  decimals: number,
  fractionDigits: number = 2,
) {
  if (value === null || value === undefined) {
    return "0";
  }

  const input = typeof value === "string" ? value : String(value);
  const { fractionPartRaw, integerPartRaw, sign } = toDecimalParts(
    input,
    decimals,
  );
  const trimmedFraction = fractionPartRaw
    .slice(0, fractionDigits)
    .replace(/0+$/, "");
  const integerPart = INTEGER_GROUP_FORMATTER.format(BigInt(integerPartRaw));

  return trimmedFraction
    ? `${sign}${integerPart}.${trimmedFraction}`
    : `${sign}${integerPart}`;
}

export function formatUsdtAtomic(
  value: string | number | bigint | null | undefined,
  fractionDigits: number = 2,
) {
  return formatAtomicAmount(value, 6, fractionDigits);
}

export function formatAuraAtomic(
  value: string | number | bigint | null | undefined,
  fractionDigits: number = 2,
) {
  return formatAtomicAmount(value, 18, fractionDigits);
}

export function formatWalletAddress(address?: string | null) {
  if (!address) {
    return "-";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatDateTime(value?: Date | string | null) {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatPercent(current: number, target: number) {
  if (!target) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}
