"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell/AdminShell";
import BannerForm from "@/components/BannerForm/BannerForm";
import { useToast } from "@/components/providers/ToastProvider";
import { getBanner, updateBanner, deleteBanner } from "@/lib/api/admin";
import styles from "../banners.module.css";

export default function EditBannerPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
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
        const data = await getBanner(id);
        if (!cancelled) setInitial(data);
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load banner.");
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
    await updateBanner(id, payload);
    toast.success("Banner updated successfully");
    router.push("/banners");
  };

  const onDelete = async () => {
    if (!initial) return;
    if (!window.confirm(`Delete "${initial.title || "this banner"}"?`)) return;
    try {
      await deleteBanner(id);
      toast.success("Banner deleted");
      router.push("/banners");
    } catch (e) {
      toast.error(e.message || "Delete failed.");
    }
  };

  return (
    <AdminShell>
      <Link href="/banners" className={styles.backLink}>← Back to banners</Link>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Content</span>
          <h1 className={styles.heading}>
            {loading ? "Loading…" : initial?.title || "Banner"}
          </h1>
        </div>
        {initial && (
          <button
            type="button"
            onClick={onDelete}
            className={`${styles.action} ${styles.actionDanger}`}
          >
            Delete banner
          </button>
        )}
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {initial && (
        <BannerForm
          initial={initial}
          submitLabel="Save changes"
          onSubmit={onSubmit}
          onCancel={() => router.push("/banners")}
        />
      )}
    </AdminShell>
  );
}
