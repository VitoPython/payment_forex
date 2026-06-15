"use client";

import { useState } from "react";
import type { Plan } from "@/types/forex";
import {
  LABELS,
  TIER_CONTENT,
  formatPrice,
  periodUnit,
} from "@/lib/content";
import Tooltip from "@/components/ui/Tooltip";
import {
  CartIcon,
  ChartMark,
  CheckIcon,
  ChevronIcon,
  InfoIcon,
} from "@/components/ui/icons";
import TerminalIcon from "@/icons/terminal_icon.svg";
import styles from "./PlanCard.module.scss";

interface Props {
  plan: Plan;
  periodKey: string;
  periodMonths: number;
}

export default function PlanCard({ plan, periodKey, periodMonths }: Props) {
  const [specsOpen, setSpecsOpen] = useState(false);
  const content = TIER_CONTENT[plan.tier];
  const bestChoice = content?.bestChoice ?? false;

  const price = plan.prices[periodKey];
  const { specs } = plan;

  // Carry the selected billing period through to the order page so the price
  // shown there matches what the user picked.
  const orderHref = `${plan.order_url}&period=${encodeURIComponent(periodKey)}`;

  // Condensed summary line shown on the always-visible spec pill.
  const summary = [
    specs.cpu && `${specs.cpu} CPU`,
    specs.ram && `${specs.ram} RAM`,
    specs.disk && `${specs.disk} NVMe`,
    specs.port,
  ]
    .filter(Boolean)
    .join(" · ");

  // Full parameter list revealed by the dropdown.
  const allSpecs: Array<[string, string | null]> = [
    ["CPU", specs.cpu],
    ["Memory", specs.ram],
    ["Disk space", specs.disk],
    ["Port speed", specs.port],
    ["Bandwidth", specs.bandwidth],
    ["Traffic volume", specs.traffic],
  ];

  return (
    <article
      className={`${styles.card} ${bestChoice ? styles.best : ""}`}
      aria-label={plan.name}
    >
      {bestChoice && <span className={styles.bestBadge}>{LABELS.bestChoice}</span>}

      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.name}>{plan.name}</h3>
          <span className={styles.mark} aria-hidden>
            <ChartMark />
          </span>
        </div>

        <div className={styles.price}>
          {price != null ? (
            <>
              <span className={styles.amount}>
                {formatPrice(price, plan.currency)}
              </span>
              <span className={styles.unit}>{periodUnit(periodMonths)}</span>
            </>
          ) : (
            <span className={styles.amount}>—</span>
          )}
        </div>

        {/* Spec summary pill — click to expand the full parameter dropdown. */}
        <div className={styles.specs}>
          <button
            type="button"
            className={styles.specSummary}
            aria-expanded={specsOpen}
            onClick={() => setSpecsOpen((v) => !v)}
          >
            <span className={styles.summaryText}>{summary}</span>
            <ChevronIcon
              className={`${styles.specChevron} ${specsOpen ? styles.specChevronUp : ""}`}
            />
          </button>

          {/* Always mounted so it can animate open AND closed (grid-rows trick). */}
          <div
            className={`${styles.specPanel} ${specsOpen ? styles.specPanelOpen : ""}`}
          >
            <div className={styles.specPanelInner}>
              <dl className={styles.specList}>
                {allSpecs
                  .filter(([, value]) => Boolean(value))
                  .map(([label, value]) => (
                    <div key={label} className={styles.specRow}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.terminals}>
        <span className={styles.terminalsLabel}>
          <TerminalIcon className={styles.terminalIcon} />
          {LABELS.terminals}
        </span>
        <span className={styles.terminalsValue}>
          {content?.terminals}
          {content && (
            <Tooltip label={content.terminalsHint}>
              <InfoIcon />
            </Tooltip>
          )}
        </span>
      </div>

      {content && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>{LABELS.features}</h4>
          <ul className={styles.features}>
            {content.features.map((feature) => (
              <li key={feature}>
                <CheckIcon className={styles.check} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {content && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>{LABELS.suitableFor}</h4>
          <ul className={styles.tags}>
            {content.suitableFor.map((tag) => (
              <li key={tag} className={styles.tag}>
                {tag}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles.actions}>
        <a
          className={styles.buy}
          href={orderHref}
          data-plan-id={plan.id}
          aria-label={`${LABELS.buy} — ${plan.name}`}
        >
          {LABELS.buy}
        </a>
        <a
          className={styles.cart}
          href={orderHref}
          aria-label={`Add ${plan.name} to cart`}
        >
          <CartIcon />
        </a>
      </div>
    </article>
  );
}
