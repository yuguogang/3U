export function formatAddress(address?: string | null) {
  if (!address) {
    return "-";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatCount(value?: number | null) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

export function formatAtomic(
  value?: string | null,
  decimals: number = 6,
  suffix?: string,
) {
  if (!value) {
    return "-";
  }

  const raw = value.replace(/^0+/, "") || "0";
  if (decimals <= 0) {
    return suffix ? `${raw} ${suffix}` : raw;
  }

  const padded =
    raw.length > decimals ? raw : `${"0".repeat(decimals - raw.length + 1)}${raw}`;
  const integer = padded.slice(0, -decimals) || "0";
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  const text = fraction ? `${integer}.${fraction}` : integer;
  return suffix ? `${text} ${suffix}` : text;
}

export function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}
