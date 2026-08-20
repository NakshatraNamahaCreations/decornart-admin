"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell/AdminShell";
import {
  listShippingRules,
  createShippingRule,
  updateShippingRule,
  deleteShippingRule,
} from "@/lib/api/admin";
import styles from "./shipping.module.css";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const EMPTY = {
  name: "",
  pincodePrefix: "",
  state: "",
  charge: 0,
  freeShippingThreshold: 0,
  estimatedDaysMin: 3,
  estimatedDaysMax: 7,
  codAvailable: true,
  priority: 0,
  active: true,
};

export default function ShippingPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Inline "new rule" form state
  const [form, setForm] = useState(EMPTY);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listShippingRules();
      setRules(data || []);
    } catch (e) {
      setError(e.message || "Could not load shipping rules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const payload = {
        ...form,
        charge: Number(form.charge) || 0,
        freeShippingThreshold: Number(form.freeShippingThreshold) || 0,
        estimatedDaysMin: Number(form.estimatedDaysMin) || 0,
        estimatedDaysMax: Number(form.estimatedDaysMax) || 0,
        priority: Number(form.priority) || 0,
      };
      const created = await createShippingRule(payload);
      setRules((prev) => [created, ...prev]);
      setForm(EMPTY);
    } catch (e) {
      const detail = e.details ? ` — ${e.details.map((d) => d.message || d).join("; ")}` : "";
      setError(`${e.message || "Create failed."}${detail}`);
    } finally {
      setCreating(false);
    }
  };

  const saveRule = async (rule, patch) => {
    setBusyId(rule.id);
    setError("");
    try {
      const updated = await updateShippingRule(rule.id, patch);
      setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
    } catch (e) {
      setError(e.message || "Update failed.");
      load();
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (rule) => {
    if (!window.confirm(`Delete rule "${rule.name}"?`)) return;
    setBusyId(rule.id);
    try {
      await deleteShippingRule(rule.id);
      setRules((prev) => prev.filter((r) => r.id !== rule.id));
    } catch (e) {
      window.alert(e.message || "Delete failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Platform</span>
          <h1 className={styles.heading}>Shipping rules</h1>
          <p className={styles.muted}>
            Empty pincode prefix acts as a fallback. Longer prefixes win; ties broken by higher priority.
            When no rule matches, checkout uses the defaults from <a href="/settings" className={styles.inlineLink}>Settings</a>.
          </p>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Add rule</h2>
        <form className={styles.createForm} onSubmit={onCreate}>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.label}>Name</span>
              <input
                type="text"
                required
                className={styles.input}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Bengaluru metro"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Pincode prefix</span>
              <input
                type="text"
                className={styles.input}
                value={form.pincodePrefix}
                onChange={(e) =>
                  setForm((p) => ({ ...p, pincodePrefix: e.target.value.replace(/\D/g, "").slice(0, 6) }))
                }
                placeholder="e.g. 560"
                maxLength={6}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>State (label)</span>
              <input
                type="text"
                className={styles.input}
                value={form.state}
                onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                placeholder="e.g. Karnataka"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Charge (₹)</span>
              <input
                type="number"
                required
                min="0"
                className={styles.input}
                value={form.charge}
                onChange={(e) => setForm((p) => ({ ...p, charge: e.target.value }))}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Free ship over (₹)</span>
              <input
                type="number"
                min="0"
                className={styles.input}
                value={form.freeShippingThreshold}
                onChange={(e) => setForm((p) => ({ ...p, freeShippingThreshold: e.target.value }))}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Est. days min</span>
              <input
                type="number"
                min="0"
                className={styles.input}
                value={form.estimatedDaysMin}
                onChange={(e) => setForm((p) => ({ ...p, estimatedDaysMin: e.target.value }))}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Est. days max</span>
              <input
                type="number"
                min="0"
                className={styles.input}
                value={form.estimatedDaysMax}
                onChange={(e) => setForm((p) => ({ ...p, estimatedDaysMax: e.target.value }))}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Priority</span>
              <input
                type="number"
                min="0"
                className={styles.input}
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
              />
            </label>
          </div>
          <div className={styles.toggleRow}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={!!form.codAvailable}
                onChange={(e) => setForm((p) => ({ ...p, codAvailable: e.target.checked }))}
              />
              <span>COD available</span>
            </label>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={!!form.active}
                onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
              />
              <span>Active</span>
            </label>
            <button type="submit" className={styles.submit} disabled={creating}>
              {creating ? "Adding…" : "+ Add rule"}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>All rules</h2>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rules.length === 0 ? (
          <p className={styles.muted}>No shipping rules yet. Add one above to override the defaults.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Prefix</th>
                  <th>State</th>
                  <th>Charge</th>
                  <th>Free over</th>
                  <th>Days</th>
                  <th>COD</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id}>
                    <td className={styles.name}>{r.name}</td>
                    <td className={styles.mono}>{r.pincodePrefix || "—"}</td>
                    <td className={styles.mute}>{r.state || "—"}</td>
                    <td>{inr.format(r.charge)}</td>
                    <td>{r.freeShippingThreshold ? inr.format(r.freeShippingThreshold) : "—"}</td>
                    <td className={styles.mute}>{r.estimatedDaysMin}–{r.estimatedDaysMax}</td>
                    <td>
                      <span className={r.codAvailable ? styles.yes : styles.no}>
                        {r.codAvailable ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className={styles.mute}>{r.priority}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => saveRule(r, { active: !r.active })}
                        disabled={busyId === r.id}
                        className={`${styles.pill} ${r.active ? styles.pill_active : styles.pill_inactive}`}
                        title="Click to toggle"
                      >
                        {r.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className={styles.actionsCell}>
                      <button
                        type="button"
                        onClick={() => onDelete(r)}
                        disabled={busyId === r.id}
                        className={`${styles.action} ${styles.actionDanger}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
