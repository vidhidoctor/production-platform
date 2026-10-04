// Small shared pieces: page header, form field, error alert, loading and access states.
import type { ReactNode } from "react";
import { ApiError } from "../api/client";

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div className="titles">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

export function Field({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

/** Shows an API error, including the list of problems the server sent (missing Name + Size, etc.). */
export function ErrorAlert({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : String(error);
  const details = error instanceof ApiError ? error.details : undefined;

  const items: string[] = [];
  if (Array.isArray(details)) {
    for (const d of details) if (d?.message && d.message !== message) items.push(d.message);
  } else if (details && typeof details === "object") {
    for (const v of Object.values(details)) if (Array.isArray(v)) items.push(...v.map(String));
  }

  return (
    <div className="alert alert-error" role="alert">
      {message}
      {items.length > 0 && (
        <ul>
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  /** Whole numbers only (stitch, laser, quantities). */
  integer?: boolean;
}

/**
 * Number field that cannot go negative: the minus key is blocked, pasted negatives are ignored,
 * and min=0 makes the browser refuse to submit one. The server checks again.
 */
export function NumberInput({ value, onChange, integer, className = "", ...rest }: NumberInputProps) {
  const blocked = integer ? ["-", "+", "e", "E", ".", ","] : ["-", "+", "e", "E"];
  return (
    <input
      {...rest}
      className={`input num ${className}`}
      type="number"
      inputMode={integer ? "numeric" : "decimal"}
      min={rest.min ?? 0}
      step={integer ? 1 : "any"}
      value={value}
      onKeyDown={(e) => blocked.includes(e.key) && e.preventDefault()}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "" || Number(v) >= 0) onChange(v);
      }}
    />
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <div className="loading">{label}</div>;
}

export function Forbidden() {
  return (
    <div className="card">
      <div className="card-body">
        <h2>No access</h2>
        <p className="muted">Your role does not include this page. Ask an Admin if you need it.</p>
      </div>
    </div>
  );
}

/** Loading / error / content for a query result. */
export function QueryState({ isPending, error, children }: { isPending: boolean; error: unknown; children: () => ReactNode }) {
  if (isPending) return <Loading />;
  if (error) return <ErrorAlert error={error} />;
  return <>{children()}</>;
}
