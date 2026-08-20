"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell/AdminShell";
import InstagramPostForm from "@/components/InstagramPostForm/InstagramPostForm";
import { useToast } from "@/components/providers/ToastProvider";
import {
  deleteInstagramPost,
  getInstagramPost,
  updateInstagramPost,
} from "@/lib/api/admin";
import styles from "@/app/diy-videos/diyVideos.module.css";

export default function EditInstagramPostPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const id = params?.id;

  const [post, setPost] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const v = await getInstagramPost(id);
        if (cancelled) return;
        setPost(v);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        if (e.status === 404) setStatus("not-found");
        else {
          setError(e.message);
          setStatus("error");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onSubmit = async (payload) => {
    await updateInstagramPost(id, payload);
    toast.success("Instagram post updated");
    router.push("/instagram-posts");
  };

  const onDelete = async () => {
    if (!post) return;
    if (!window.confirm("Delete this Instagram post?")) return;
    try {
      await deleteInstagramPost(id);
      router.push("/instagram-posts");
    } catch (e) {
      window.alert(e.message || "Delete failed.");
    }
  };

  if (status === "loading") {
    return (
      <AdminShell>
        <p className={styles.muted}>Loading…</p>
      </AdminShell>
    );
  }

  if (status === "not-found") {
    return (
      <AdminShell>
        <header className={styles.head}>
          <div>
            <span className={styles.eyebrow}>
              <Link href="/instagram-posts" className={styles.inlineLink}>
                Instagram Posts
              </Link>
            </span>
            <h1 className={styles.heading}>Not found</h1>
          </div>
        </header>
        <p className={styles.muted}>This Instagram post no longer exists.</p>
      </AdminShell>
    );
  }

  if (status === "error" || !post) {
    return (
      <AdminShell>
        <p className={styles.error}>Could not load this post. {error}</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>
            <Link href="/instagram-posts" className={styles.inlineLink}>
              Instagram Posts
            </Link>{" "}
            · Edit
          </span>
          <h1 className={styles.heading}>Edit Instagram post</h1>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <button
            type="button"
            onClick={onDelete}
            className={`${styles.action} ${styles.actionDanger}`}
            style={{ padding: "0.6rem 0.9rem" }}
          >
            Delete
          </button>
        </div>
      </header>

      <InstagramPostForm
        initial={post}
        submitLabel="Save changes"
        onSubmit={onSubmit}
        onCancel={() => router.push("/instagram-posts")}
      />
    </AdminShell>
  );
}
