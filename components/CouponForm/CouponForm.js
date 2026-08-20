"use client";

import { useEffect, useState } from "react";
import { listCategories } from "@/lib/api/admin";
import styles from "./CouponForm.module.css";

const EMPTY = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: 10,
  maxDiscount: 0,
  minOrderValue: 0,
  usageLimit: 0,
  perUserLimit: 0,
  validFrom: "",
  validTo: "",
  categorySlugs: [],
  status: "active",
};

function toDateInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // yyyy-mm-dd for <input type="date">
  return d.toISOString().slice(0, 10);
}

function toFormState(initial) {
  if (!initial) return EMPTY;
  return {
    ...EMPTY,
    ...initial,
    discountValue: initial.discountValue ?? 0,
    maxDiscount: initial.maxDiscount ?? 0,
    minOrderValue: initial.minOrderValue ?? 0,
    usageLimit: initial.usageLimit ?? 0,
    perUserLimit: initial.perUserLimit ?? 0,
    categorySlugs: initial.categorySlugs || [],
    validFrom: toDateInput(initial.validFrom),
    validTo: toDateInput(initial.validTo),
  };
}

export default function CouponForm({ initial, submitLabel = "Save", onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toFormState(initial));
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listCategories()
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setCategories(data);
      })
      .catch(() => {
        /* silent */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const onText = (key) => (e) => update(key, e.target.value);
  const onNumber = (key) => (e) => update(key, e.target.value === "" ? "" : Number(e.target.value));

  const toggleCategory = (slug) => {
    setForm((p) => ({
      ...p,
      categorySlugs: p.categorySlugs.includes(slug)
        ? p.categorySlugs.filter((s) => s !== slug)
        : [...p.categorySlugs, slug],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue) || 0,
      maxDiscount: Number(form.maxDiscount) || 0,
      minOrderValue: Number(form.minOrderValue) || 0,
      usageLimit: Number(form.usageLimit) || 0,
      perUserLimit: Number(form.perUserLimit) || 0,
      validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : undefined,
      validTo: form.validTo ? new Date(form.validTo).toISOString() : null,
      categorySlugs: form.categorySlugs,
      status: form.status,
    };
    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      const detail = err.details
        ? ` — ${err.details.map((d) => d.message || d).join("; ")}`
        : "";
      setError(`${err.message || "Save failed."}${detail}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Code & discount</h2>
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Code<span className={styles.required}> *</span></span>
            <input
              type="text"
              required
              className={`${styles.input} ${styles.upperInput}`}
              value={form.code}
              onChange={(e) => update("code", e.target.value.toUpperCase())}
              placeholder="e.g. WELCOME10"
              maxLength={40}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Status</span>
            <select className={styles.input} value={form.status} onChange={onText("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Description (internal)</span>
          <input
            type="text"
            className={styles.input}
            value={form.description}
            onChange={onText("description")}
            placeholder="e.g. First-time buyer discount"
            maxLength={300}
          />
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Discount type<span className={styles.required}> *</span></span>
            <select className={styles.input} value={form.discountType} onChange={onText("discountType")}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed amount (₹)</option>
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>
              Discount value<span className={styles.required}> *</span>
              <span className={styles.hint}>
                {form.discountType === "percentage" ? " · 0–100%" : " · in ₹"}
              </span>
            </span>
            <input
              type="number"
              required
              min="0"
              step="1"
              max={form.discountType === "percentage" ? "100" : undefined}
              className={styles.input}
              value={form.discountValue}
              onChange={onNumber("discountValue")}
            />
          </label>
        </div>

        {form.discountType === "percentage" && (
          <label className={styles.field}>
            <span className={styles.label}>
              Max discount (₹)
              <span className={styles.hint}> · 0 = no cap</span>
            </span>
            <input
              type="number"
              min="0"
              step="1"
              className={styles.input}
              value={form.maxDiscount}
              onChange={onNumber("maxDiscount")}
            />
          </label>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Constraints</h2>
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>
              Min order value (₹)
              <span className={styles.hint}> · 0 = any</span>
            </span>
            <input
              type="number"
              min="0"
              step="1"
              className={styles.input}
              value={form.minOrderValue}
              onChange={onNumber("minOrderValue")}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>
              Total usage limit
              <span className={styles.hint}> · 0 = unlimited</span>
            </span>
            <input
              type="number"
              min="0"
              step="1"
              className={styles.input}
              value={form.usageLimit}
              onChange={onNumber("usageLimit")}
            />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>
              Per-user limit
              <span className={styles.hint}> · 0 = unlimited</span>
            </span>
            <input
              type="number"
              min="0"
              step="1"
              className={styles.input}
              value={form.perUserLimit}
              onChange={onNumber("perUserLimit")}
            />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Valid from</span>
            <input
              type="date"
              className={styles.input}
              value={form.validFrom}
              onChange={onText("validFrom")}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Valid to (expiry)</span>
            <input
              type="date"
              className={styles.input}
              value={form.validTo}
              onChange={onText("validTo")}
            />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Category scope
          <span className={styles.hint}>Leave all unchecked to apply to any cart</span>
        </h2>
        {categories.length === 0 ? (
          <p className={styles.muted}>Loading categories…</p>
        ) : (
          <div className={styles.chipRow}>
            {categories.map((c) => {
              const on = form.categorySlugs.includes(c.slug);
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => toggleCategory(c.slug)}
                  className={`${styles.chip} ${on ? styles.chipOn : ""}`}
                  aria-pressed={on}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <footer className={styles.footer}>
        {onCancel && (
          <button type="button" className={styles.ghost} onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </button>
      </footer>
    </form>
  );
}
