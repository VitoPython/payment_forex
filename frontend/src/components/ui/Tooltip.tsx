"use client";

import { useId, useState, type ReactNode } from "react";
import styles from "./Tooltip.module.scss";

interface TooltipProps {
  label: string;
  children: ReactNode;
}

/** Accessible hover/focus tooltip. The trigger wraps arbitrary children. */
export default function Tooltip({ label, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className={styles.wrapper}>
      <span
        className={styles.trigger}
        tabIndex={0}
        role="button"
        aria-describedby={id}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </span>
      <span
        id={id}
        role="tooltip"
        className={`${styles.bubble} ${open ? styles.open : ""}`}
      >
        {label}
      </span>
    </span>
  );
}
