"use client";

import type { FC, SVGProps } from "react";
import type { Datacenter } from "@/types/forex";
import { datacenterDisplay, type FlagKey } from "@/lib/content";
import FlagPoland from "@/icons/flag_poland.svg";
import FlagNetherlands from "@/icons/flag_netherlands.svg";
import FlagGermany from "@/icons/flag_germany.svg";
import FlagUsa from "@/icons/flag_usa.svg";
import styles from "./DatacenterSwitch.module.scss";

const FLAGS: Record<Exclude<FlagKey, null>, FC<SVGProps<SVGSVGElement>>> = {
  poland: FlagPoland,
  netherlands: FlagNetherlands,
  germany: FlagGermany,
  usa: FlagUsa,
};

interface Props {
  datacenters: Datacenter[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function DatacenterSwitch({
  datacenters,
  selectedId,
  onSelect,
}: Props) {
  return (
    <div
      className={styles.switch}
      role="radiogroup"
      aria-label="Data center"
    >
      {datacenters.map((dc) => {
        const display = datacenterDisplay(dc.short, dc.name);
        const Flag = display.flag ? FLAGS[display.flag] : null;
        const active = dc.id === selectedId;
        return (
          <button
            key={dc.id}
            type="button"
            role="radio"
            aria-checked={active}
            className={`${styles.option} ${active ? styles.active : ""}`}
            onClick={() => onSelect(dc.id)}
          >
            {Flag && (
              <span className={styles.flag} aria-hidden>
                <Flag />
              </span>
            )}
            <span>{display.label}</span>
          </button>
        );
      })}
    </div>
  );
}
