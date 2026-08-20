"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell/AdminShell";
import InstagramPostForm from "@/components/InstagramPostForm/InstagramPostForm";
import { useToast } from "@/components/providers/ToastProvider";
import { createInstagramPost } from "@/lib/api/admin";
import styles from "@/app/diy-videos/diyVideos.module.css";

export default function NewInstagramPostPage() {
  const router = useRouter();
  const toast = useToast();

  const onSubmit = async (payload) => {
    await createInstagramPost(payload);
    toast.success("Instagram post added");
    router.push("/instagram-posts");
  };

  return (
    <AdminShell>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>
            <Link href="/instagram-posts" className={styles.inlineLink}>
              Instagram Posts
            </Link>{" "}
            · New
          </span>
          <h1 className={styles.heading}>Add an Instagram post</h1>
        </div>
      </header>

      <InstagramPostForm
        submitLabel="Create post"
        onSubmit={onSubmit}
        onCancel={() => router.push("/instagram-posts")}
      />
    </AdminShell>
  );
}
