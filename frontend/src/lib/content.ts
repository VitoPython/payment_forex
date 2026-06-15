/**
 * Presentation-only copy that the upstream API does not provide.
 *
 * The API gives us the plan name, specs, prices and unique order id. The
 * marketing layer from the Figma design — terminal count, the "ВОЗМОЖНОСТИ"
 * feature list and the "ПОДХОДИТ ДЛЯ" tags — is keyed by plan tier (1..4).
 */

export interface TierContent {
  /** Number of trading terminals, shown in the badge with a tooltip. */
  terminals: number;
  /** Tooltip text explaining the terminals figure. */
  terminalsHint: string;
  /** Highlights the card as the recommended option ("BEST CHOICE"). */
  bestChoice?: boolean;
  /** "ВОЗМОЖНОСТИ" — key capabilities. */
  features: string[];
  /** "ПОДХОДИТ ДЛЯ" — suitable-for tags. */
  suitableFor: string[];
}

export const TIER_CONTENT: Record<number, TierContent> = {
  1: {
    terminals: 2,
    terminalsHint: "Рекомендованное число одновременно запущенных терминалов",
    features: [
      "Бесперебойный доступ к рынку 24/7",
      "Стабильная ручная торговля",
      "Базовая автоматизация и скрипты",
    ],
    suitableFor: [
      "Личное использование",
      "Микро-счета",
      "Свинг-трейдинг",
      "Начальный уровень",
      "Старт автоматизации",
    ],
  },
  2: {
    terminals: 3,
    terminalsHint: "Рекомендованное число одновременно запущенных терминалов",
    features: [
      "Диверсификация торговых стратегий",
      "Работа простых роботов и советников",
      "Мониторинг со стандартными индикаторами",
    ],
    suitableFor: [
      "Среднесрочные стратегии",
      "Интрадей-трейдинг",
      "Мультиаккаунтинг",
      "Автоторговля",
      "Контроль рисков",
    ],
  },
  3: {
    terminals: 4,
    terminalsHint: "Рекомендованное число одновременно запущенных терминалов",
    bestChoice: true,
    features: [
      "Мгновенный отклик и исполнение",
      "Комфортный бэктестинг и оптимизация",
      "Работа с продвинутыми индикаторами",
    ],
    suitableFor: [
      "Оптимизация роботов",
      "Тех анализ",
      "Тестирование стратегий",
      "Алгоритмическая торговля",
    ],
  },
  4: {
    terminals: 6,
    terminalsHint: "Рекомендованное число одновременно запущенных терминалов",
    features: [
      "Профессиональное управление капиталом",
      "Запуск сложных систем и алгоритмов",
      "Обработка больших архивов данных",
    ],
    suitableFor: [
      "Интенсивный трейдинг",
      "Копирование сделок",
      "Увеличенная нагрузка",
    ],
  },
};

/** Section headings (kept in one place to match the design wording). */
export const LABELS = {
  title: "Buy Forex VPS plans",
  datacenter: "DATA CENTER",
  pricePer: "PRICE PER:",
  terminals: "Terminals",
  features: "ВОЗМОЖНОСТИ",
  suitableFor: "ПОДХОДИТ ДЛЯ",
  buy: "КУПИТЬ",
  bestChoice: "BEST CHOICE",
};

export type FlagKey = "poland" | "netherlands" | "germany" | "usa" | null;

interface DatacenterDisplay {
  label: string;    // Short, human label shown on the switch.
  flag: FlagKey;    // Key resolved to an SVG flag component in the UI.
  order: number;    // Display order matching the design.
}

/**
 * Maps an upstream datacenter to its display label/flag by country prefix of
 * the short code (e.g. "PL-1" -> Poland). Unknown DCs fall back to their name.
 */
const DC_BY_PREFIX: Record<string, DatacenterDisplay> = {
  PL: { label: "Poland", flag: "poland", order: 1 },
  NL: { label: "Netherlands", flag: "netherlands", order: 2 },
  DE: { label: "Germany", flag: "germany", order: 3 },
  US: { label: "USA", flag: "usa", order: 4 },
};

export function datacenterDisplay(short: string, name: string): DatacenterDisplay {
  const prefix = short.split("-")[0]?.toUpperCase() ?? "";
  return DC_BY_PREFIX[prefix] ?? { label: name, flag: null, order: 99 };
}

/** Human label for a billing period, e.g. 1 -> "1 Month", 12 -> "1 Year". */
export function periodLabel(months: number): string {
  if (months === 12) return "1 Year";
  if (months % 12 === 0) return `${months / 12} Years`;
  return `${months} Month${months === 1 ? "" : "s"}`;
}

/** "per month" / "per year" style suffix shown next to the price. */
export function periodUnit(months: number): string {
  if (months === 1) return "month";
  if (months === 12) return "year";
  return `${months} months`;
}

const CURRENCY_SYMBOLS: Record<string, string> = { EUR: "€", USD: "$" };

export function formatPrice(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  return `${symbol} ${amount.toFixed(2)}`;
}
