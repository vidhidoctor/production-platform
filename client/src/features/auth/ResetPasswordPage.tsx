import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { ErrorAlert, Field } from "../../components/ui";
import { AuthCard } from "./components/AuthCard";
import { useResetPassword } from "./auth.hooks";

export function ResetPasswordPage() {
  const reset = useResetPassword();
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = confirm.length > 0 && confirm !== password;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!mismatch) reset.mutate({ token, password });
  }

  return (
    <AuthCard title="Set a new password" footer={<Link to="/login">Back to log in</Link>}>
      {reset.isSuccess ? (
        <div className="alert alert-success">
          {reset.data.message} <Link to="/login">Log in</Link>
        </div>
      ) : (
        <form className="stack" onSubmit={submit}>
          <ErrorAlert error={reset.error} />
          {!params.get("token") && (
            <Field label="Reset token" hint="From the reset email.">
              <input className="input" required value={token} onChange={(e) => setToken(e.target.value)} />
            </Field>
          )}
          <Field label="New password" hint="At least 8 characters.">
            <input className="input" type="password" required minLength={8} autoFocus autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label="Confirm new password" hint={mismatch ? "Passwords do not match." : undefined}>
            <input className="input" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
          <button className="btn btn-primary" disabled={reset.isPending || mismatch}>
            Update password
          </button>
        </form>
      )}
    </AuthCard>
  );
}
