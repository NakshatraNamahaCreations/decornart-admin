"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/AdminShell/AdminShell";
import { getDashboard } from "@/lib/api/admin";
import styles from "./dashboard.module.css";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const d = await getDashboard();
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load the dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminShell>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Overview</span>
          <h1 className={styles.heading}>Dashboard</h1>
        </div>
        <Link href="/products/new" className={styles.cta}>
          + New product
        </Link>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.cards}>
        <Stat label="Products" value={data?.counts?.products} sub={`${data?.counts?.activeProducts ?? "—"} active`} loading={loading} />
        <Stat label="Low stock" value={data?.counts?.lowStock} sub="< 5 units left" tone={data?.counts?.lowStock > 0 ? "warn" : "neutral"} loading={loading} />
        <Stat label="Customers" value={data?.counts?.users} sub="registered accounts" loading={loading} />
        <Stat label="Orders" value={data?.counts?.orders} sub={`${data?.counts?.recentOrders ?? 0} in last 30 days`} loading={loading} />
        <Stat
          label="Revenue (paid)"
          value={data ? inr.format(data.revenue?.lifetimePaid || 0) : null}
          sub="lifetime"
          loading={loading}
          big
        />
      </section>

      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Recent orders</h2>
        </header>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : data?.recentOrders?.length ? (
          <ul className={styles.orderList}>
            {data.recentOrders.map((o) => (
              <li key={o.id} className={styles.orderRow}>
                <div className={styles.orderMain}>
                  <span className={styles.orderNumber}>#{o.orderNumber}</span>
                  <span className={styles.orderDate}>{formatDate(o.createdAt)}</span>
                </div>
                <span className={styles.orderTotal}>{inr.format(o.total)}</span>
                <span className={`${styles.pill} ${styles[`pill_${o.paymentStatus || "none"}`] || ""}`}>
                  {o.paymentStatus || "—"}
                </span>
                <span className={`${styles.pill} ${styles[`pill_${o.status || "none"}`] || ""}`}>
                  {o.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>No orders yet.</p>
        )}
      </section>
    </AdminShell>
  );
}

function Stat({ label, value, sub, tone = "neutral", loading = false, big = false }) {
  return (
    <article className={`${styles.stat} ${big ? styles.statBig : ""} ${styles[`tone_${tone}`] || ""}`}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>
        {loading ? "…" : value ?? "—"}
      </span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </article>
  );
}
