"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminShell from "@/components/AdminShell/AdminShell";
import {
  listDiyVideos,
  deleteDiyVideo,
  reorderDiyVideos,
} from "@/lib/api/admin";
import styles from "./diyVideos.module.css";

export default function DiyVideosListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listDiyVideos();
      setItems(data || []);
    } catch (e) {
      setError(e.message || "Could not load product videos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const move = async (id, dir) => {
    const idx = items.findIndex((v) => v.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    setItems(next);
    setBusy(true);
    try {
      await reorderDiyVideos(next.map((v) => v.id));
    } catch (e) {
      setError(e.message || "Could not save order.");
      load();
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (video) => {
    if (!window.confirm("Delete this product video?")) return;
    setBusy(true);
    try {
      await deleteDiyVideo(video.id);
      setItems((prev) => prev.filter((v) => v.id !== video.id));
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
          <span className={styles.eyebrow}>Content</span>
          <h1 className={styles.heading}>Product Showcase Videos</h1>
        </div>
        <Link href="/diy-videos/new" className={styles.cta}>
          + New video
        </Link>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : items.length === 0 ? (
        <p className={styles.muted}>
          No product videos yet.{" "}
          <Link href="/diy-videos/new" className={styles.inlineLink}>
            Add one →
          </Link>
        </p>
      ) : (
        <ul className={styles.list}>
          {items.map((v, i) => (
            <li key={v.id} className={styles.row}>
              <div className={styles.thumb}>
                {v.thumbnail ? (
                  <Image
                    src={v.thumbnail}
                    alt=""
                    fill
                    sizes="140px"
                    unoptimized
                  />
                ) : (
                  <div className={styles.thumbEmpty}>—</div>
                )}
              </div>
              <div className={styles.body}>
                <div className={styles.rowHead}>
                  <Link href={`/diy-videos/${v.id}`} className={styles.title}>
                    Product Video
                  </Link>
                  <span
                    className={`${styles.pill} ${
                      v.active ? styles.pill_active : styles.pill_inactive
                    }`}
                  >
                    {v.active ? "Active" : "Hidden"}
                  </span>
                </div>
                <p className={styles.meta}>→ {v.videoUrl}</p>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={() => move(v.id, -1)}
                  disabled={busy || i === 0}
                  className={styles.iconBtn}
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(v.id, 1)}
                  disabled={busy || i === items.length - 1}
                  className={styles.iconBtn}
                  aria-label="Move down"
                >
                  ▼
                </button>
                <Link
                  href={`/diy-videos/${v.id}`}
                  className={styles.action}
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => onDelete(v)}
                  disabled={busy}
                  className={`${styles.action} ${styles.actionDanger}`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
