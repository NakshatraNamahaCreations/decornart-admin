"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import styles from "./login.module.css";

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onChange = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form);
    } catch (err) {
      setError(err.message || "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.head}>
          <span className={styles.brand}>
            Decornart<span>.</span>
          </span>
          <span className={styles.tag}>Atelier console</span>
        </header>

        <h1 className={styles.heading}>Sign in</h1>
        

        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              className={styles.input}
              value={form.email}
              onChange={onChange("email")}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              className={styles.input}
              value={form.password}
              onChange={onChange("password")}
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in →"}
          </button>
        </form>
      </section>
    </main>
  );
}
