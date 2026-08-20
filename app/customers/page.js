"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaRegTrashAlt } from "react-icons/fa";
import AdminShell from "@/components/AdminShell/AdminShell";
import {
  listCustomers,
  setCustomerBlocked,
  deleteCustomer,
} from "@/lib/api/admin";
import styles from "./customers.module.css";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const STATUS_OPTIONS = [
  { value: "all", label: "All customers" },
  { value: "active", label: "Active" },
  { value: "blocked", label: "Blocked" },
];

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CustomersListPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await listCustomers({
        page,
        limit: 20,
        q: q || undefined,
        status,
      });
      setItems(data || []);
      setMeta(meta || { page, pages: 1, hasNext: false, hasPrev: page > 1 });
    } catch (e) {
      setError(e.message || "Could not load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 220);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, status]);

  const toggleBlock = async (customer) => {
    const next = !customer.blocked;
    const label = next ? "block" : "unblock";
    if (!window.confirm(`Are you sure you want to ${label} ${customer.name}?`)) return;
    setBusyId(customer.id);
    try {
      const updated = await setCustomerBlocked(customer.id, next);
      setItems((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, blocked: updated.blocked } : c))
      );
    } catch (e) {
      window.alert(e.message || `Could not ${label} customer.`);
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (customer) => {
    if (
      !window.confirm(
        `Delete ${customer.name}? Their order history will be preserved but the account will be removed permanently.`
      )
    ) {
      return;
    }
    setBusyId(customer.id);
    try {
      await deleteCustomer(customer.id);
      setItems((prev) => prev.filter((c) => c.id !== customer.id));
    } catch (e) {
      window.alert(e.message || "Could not delete customer.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>People</span>
          <h1 className={styles.heading}>Customers</h1>
        </div>
      </header>

      <div className={styles.toolbar}>
        <input
          type="search"
          placeholder="Search by name, email or phone…"
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
              <th>Customer</th>
              <th>Joined</th>
              <th>Orders</th>
              <th>Total spent</th>
              <th>Last order</th>
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
                <td colSpan={7} className={styles.muted}>No customers match.</td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className={styles.name}>
                      <Link href={`/customers/${c.id}`} className={styles.linkStrong}>{c.name}</Link>
                    </div>
                    <div className={styles.mute}>{c.email}</div>
                    {c.phone && <div className={styles.mute}>{c.phone}</div>}
                  </td>
                  <td className={styles.mute}>{formatDate(c.createdAt)}</td>
                  <td>{c.orderCount}</td>
                  <td>{inr.format(c.totalSpent || 0)}</td>
                  <td className={styles.mute}>{formatDate(c.lastOrderAt)}</td>
                  <td>
                    <span className={`${styles.pill} ${c.blocked ? styles.pill_blocked : styles.pill_active}`}>
                      {c.blocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <Link href={`/customers/${c.id}`} className={styles.action}>View</Link>
                    <button
                      type="button"
                      onClick={() => toggleBlock(c)}
                      disabled={busyId === c.id}
                      className={`${styles.action} ${c.blocked ? "" : styles.actionDanger}`}
                    >
                      {busyId === c.id ? "…" : c.blocked ? "Unblock" : "Block"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(c)}
                      disabled={busyId === c.id}
                      className={`${styles.action} ${styles.actionIcon} ${styles.actionDanger}`}
                      aria-label={`Delete ${c.name}`}
                      title="Delete customer"
                    >
                      <FaRegTrashAlt aria-hidden="true" />
                    </button>
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
