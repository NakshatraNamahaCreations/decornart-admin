"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell/AdminShell";
import BannerForm from "@/components/BannerForm/BannerForm";
import { useToast } from "@/components/providers/ToastProvider";
import { createBanner } from "@/lib/api/admin";
import styles from "../banners.module.css";

export default function NewBannerPage() {
  const router = useRouter();
  const toast = useToast();

  const onSubmit = async (payload) => {
    await createBanner(payload);
    // Toast lives in the root ToastProvider so it survives the navigation
    // and is still visible on /banners.
    toast.success("Banner created successfully");
    router.push("/banners");
  };

  return (
    <AdminShell>
      <Link href="/banners" className={styles.backLink}>← Back to banners</Link>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Content</span>
          <h1 className={styles.heading}>New banner</h1>
        </div>
      </header>
      <BannerForm
        submitLabel="Create banner"
        onSubmit={onSubmit}
        onCancel={() => router.push("/banners")}
      />
    </AdminShell>
  );
}
