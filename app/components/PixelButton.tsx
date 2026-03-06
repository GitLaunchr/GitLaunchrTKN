import { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./PixelButton.module.css";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
}

export default function PixelButton({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled,
  className = "",
  ...rest
}: PixelButtonProps) {
  return (
    <button
      className={[
        styles.btn,
        styles[`btn--${variant}`],
        styles[`btn--${size}`],
        fullWidth ? styles["btn--full"] : "",
        loading ? styles["btn--loading"] : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className={styles.loadingDots}>
          <span>.</span><span>.</span><span>.</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
