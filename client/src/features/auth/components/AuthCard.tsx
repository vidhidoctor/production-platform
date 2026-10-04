import type { ReactNode } from "react";

/** Centered card used by login, sign up and password pages. */
export function AuthCard({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="card-body">
          <div className="brand">
            <img src="/favicon.svg" alt="" />
            Material Calc
          </div>
          <h1>{title}</h1>
          {children}
          {footer && <div className="muted">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
