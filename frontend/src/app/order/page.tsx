import Link from "next/link";
import { fetchCatalogueServer } from "@/lib/api";
import { formatPrice, periodUnit } from "@/lib/content";
import type { ForexCatalogue, Plan } from "@/types/forex";
import styles from "./order.module.scss";

interface Props {
  searchParams: { plan?: string; period?: string };
}

// The buy links carry the plan's unique key and the selected billing period
// (the real order flow is out of scope) — this page resolves them to a summary.
export default async function OrderPage({ searchParams }: Props) {
  const planKey = searchParams.plan ?? "";
  const periodKey = searchParams.period ?? "1";

  let catalogue: ForexCatalogue | null = null;
  try {
    catalogue = await fetchCatalogueServer();
  } catch {
    catalogue = null;
  }

  const plan: Plan | undefined = catalogue?.plans.find((p) => p.key === planKey);

  // Resolve the selected period; fall back to monthly if it's unavailable.
  const periodMonths = Number(periodKey) || 1;
  const periodPrice = plan
    ? plan.prices[periodKey] ?? plan.prices["1"] ?? 0
    : 0;

  // Preserve the chosen datacenter and period when returning to the catalogue.
  const backParams = new URLSearchParams();
  if (plan?.datacenter_id) backParams.set("dc", plan.datacenter_id);
  if (periodKey) backParams.set("period", periodKey);
  const backHref = `/?${backParams.toString()}`;

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <Link href={backHref} className={styles.back}>
          ← Назад к тарифам
        </Link>

        {plan ? (
          <>
            <span className={styles.badge}>Оформление заказа</span>
            <h1 className={styles.title}>{plan.name}</h1>
            <dl className={styles.summary}>
              <div>
                <dt>ID тарифа</dt>
                <dd>{plan.key}</dd>
              </div>
              <div>
                <dt>Дата-центр</dt>
                <dd>{plan.datacenter_id}</dd>
              </div>
              <div>
                <dt>Цена</dt>
                <dd>
                  {formatPrice(periodPrice, plan.currency)} /{" "}
                  {periodUnit(periodMonths)}
                </dd>
              </div>
            </dl>
            <p className={styles.note}>
              Это демонстрационная страница. Уникальный идентификатор тарифа
              передан через ссылку: <code>{planKey}</code>.
            </p>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Тариф не найден</h1>
            <p className={styles.note}>
              {planKey
                ? `Тариф с идентификатором «${planKey}» отсутствует в каталоге.`
                : "В ссылке не указан идентификатор тарифа."}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
