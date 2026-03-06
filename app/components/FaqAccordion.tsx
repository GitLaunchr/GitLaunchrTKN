"use client";

import { useState } from "react";
import styles from "./FaqAccordion.module.css";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className={styles.accordion}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={`${styles.item} ${isOpen ? styles["item--open"] : ""}`}
          >
            <button
              className={styles.trigger}
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className={styles.triggerIcon}>
                {isOpen ? "▼" : "▶"}
              </span>
              <span className={styles.triggerText}>{item.q}</span>
            </button>

            <div
              className={styles.panel}
              style={{ maxHeight: isOpen ? "300px" : "0px" }}
            >
              <div className={styles.panelInner}>{item.a}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
