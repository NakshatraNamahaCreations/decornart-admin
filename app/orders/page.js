"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/AdminShell/AdminShell";
import { listOrders } from "@/lib/api/admin";
import styles from "./orders.module.css";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

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

export default function OrdersListPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await listOrders({
        page,
        limit: 20,
        q: q || undefined,
        status,
        paymentStatus,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setItems(data || []);
      setMeta(meta || { page, pages: 1, hasNext: false, hasPrev: page > 1 });
    } catch (e) {
      setError(e.message || "Could not load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 220);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, status, paymentStatus, dateFrom, dateTo]);

  const exportCsv = () => {
    if (!items.length) return;
    const headers = ["Order", "Date", "Customer", "Email", "Items", "Total", "Payment", "Status"];
    const rows = items.map((o) => [
      o.orderNumber,
      formatDate(o.createdAt),
      o.customer?.name || "",
      o.customer?.email || "",
      o.itemCount,
      o.total,
      o.paymentStatus || "",
      o.status,
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r
          .map((cell) => {
            const s = String(cell ?? "");
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Operations</span>
          <h1 className={styles.heading}>Orders</h1>
        </div>
        <button type="button" onClick={exportCsv} disabled={!items.length} className={styles.cta}>
          Export CSV
        </button>
      </header>

      <div className={styles.toolbar}>
        <input
          type="search"
          placeholder="Search order number or phone…"
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
        <select
          value={paymentStatus}
          onChange={(e) => {
            setPaymentStatus(e.target.value);
            setPage(1);
          }}
          className={styles.select}
        >
          {PAYMENT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          className={styles.select}
          aria-label="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          className={styles.select}
          aria-label="To date"
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className={styles.muted}>Loading…</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.muted}>No orders match.</td>
              </tr>
            ) : (
              items.map((o) => (
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
                  <td>{o.itemCount}</td>
                  <td>{inr.format(o.total)}</td>
                  <td>
                    <span className={`${styles.pill} ${styles[`pill_${o.paymentStatus || "none"}`] || ""}`}>
                      {o.paymentStatus || "—"}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.pill} ${styles[`pill_${o.status}`] || ""}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <Link href={`/orders/${o.id}`} className={styles.action}>Open</Link>
                  </td>
                </tr>
              ))
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
