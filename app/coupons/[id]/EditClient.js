"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell/AdminShell";
import CouponForm from "@/components/CouponForm/CouponForm";
import { useToast } from "@/components/providers/ToastProvider";
import { getCoupon, updateCoupon, deleteCoupon } from "@/lib/api/admin";
import styles from "../coupons.module.css";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function EditCouponPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const id = params?.id;
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getCoupon(id);
        if (!cancelled) setInitial(data);
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load coupon.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onSubmit = async (payload) => {
    await updateCoupon(id, payload);
    toast.success("Coupon added successfully");
    router.push("/coupons");
  };

  const onDelete = async () => {
    if (!initial) return;
    if (!window.confirm(`Delete coupon ${initial.code}?`)) return;
    try {
      await deleteCoupon(id);
      router.push("/coupons");
    } catch (e) {
      window.alert(e.message || "Delete failed.");
    }
  };

  return (
    <AdminShell>
      <Link href="/coupons" className={styles.backLink}>← Back to coupons</Link>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Marketing</span>
          <h1 className={styles.heading}>
            {loading ? "Loading…" : initial?.code || "Coupon"}
          </h1>
        </div>
        {initial && (
          <button
            type="button"
            onClick={onDelete}
            className={`${styles.action} ${styles.actionDanger}`}
          >
            Delete coupon
          </button>
        )}
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {initial && (
        <>
          <section className={styles.detailStats}>
            <div className={styles.detailStat}>
              <span className={styles.detailStatLabel}>Redemptions</span>
              <span className={styles.detailStatValue}>
                {initial.usageCount}
                {initial.usageLimit ? ` / ${initial.usageLimit}` : ""}
              </span>
            </div>
            <div className={styles.detailStat}>
              <span className={styles.detailStatLabel}>Verified (paid)</span>
              <span className={styles.detailStatValue}>
                {typeof initial.actualUsage === "number" ? initial.actualUsage : "—"}
              </span>
            </div>
            <div className={styles.detailStat}>
              <span className={styles.detailStatLabel}>Min order</span>
              <span className={styles.detailStatValue}>
                {initial.minOrderValue ? inr.format(initial.minOrderValue) : "—"}
              </span>
            </div>
          </section>

          <CouponForm
            initial={initial}
            submitLabel="Save changes"
            onSubmit={onSubmit}
            onCancel={() => router.push("/coupons")}
          />
        </>
      )}
    </AdminShell>
  );
}
