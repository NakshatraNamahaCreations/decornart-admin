"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell/AdminShell";
import { getSettings, updateSettings } from "@/lib/api/admin";
import styles from "./settings.module.css";

// Only the checkout / shipping block is edited here now. Other settings
// (store, currency, tax, payment, socials) still live in the backend but
// are managed elsewhere or via defaults — the admin form no longer
// exposes them.
const EMPTY = {
  checkout: {
    defaultShippingCharge: 99,
    freeShippingThreshold: 999,
    expressShippingCharge: 150,
    sameDayShippingCharge: 250,
    codEnabled: true,
  },
};

function toFormState(s) {
  if (!s) return EMPTY;
  return {
    checkout: { ...EMPTY.checkout, ...(s.checkout || {}) },
  };
}

export default function SettingsPage() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getSettings();
        if (!cancelled) setForm(toFormState(data));
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (section, key, value) =>
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));

  const onNumber = (section, key) => (e) =>
    set(section, key, e.target.value === "" ? "" : Number(e.target.value));
  const onCheck = (section, key) => (e) => set(section, key, e.target.checked);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");
    setSaving(true);
    try {
      // Send only the checkout section — the backend's `settingsUpdate`
      // schema treats every top-level key as optional, so untouched
      // sections keep their existing values.
      const payload = {
        checkout: {
          defaultShippingCharge: Number(form.checkout.defaultShippingCharge) || 0,
          freeShippingThreshold: Number(form.checkout.freeShippingThreshold) || 0,
          expressShippingCharge: Number(form.checkout.expressShippingCharge) || 0,
          sameDayShippingCharge: Number(form.checkout.sameDayShippingCharge) || 0,
          codEnabled: !!form.checkout.codEnabled,
        },
      };
      const saved = await updateSettings(payload);
      setForm(toFormState(saved));
      setStatus("Settings saved.");
      setTimeout(() => setStatus(""), 2400);
    } catch (e) {
      const detail = e.details
        ? ` — ${e.details.map((d) => d.message || d).join("; ")}`
        : "";
      setError(`${e.message || "Save failed."}${detail}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Platform</span>
          <h1 className={styles.heading}>Shipping Settings</h1>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}
      {status && <p className={styles.success}>{status}</p>}

      {loading ? (
        <p className={styles.muted}>Loading settings…</p>
      ) : (
        <form className={styles.form} onSubmit={submit}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Shipping
              <span className={styles.hint}>
                Overridden by pincode-based shipping rules when they match
              </span>
            </h2>
            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.label}>Default shipping (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={styles.input}
                  value={form.checkout.defaultShippingCharge}
                  onChange={onNumber("checkout", "defaultShippingCharge")}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Free shipping over (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={styles.input}
                  value={form.checkout.freeShippingThreshold}
                  onChange={onNumber("checkout", "freeShippingThreshold")}
                />
              </label>
            </div>
            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.label}>Express shipping (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={styles.input}
                  value={form.checkout.expressShippingCharge}
                  onChange={onNumber("checkout", "expressShippingCharge")}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Same-day delivery (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={styles.input}
                  value={form.checkout.sameDayShippingCharge}
                  onChange={onNumber("checkout", "sameDayShippingCharge")}
                />
              </label>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={!!form.checkout.codEnabled}
                onChange={onCheck("checkout", "codEnabled")}
              />
              <span>Cash on delivery available at checkout</span>
            </label>
          </section>

          <footer className={styles.footer}>
            <button
              type="submit"
              className={styles.submit}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
          </footer>
        </form>
      )}
    </AdminShell>
  );
}
