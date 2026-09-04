"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell/AdminShell";
import CategoryForm from "@/components/CategoryForm/CategoryForm";
import { getCategory, updateCategory, deleteCategory } from "@/lib/api/admin";
import styles from "../categories.module.css";

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getCategory(id);
        if (!cancelled) setInitial(data);
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load category.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onSubmit = async (payload) => {
    const updated = await updateCategory(id, payload);
    setInitial(updated);
  };

  const onDelete = async () => {
    if (!initial) return;
    if (!window.confirm(`Delete "${initial.name}"? This cannot be undone.`)) return;
    try {
      await deleteCategory(id);
      router.push("/categories");
    } catch (e) {
      window.alert(e.message || "Delete failed.");
    }
  };

  return (
    <AdminShell>
      <Link href="/categories" className={styles.backLink}>← Back to categories</Link>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Catalog</span>
          <h1 className={styles.heading}>
            {loading ? "Loading…" : initial?.name || "Category"}
          </h1>
          {initial && (
            <p className={styles.muteSmall} style={{ marginTop: "0.4rem" }}>
              {initial.count} product{initial.count === 1 ? "" : "s"} in this category
            </p>
          )}
        </div>
        {initial && (
          <button
            type="button"
            onClick={onDelete}
            disabled={initial.count > 0}
            title={initial.count > 0 ? "Move products out of this category first" : ""}
            className={`${styles.action} ${styles.actionDanger}`}
          >
            Delete category
          </button>
        )}
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {!loading && initial && (
        <CategoryForm
          initial={initial}
          submitLabel="Save changes"
          onSubmit={onSubmit}
          onCancel={() => router.push("/categories")}
        />
      )}
    </AdminShell>
  );
}
