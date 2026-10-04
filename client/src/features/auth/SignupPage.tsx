import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { ErrorAlert, Field } from "../../components/ui";
import { AuthCard } from "./components/AuthCard";
import { useSignup } from "./auth.hooks";

export function SignupPage() {
  const signup = useSignup();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  function submit(e: FormEvent) {
    e.preventDefault();
    signup.mutate(form);
  }

  if (signup.isSuccess) {
    return (
      <AuthCard title="Account created" footer={<Link to="/login">Back to log in</Link>}>
        <div className="alert alert-success">{signup.data.message}</div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create an account"
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form className="stack" onSubmit={submit}>
        <ErrorAlert error={signup.error} />
        <Field label="Full name">
          <input className="input" required autoFocus autoComplete="name" value={form.name} onChange={set("name")} />
        </Field>
        <Field label="Email">
          <input className="input" type="email" required autoComplete="email" value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <input className="input" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={set("password")} />
        </Field>
        <button className="btn btn-primary" disabled={signup.isPending}>
          {signup.isPending ? "Creating…" : "Create account"}
        </button>
        <p className="muted" style={{ margin: 0 }}>
          An Admin will assign your department and role before you can log in.
        </p>
      </form>
    </AuthCard>
  );
}
