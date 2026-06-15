"use client";

import { useEffect, useRef, useState } from "react";
import type { Period } from "@/types/forex";
import { periodLabel } from "@/lib/content";
import { CalendarIcon, ChevronIcon } from "@/components/ui/icons";
import styles from "./PeriodSelect.module.scss";

interface Props {
  periods: Period[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

/** Custom accessible select (listbox pattern) matching the design's dropdown. */
export default function PeriodSelect({ periods, selectedKey, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = periods.find((p) => p.key === selectedKey) ?? periods[0];

  // Close when clicking outside or pressing Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.control} ${open ? styles.controlOpen : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <CalendarIcon className={styles.calendar} />
        <span className={styles.value}>
          {selected ? periodLabel(selected.months) : "—"}
        </span>
        <ChevronIcon
          className={`${styles.chevron} ${open ? styles.chevronUp : ""}`}
        />
      </button>

      {open && (
        <ul className={styles.menu} role="listbox" aria-label="Price per">
          {periods.map((period) => {
            const active = period.key === selectedKey;
            return (
              <li key={period.key} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`${styles.item} ${active ? styles.itemActive : ""}`}
                  onClick={() => {
                    onSelect(period.key);
                    setOpen(false);
                  }}
                >
                  {periodLabel(period.months)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
