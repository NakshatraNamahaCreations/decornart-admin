"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell/AdminShell";
import CategoryForm from "@/components/CategoryForm/CategoryForm";
import { createCategory } from "@/lib/api/admin";
import styles from "../categories.module.css";

export default function NewCategoryPage() {
  const router = useRouter();

  const onSubmit = async (payload) => {
    const created = await createCategory(payload);
    router.push(`/categories/${created.id}`);
  };

  return (
    <AdminShell>
      <Link href="/categories" className={styles.backLink}>← Back to categories</Link>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Catalog</span>
          <h1 className={styles.heading}>New category</h1>
        </div>
      </header>
      <CategoryForm
        submitLabel="Create category"
        onSubmit={onSubmit}
        onCancel={() => router.push("/categories")}
      />
    </AdminShell>
  );
}
