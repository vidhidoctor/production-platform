import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { ErrorAlert, Field } from "../../components/ui";
import { AuthCard } from "./components/AuthCard";
import { useForgotPassword } from "./auth.hooks";

export function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const [email, setEmail] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    forgot.mutate(email);
  }

  return (
    <AuthCard title="Forgot password" footer={<Link to="/login">Back to log in</Link>}>
      {forgot.isSuccess ? (
        <>
          <div className="alert alert-success">{forgot.data.message}</div>
          {/* No email service yet: in development the server hands back the reset token directly. */}
          {forgot.data.devResetToken && (
            <div className="alert alert-warning">
              Development mode: no email is sent.{" "}
              <Link to={`/reset-password?token=${encodeURIComponent(forgot.data.devResetToken)}`}>Reset the password now</Link>
            </div>
          )}
        </>
      ) : (
        <form className="stack" onSubmit={submit}>
          <ErrorAlert error={forgot.error} />
          <Field label="Email">
            <input className="input" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <button className="btn btn-primary" disabled={forgot.isPending}>
            Send reset link
          </button>
        </form>
      )}
    </AuthCard>
  );
}
