"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell/AdminShell";
import DiyVideoForm from "@/components/DiyVideoForm/DiyVideoForm";
import { useToast } from "@/components/providers/ToastProvider";
import { createDiyVideo } from "@/lib/api/admin";
import styles from "../diyVideos.module.css";

export default function NewDiyVideoPage() {
  const router = useRouter();
  const toast = useToast();

  const onSubmit = async (payload) => {
    await createDiyVideo(payload);
    toast.success("Product video added");
    router.push("/diy-videos");
  };

  return (
    <AdminShell>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>
            <Link href="/diy-videos" className={styles.inlineLink}>
              Product Videos
            </Link>{" "}
            · New
          </span>
          <h1 className={styles.heading}>Add a product video</h1>
        </div>
      </header>

      <DiyVideoForm
        submitLabel="Create video"
        onSubmit={onSubmit}
        onCancel={() => router.push("/diy-videos")}
      />
    </AdminShell>
  );
}
