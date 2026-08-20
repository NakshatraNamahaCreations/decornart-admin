"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/AdminShell/AdminShell";
import { listCoupons, deleteCoupon } from "@/lib/api/admin";
import styles from "./coupons.module.css";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDiscount(c) {
  if (c.discountType === "percentage") {
    return `${c.discountValue}%${c.maxDiscount ? ` up to ${inr.format(c.maxDiscount)}` : ""}`;
  }
  return inr.format(c.discountValue);
}

function expiryState(c) {
  if (!c.validTo) return { label: "No expiry", tone: "neutral" };
  const now = new Date();
  const end = new Date(c.validTo);
  if (Number.isNaN(end.getTime())) return { label: "No expiry", tone: "neutral" };
  if (end < now) return { label: `Expired ${formatDate(c.validTo)}`, tone: "bad" };
  return { label: `Until ${formatDate(c.validTo)}`, tone: "neutral" };
}

export default function CouponsListPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await listCoupons({
        page,
        limit: 20,
        q: q || undefined,
        status,
      });
      setItems(data || []);
      setMeta(meta || { page, pages: 1, hasNext: false, hasPrev: page > 1 });
    } catch (e) {
      setError(e.message || "Could not load coupons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 220);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, status]);

  const onDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteCoupon(coupon.id);
      setItems((prev) => prev.filter((c) => c.id !== coupon.id));
    } catch (e) {
      window.alert(e.message || "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Marketing</span>
          <h1 className={styles.heading}>Coupons</h1>
        </div>
        <Link href="/coupons/new" className={styles.cta}>+ New coupon</Link>
      </header>

      <div className={styles.toolbar}>
        <input
          type="search"
          placeholder="Search code or description…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className={styles.search}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className={styles.select}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Min order</th>
              <th>Usage</th>
              <th>Expiry</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={styles.muted}>Loading…</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.muted}>
                  No coupons match. <Link href="/coupons/new" className={styles.inlineLink}>Add one →</Link>
                </td>
              </tr>
            ) : (
              items.map((c) => {
                const exp = expiryState(c);
                return (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/coupons/${c.id}`} className={styles.code}>{c.code}</Link>
                      {c.description && (
                        <div className={styles.mute}>{c.description}</div>
                      )}
                    </td>
                    <td>{formatDiscount(c)}</td>
                    <td>{c.minOrderValue ? inr.format(c.minOrderValue) : "—"}</td>
                    <td>
                      {c.usageCount}
                      {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                    </td>
                    <td className={exp.tone === "bad" ? styles.expired : styles.mute}>
                      {exp.label}
                    </td>
                    <td>
                      <span className={`${styles.pill} ${styles[`pill_${c.status}`] || ""}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      <Link href={`/coupons/${c.id}`} className={styles.action}>Edit</Link>
                      <button
                        type="button"
                        onClick={() => onDelete(c)}
                        disabled={busy}
                        className={`${styles.action} ${styles.actionDanger}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pager}>
        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={loading || !(meta?.hasPrev ?? page > 1)}
        >
          ← Prev
        </button>
        <span className={styles.pageInfo}>
          Page {meta?.page || page}
          {meta?.pages ? ` of ${meta.pages}` : ""}
          {typeof meta?.total === "number" ? ` · ${meta.total} total` : ""}
        </span>
        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => setPage((p) => p + 1)}
          disabled={loading || !(meta?.hasNext ?? items.length >= 20)}
        >
          Next →
        </button>
      </div>
    </AdminShell>
  );
}
