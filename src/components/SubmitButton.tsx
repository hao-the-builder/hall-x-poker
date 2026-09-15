"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "quiet" | "danger";
  size?: "sm" | "md";
  block?: boolean;
  disabled?: boolean;
  name?: string;
  value?: string;
  ariaLabel?: string;
};

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  variant = "primary",
  size = "md",
  block = false,
  disabled = false,
  name,
  value,
  ariaLabel,
}: Props) {
  const { pending } = useFormStatus();
  const cls = ["btn", variant !== "secondary" ? `btn--${variant}` : "", size === "sm" ? "btn--sm" : "", block ? "btn--block" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="submit" className={cls} disabled={pending || disabled} aria-busy={pending} name={name} value={value} aria-label={ariaLabel}>
      {pending ? pendingLabel : children}
    </button>
  );
}
