"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell/AdminShell";
import ProductForm from "@/components/ProductForm/ProductForm";
import { createProduct } from "@/lib/api/admin";
import styles from "../products.module.css";

export default function NewProductPage() {
  const router = useRouter();

  const onSubmit = async (payload) => {
    await createProduct(payload);
    router.push("/products");
  };

  return (
    <AdminShell>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>
            <Link href="/products" className={styles.inlineLink}>Products</Link> · New
          </span>
          <h1 className={styles.heading}>Add a product</h1>
        </div>
      </header>

      <ProductForm
        submitLabel="Create product"
        onSubmit={onSubmit}
        onCancel={() => router.push("/products")}
      />
    </AdminShell>
  );
}
