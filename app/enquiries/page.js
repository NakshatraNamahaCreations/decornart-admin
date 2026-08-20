"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/AdminShell/AdminShell";
import { listEnquiries, deleteEnquiry } from "@/lib/api/admin";
import styles from "./enquiries.module.css";

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "contact", label: "Contact" },
  { value: "wholesale", label: "Wholesale" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "handled", label: "Handled" },
];

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EnquiriesListPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await listEnquiries({
        page,
        limit: 20,
        q: q || undefined,
        type,
        status,
      });
      setItems(data || []);
      setMeta(meta || { page, pages: 1, hasNext: false, hasPrev: page > 1 });
    } catch (e) {
      setError(e.message || "Could not load enquiries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 220);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, type, status]);

  const onDelete = async (enquiry) => {
    if (
      !window.confirm(
        `Delete enquiry from ${enquiry.name}? This cannot be undone.`
      )
    )
      return;
    setBusy(true);
    try {
      await deleteEnquiry(enquiry.id);
      setItems((prev) => prev.filter((e) => e.id !== enquiry.id));
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
          <span className={styles.eyebrow}>Inbox</span>
          <h1 className={styles.heading}>Enquiries</h1>
        </div>
      </header>

      <div className={styles.toolbar}>
        <input
          type="search"
          placeholder="Search name, email, phone or message…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className={styles.search}
        />
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className={styles.select}
        >
          {TYPE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className={styles.select}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>From</th>
              <th>Contact</th>
              <th>Message</th>
              <th>Type</th>
              <th>Status</th>
              <th>Received</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={styles.muted}>
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.muted}>
                  No enquiries yet.
                </td>
              </tr>
            ) : (
              items.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link
                      href={`/enquiries/${e.id}`}
                      className={styles.nameLink}
                    >
                      {e.name}
                    </Link>
                    {e.subject && (
                      <div className={styles.mute}>{e.subject}</div>
                    )}
                  </td>
                  <td>
                    <div>{e.email}</div>
                    {e.phone && <div className={styles.mute}>{e.phone}</div>}
                  </td>
                  <td>
                    <div className={styles.snippet}>{e.message}</div>
                  </td>
                  <td>
                    <span
                      className={`${styles.pill} ${
                        styles[`pill_${e.type}`] || ""
                      }`}
                    >
                      {e.type}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.pill} ${
                        styles[`pill_${e.status}`] || ""
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className={styles.mute}>{formatDate(e.createdAt)}</td>
                  <td className={styles.actionsCell}>
                    <Link
                      href={`/enquiries/${e.id}`}
                      className={styles.action}
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(e)}
                      disabled={busy}
                      className={`${styles.action} ${styles.actionDanger}`}
                    >
                      Delete
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
