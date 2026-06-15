"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import type { ForexCatalogue } from "@/types/forex";
import { fetchCatalogue } from "@/lib/api";
import { LABELS, datacenterDisplay } from "@/lib/content";
import DatacenterSwitch from "@/components/DatacenterSwitch/DatacenterSwitch";
import PeriodSelect from "@/components/PeriodSelect/PeriodSelect";
import PlanCard from "@/components/PlanCard/PlanCard";
import styles from "./ForexPlans.module.scss";

interface Props {
  /** Catalogue fetched on the server for instant first paint (SSR). */
  initialData: ForexCatalogue | null;
}

export default function ForexPlans({ initialData }: Props) {
  // SWR keeps the catalogue fresh on the client while reusing the SSR payload.
  const { data, error, isLoading } = useSWR<ForexCatalogue>(
    "forex-catalogue",
    fetchCatalogue,
    {
      fallbackData: initialData ?? undefined,
      revalidateOnFocus: false,
    },
  );

  const datacenters = useMemo(
    () =>
      (data?.datacenters ?? [])
        .slice()
        .sort(
          (a, b) =>
            datacenterDisplay(a.short, a.name).order -
            datacenterDisplay(b.short, b.name).order,
        ),
    [data],
  );
  const periods = data?.periods ?? [];

  // Selection is initialised from (and synced back to) the URL so it survives
  // navigation to the order page and back, refreshes and shared links.
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dcId, setDcId] = useState<string | null>(searchParams.get("dc"));
  const [periodKey, setPeriodKey] = useState<string | null>(
    searchParams.get("period"),
  );

  // Resolve current selection, defaulting to the first valid option. Kept
  // derived (not effect-synced) to avoid render flashes.
  const selectedDcId =
    dcId && datacenters.some((d) => d.id === dcId)
      ? dcId
      : datacenters[0]?.id ?? "";
  const selectedPeriodKey =
    periodKey && periods.some((p) => p.key === periodKey)
      ? periodKey
      : periods[0]?.key ?? "";
  const selectedPeriod = periods.find((p) => p.key === selectedPeriodKey);

  const syncUrl = useCallback(
    (dc: string, period: string) => {
      const params = new URLSearchParams();
      if (dc) params.set("dc", dc);
      if (period) params.set("period", period);
      router.replace(`/?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const handleSelectDc = useCallback(
    (id: string) => {
      setDcId(id);
      syncUrl(id, selectedPeriodKey);
    },
    [syncUrl, selectedPeriodKey],
  );

  const handleSelectPeriod = useCallback(
    (key: string) => {
      setPeriodKey(key);
      syncUrl(selectedDcId, key);
    },
    [syncUrl, selectedDcId],
  );

  const plans = useMemo(
    () =>
      (data?.plans ?? [])
        .filter((plan) => plan.datacenter_id === selectedDcId)
        .sort((a, b) => a.tier - b.tier),
    [data, selectedDcId],
  );

  return (
    <section className={styles.wrapper} aria-labelledby="forex-title">
      <h1 id="forex-title" className={styles.title}>
        {LABELS.title}
      </h1>

      <div className={styles.controls}>
        <div className={styles.control}>
          <span className={styles.controlLabel}>{LABELS.datacenter}</span>
          {datacenters.length > 0 && (
            <DatacenterSwitch
              datacenters={datacenters}
              selectedId={selectedDcId}
              onSelect={handleSelectDc}
            />
          )}
        </div>

        <div className={styles.control}>
          <span className={styles.controlLabel}>{LABELS.pricePer}</span>
          {periods.length > 0 && (
            <PeriodSelect
              periods={periods}
              selectedKey={selectedPeriodKey}
              onSelect={handleSelectPeriod}
            />
          )}
        </div>
      </div>

      {error && !data && (
        <p className={styles.message}>
          Не вдалося завантажити тарифи. Спробуйте оновити сторінку.
        </p>
      )}

      {isLoading && !data && <PlansSkeleton />}

      {data && plans.length === 0 && (
        <p className={styles.message}>
          Для вибраного дата-центру наразі немає доступних Forex-тарифів.
        </p>
      )}

      {plans.length > 0 && (
        <div className={styles.grid}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              periodKey={selectedPeriodKey}
              periodMonths={selectedPeriod?.months ?? 1}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PlansSkeleton() {
  return (
    <div className={styles.grid} aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={styles.skeleton} />
      ))}
    </div>
  );
}
