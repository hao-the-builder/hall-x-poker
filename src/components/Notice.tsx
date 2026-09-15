type Props = {
  kind?: "info" | "ok" | "warn" | "danger";
  children: React.ReactNode;
  role?: "status" | "alert";
};

export function Notice({ kind = "info", children, role }: Props) {
  const cls = kind === "info" ? "notice" : `notice notice--${kind}`;
  const r = role ?? (kind === "danger" ? "alert" : "status");
  return (
    <div className={cls} role={r}>
      {children}
    </div>
  );
}
