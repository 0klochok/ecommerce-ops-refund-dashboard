const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(cents / 100);
}

export function formatPercent(value: number, fractionDigits = 1) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
    style: "percent",
  }).format(value);
}

export function formatDate(value: Date | string) {
  return dateFormatter.format(toDate(value));
}

export function formatShortDate(value: Date | string) {
  return shortDateFormatter.format(toDate(value));
}

export function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}
