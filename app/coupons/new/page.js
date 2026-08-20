"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell/AdminShell";
import CouponForm from "@/components/CouponForm/CouponForm";
import { useToast } from "@/components/providers/ToastProvider";
import { createCoupon } from "@/lib/api/admin";
import styles from "../coupons.module.css";

export default function NewCouponPage() {
  const router = useRouter();
  const toast = useToast();

  const onSubmit = async (payload) => {
    await createCoupon(payload);
    toast.success("Coupon added successfully");
    router.push("/coupons");
  };

  return (
    <AdminShell>
      <Link href="/coupons" className={styles.backLink}>← Back to coupons</Link>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Marketing</span>
          <h1 className={styles.heading}>New coupon</h1>
        </div>
      </header>
      <CouponForm
        submitLabel="Create coupon"
        onSubmit={onSubmit}
        onCancel={() => router.push("/coupons")}
      />
    </AdminShell>
  );
}
