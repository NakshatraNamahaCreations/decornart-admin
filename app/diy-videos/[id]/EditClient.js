"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell/AdminShell";
import DiyVideoForm from "@/components/DiyVideoForm/DiyVideoForm";
import { useToast } from "@/components/providers/ToastProvider";
import {
  deleteDiyVideo,
  getDiyVideo,
  updateDiyVideo,
} from "@/lib/api/admin";
import styles from "../diyVideos.module.css";

export default function EditDiyVideoPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const id = params?.id;

  const [video, setVideo] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const v = await getDiyVideo(id);
        if (cancelled) return;
        setVideo(v);
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
    await updateDiyVideo(id, payload);
    toast.success("Product video updated");
    router.push("/diy-videos");
  };

  const onDelete = async () => {
    if (!video) return;
    if (!window.confirm("Delete this product video?")) return;
    try {
      await deleteDiyVideo(id);
      router.push("/diy-videos");
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
              <Link href="/diy-videos" className={styles.inlineLink}>
                Product Videos
              </Link>
            </span>
            <h1 className={styles.heading}>Not found</h1>
          </div>
        </header>
        <p className={styles.muted}>This product video no longer exists.</p>
      </AdminShell>
    );
  }

  if (status === "error" || !video) {
    return (
      <AdminShell>
        <p className={styles.error}>Could not load this video. {error}</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>
            <Link href="/diy-videos" className={styles.inlineLink}>
              DIY Videos
            </Link>{" "}
            · Edit
          </span>
          <h1 className={styles.heading}>Edit Product Video</h1>
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

      <DiyVideoForm
        initial={video}
        submitLabel="Save changes"
        onSubmit={onSubmit}
        onCancel={() => router.push("/diy-videos")}
      />
    </AdminShell>
  );
}
