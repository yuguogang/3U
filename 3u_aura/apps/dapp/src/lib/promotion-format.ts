const INTEGER_GROUP_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function scientificToPlainString(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized.includes("e")) {
    return normalized;
  }

  const sign = normalized.startsWith("-") ? "-" : "";
  const unsigned = sign ? normalized.slice(1) : normalized;
  const [mantissa, exponentPart] = unsigned.split("e");
  const exponent = Number.parseInt(exponentPart ?? "0", 10);
  const [integerPart = "0", fractionPart = ""] = mantissa.split(".");
  const digits = `${integerPart}${fractionPart}`.replace(/^0+(?=\d)/, "") || "0";
  const decimalIndex = integerPart.length + exponent;

  if (decimalIndex <= 0) {
    return `${sign}0.${"0".repeat(Math.abs(decimalIndex))}${digits}`.replace(
      /\.?0+$/,
      "",
    );
  }

  if (decimalIndex >= digits.length) {
    return `${sign}${digits}${"0".repeat(decimalIndex - digits.length)}`;
  }

  return `${sign}${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
}

export function parseAtomicToBigInt(
  value: string | number | bigint | null | undefined,
) {
  if (value === null || value === undefined) {
    return BigInt(0);
  }

  if (typeof value === "bigint") {
    return value;
  }

  const raw = typeof value === "string" ? value.trim() : String(value);
  if (!raw) {
    return BigInt(0);
  }

  const plain = scientificToPlainString(raw);
  const [integerPart = "0"] = plain.split(".");
  const safeInteger = integerPart === "" || integerPart === "-" ? `${integerPart}0` : integerPart;

  return BigInt(safeInteger);
}

function toDecimalParts(value: string, decimals: number) {
  const normalized = scientificToPlainString(value.trim() || "0");
  const sign = normalized.startsWith("-") ? "-" : "";
  const digits = sign ? normalized.slice(1) : normalized;
  const integerDigits = digits.split(".")[0] || "0";
  const padded =
    integerDigits.length > decimals
      ? integerDigits
      : integerDigits.padStart(decimals + 1, "0");
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

  const input =
    typeof value === "bigint"
      ? value.toString()
      : parseAtomicToBigInt(value).toString();
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

export function formatDateTime(
  value?: Date | string | null,
  locale: string = "en-US",
) {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale, {
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
