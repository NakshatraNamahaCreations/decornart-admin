"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminShell from "@/components/AdminShell/AdminShell";
import {
  listInstagramPosts,
  deleteInstagramPost,
  reorderInstagramPosts,
} from "@/lib/api/admin";
import styles from "@/app/diy-videos/diyVideos.module.css";

export default function InstagramPostsListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listInstagramPosts();
      setItems(data || []);
    } catch (e) {
      setError(e.message || "Could not load Instagram posts.");
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
      await reorderInstagramPosts(next.map((v) => v.id));
    } catch (e) {
      setError(e.message || "Could not save order.");
      load();
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (post) => {
    if (!window.confirm("Delete this Instagram post?")) return;
    setBusy(true);
    try {
      await deleteInstagramPost(post.id);
      setItems((prev) => prev.filter((v) => v.id !== post.id));
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
          <h1 className={styles.heading}>Instagram Posts</h1>
        </div>
        <Link href="/instagram-posts/new" className={styles.cta}>
          + New post
        </Link>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : items.length === 0 ? (
        <p className={styles.muted}>
          No Instagram posts yet.{" "}
          <Link href="/instagram-posts/new" className={styles.inlineLink}>
            Add one →
          </Link>
        </p>
      ) : (
        <ul className={styles.list}>
          {items.map((v, i) => (
            <li key={v.id} className={styles.row}>
              <div className={styles.thumb}>
                {v.image ? (
                  <Image
                    src={v.image}
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
                  <Link
                    href={`/instagram-posts/${v.id}`}
                    className={styles.title}
                  >
                    {v.alt || "Instagram post"}
                  </Link>
                  <span
                    className={`${styles.pill} ${
                      v.active ? styles.pill_active : styles.pill_inactive
                    }`}
                  >
                    {v.active ? "Active" : "Hidden"}
                  </span>
                </div>
                {v.link && <p className={styles.meta}>→ {v.link}</p>}
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
                  href={`/instagram-posts/${v.id}`}
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
