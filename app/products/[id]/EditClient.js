"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import AdminShell from "@/components/AdminShell/AdminShell";
import ProductForm from "@/components/ProductForm/ProductForm";
import { useToast } from "@/components/providers/ToastProvider";
import { deleteProduct, getProduct, updateProduct } from "@/lib/api/admin";
import styles from "../products.module.css";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const id = params?.id;

  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error | not-found
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const p = await getProduct(id);
        if (cancelled) return;
        setProduct(p);
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
    await updateProduct(id, payload);
    toast.success("Product added successfully");
    router.push("/products");
  };

  const onDelete = async () => {
    if (!product) return;
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(id);
      router.push("/products");
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
              <Link href="/products" className={styles.inlineLink}>Products</Link>
            </span>
            <h1 className={styles.heading}>Not found</h1>
          </div>
        </header>
        <p className={styles.muted}>This product no longer exists.</p>
      </AdminShell>
    );
  }

  if (status === "error" || !product) {
    return (
      <AdminShell>
        <p className={styles.error || ""}>Could not load this product. {error}</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>
            <Link href="/products" className={styles.inlineLink}>Products</Link> · Edit
          </span>
          <h1 className={styles.heading}>{product.name}</h1>
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

      <ProductForm
        initial={product}
        submitLabel="Save changes"
        onSubmit={onSubmit}
        onCancel={() => router.push("/products")}
      />
    </AdminShell>
  );
}
