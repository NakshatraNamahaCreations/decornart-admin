"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminShell from "@/components/AdminShell/AdminShell";
import { deleteProduct, listProducts } from "@/lib/api/admin";
import styles from "./products.module.css";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

export default function ProductsListPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await listProducts({ page, limit: 10, q: q || undefined, status });
      setItems(data || []);
      setMeta(meta || { page, pages: 1, hasNext: false, hasPrev: page > 1 });
    } catch (e) {
      setError(e.message || "Could not load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 220);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, status]);

  const onDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setBusyId(product.id);
    try {
      await deleteProduct(product.id);
      setItems((prev) => prev.filter((p) => p.id !== product.id));
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
          <span className={styles.eyebrow}>Catalog</span>
          <h1 className={styles.heading}>Products</h1>
        </div>
        <Link href="/products/new" className={styles.cta}>
          + New product
        </Link>
      </header>

      <div className={styles.toolbar}>
        <input
          type="search"
          placeholder="Search by name or slug…"
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
              <th></th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
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
                  No products match. <Link href="/products/new" className={styles.inlineLink}>Add one →</Link>
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id}>
                  <td className={styles.thumbCell}>
                    {p.images?.[0] ? (
                      <div className={styles.thumb}>
                        <Image src={p.images[0]} alt="" fill sizes="48px" unoptimized />
                      </div>
                    ) : (
                      <div className={`${styles.thumb} ${styles.thumbEmpty}`}>–</div>
                    )}
                  </td>
                  <td>
                    <div className={styles.name}>{p.name}</div>
                    <div className={styles.slug}>/{p.slug}</div>
                  </td>
                  <td className={styles.cap}>{p.category}</td>
                  <td>{inr.format(p.price)}</td>
                  <td>
                    <span className={p.stock < 5 ? styles.stockLow : ""}>{p.stock}</span>
                  </td>
                  <td>
                    <span className={`${styles.pill} ${styles[`pill_${p.status}`] || ""}`}>{p.status}</span>
                  </td>
                  <td className={styles.actionsCell}>
                    <Link href={`/products/${p.id}`} className={styles.action}>Edit</Link>
                    <button
                      type="button"
                      onClick={() => onDelete(p)}
                      disabled={busyId === p.id}
                      className={`${styles.action} ${styles.actionDanger}`}
                    >
                      {busyId === p.id ? "…" : "Delete"}
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
          disabled={loading || !(meta?.hasNext ?? items.length >= 10)}
        >
          Next →
        </button>
      </div>
    </AdminShell>
  );
}
