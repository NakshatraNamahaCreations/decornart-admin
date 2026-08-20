"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/AdminShell/AdminShell";
import { getPaymentsSummary, listOrders, refundOrder } from "@/lib/api/admin";
import styles from "./payments.module.css";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const PAYMENT_OPTIONS = [
  { value: "all", label: "All payments" },
  { value: "created", label: "Created" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PaymentsPage() {
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [sum, listing] = await Promise.all([
        getPaymentsSummary({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
        listOrders({
          page: 1,
          limit: 30,
          q: q || undefined,
          status: "all",
          paymentStatus,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        }),
      ]);
      setSummary(sum);
      setOrders(listing.data || []);
    } catch (e) {
      setError(e.message || "Could not load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 240);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, paymentStatus, q]);

  const doRefund = async (order) => {
    const note = window.prompt(`Refund order #${order.orderNumber}?\n\nOptional note (e.g. reference id, reason):`);
    if (note === null) return; // cancelled
    setBusyId(order.id);
    try {
      const updated = await refundOrder(order.id, { note: note.trim() || undefined });
      // Update the row locally with new payment status.
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, paymentStatus: updated.payment?.status } : o))
      );
      // Re-pull the summary since totals shifted.
      const sum = await getPaymentsSummary({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
      setSummary(sum);
    } catch (e) {
      window.alert(e.message || "Refund failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Platform</span>
          <h1 className={styles.heading}>Payments</h1>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.filters}>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className={styles.select}
          aria-label="From"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className={styles.select}
          aria-label="To"
        />
        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          className={styles.select}
        >
          {PAYMENT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Order number or phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={styles.search}
        />
      </section>

      <section className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Gross revenue</span>
          <span className={styles.statValue}>
            {summary ? inr.format(summary.revenue.gross || 0) : "…"}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Refunded</span>
          <span className={`${styles.statValue} ${styles.bad}`}>
            {summary ? `− ${inr.format(summary.revenue.refunded || 0)}` : "…"}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Net</span>
          <span className={styles.statValue}>
            {summary ? inr.format(summary.revenue.net || 0) : "…"}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Paid</span>
          <span className={styles.statValue}>{summary?.counts.paid ?? "…"}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Failed</span>
          <span className={styles.statValue}>{summary?.counts.failed ?? "…"}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Refunded (count)</span>
          <span className={styles.statValue}>{summary?.counts.refunded ?? "…"}</span>
        </div>
      </section>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className={styles.muted}>Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className={styles.muted}>No transactions match.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/orders/${o.id}`} className={styles.linkStrong}>
                      #{o.orderNumber}
                    </Link>
                  </td>
                  <td className={styles.mute}>{formatDate(o.createdAt)}</td>
                  <td>
                    {o.customer ? (
                      <div>
                        <div className={styles.name}>{o.customer.name}</div>
                        <div className={styles.mute}>{o.customer.email}</div>
                      </div>
                    ) : (
                      <span className={styles.mute}>—</span>
                    )}
                  </td>
                  <td>{inr.format(o.total)}</td>
                  <td>
                    <span className={`${styles.pill} ${styles[`pill_${o.paymentStatus || "none"}`] || ""}`}>
                      {o.paymentStatus || "—"}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <Link href={`/orders/${o.id}`} className={styles.action}>Open</Link>
                    {o.paymentStatus === "paid" && (
                      <button
                        type="button"
                        onClick={() => doRefund(o)}
                        disabled={busyId === o.id}
                        className={`${styles.action} ${styles.actionDanger}`}
                      >
                        {busyId === o.id ? "…" : "Refund"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
