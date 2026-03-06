import { ReactNode } from "react";
import styles from "./PixelPanel.module.css";

interface PixelPanelProps {
  children: ReactNode;
  label?: string;
  variant?: "default" | "cyan" | "success" | "error" | "warning";
  className?: string;
  noPad?: boolean;
}

export default function PixelPanel({
  children,
  label,
  variant = "default",
  className = "",
  noPad = false,
}: PixelPanelProps) {
  return (
    <div
      className={[
        styles.panel,
        styles[`panel--${variant}`],
        noPad ? styles["panel--nopad"] : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label && (
        <span className={styles.label} aria-label={label}>
          {label}
        </span>
      )}
      <div className={noPad ? "" : styles.inner}>{children}</div>
    </div>
  );
}
