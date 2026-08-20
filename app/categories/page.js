"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminShell from "@/components/AdminShell/AdminShell";
import { listCategories, deleteCategory, reorderCategories } from "@/lib/api/admin";
import styles from "./categories.module.css";

export default function CategoriesListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listCategories();
      setItems(data || []);
    } catch (e) {
      setError(e.message || "Could not load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const move = async (id, dir) => {
    const idx = items.findIndex((c) => c.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    setItems(next);
    setBusy(true);
    try {
      await reorderCategories(next.map((c) => c.id));
    } catch (e) {
      setError(e.message || "Could not save order.");
      load(); // rollback view to server state on failure
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (cat) => {
    if (!window.confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteCategory(cat.id);
      setItems((prev) => prev.filter((c) => c.id !== cat.id));
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
          <span className={styles.eyebrow}>Catalog</span>
          <h1 className={styles.heading}>Categories</h1>
        </div>
        <Link href="/categories/new" className={styles.cta}>
          + New category
        </Link>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Slug</th>
              <th>Products</th>
              <th>Status</th>
              <th>Order</th>
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
                  No categories yet. <Link href="/categories/new" className={styles.inlineLink}>Add one →</Link>
                </td>
              </tr>
            ) : (
              items.map((c, i) => (
                <tr key={c.id}>
                  <td className={styles.thumbCell}>
                    {c.image || c.banner ? (
                      <div className={styles.thumb}>
                        <Image src={c.image || c.banner} alt="" fill sizes="48px" unoptimized />
                      </div>
                    ) : (
                      <div className={`${styles.thumb} ${styles.thumbEmpty}`}>–</div>
                    )}
                  </td>
                  <td>
                    <div className={styles.name}>{c.name}</div>
                    {c.description && (
                      <div className={styles.muteSmall}>{c.description}</div>
                    )}
                  </td>
                  <td className={styles.mono}>{c.slug}</td>
                  <td>{c.count}</td>
                  <td>
                    <span className={`${styles.pill} ${c.active ? styles.pill_active : styles.pill_inactive}`}>
                      {c.active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <button
                      type="button"
                      onClick={() => move(c.id, -1)}
                      disabled={busy || i === 0}
                      className={styles.iconBtn}
                      aria-label="Move up"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => move(c.id, 1)}
                      disabled={busy || i === items.length - 1}
                      className={styles.iconBtn}
                      aria-label="Move down"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </td>
                  <td className={styles.actionsCell}>
                    <Link href={`/categories/${c.id}`} className={styles.action}>Edit</Link>
                    <button
                      type="button"
                      onClick={() => onDelete(c)}
                      disabled={busy || c.count > 0}
                      title={c.count > 0 ? "Move products out of this category first" : ""}
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
    </AdminShell>
  );
}
