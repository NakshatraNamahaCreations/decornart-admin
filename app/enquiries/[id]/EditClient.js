"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell/AdminShell";
import {
  getEnquiry,
  updateEnquiryStatus,
  deleteEnquiry,
} from "@/lib/api/admin";
import styles from "../enquiries.module.css";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EnquiryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [enquiry, setEnquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getEnquiry(id)
      .then((doc) => {
        if (!cancelled) setEnquiry(doc);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Could not load enquiry.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggleStatus = async () => {
    if (!enquiry) return;
    const next = enquiry.status === "handled" ? "new" : "handled";
    setBusy(true);
    try {
      const updated = await updateEnquiryStatus(enquiry.id, next);
      setEnquiry(updated);
    } catch (e) {
      window.alert(e.message || "Could not update status.");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!enquiry) return;
    if (
      !window.confirm(
        `Delete enquiry from ${enquiry.name}? This cannot be undone.`
      )
    )
      return;
    setBusy(true);
    try {
      await deleteEnquiry(enquiry.id);
      router.push("/enquiries");
    } catch (e) {
      window.alert(e.message || "Delete failed.");
      setBusy(false);
    }
  };

  return (
    <AdminShell>
      <Link href="/enquiries" className={styles.backLink}>
        ← All enquiries
      </Link>

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : !enquiry ? (
        <p className={styles.muted}>Enquiry not found.</p>
      ) : (
        <>
          <header className={styles.head}>
            <div>
              <span className={styles.eyebrow}>
                {enquiry.type === "wholesale" ? "Wholesale" : "Contact"} enquiry
              </span>
              <h1 className={styles.heading}>{enquiry.name}</h1>
            </div>
            <span
              className={`${styles.pill} ${
                styles[`pill_${enquiry.status}`] || ""
              }`}
            >
              {enquiry.status}
            </span>
          </header>

          <div className={styles.detailGrid}>
            <div className={styles.detailCard}>
              {enquiry.subject && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Subject</span>
                  <div className={styles.detailValue}>{enquiry.subject}</div>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Message</span>
                <div className={styles.messageBox}>{enquiry.message}</div>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Received</span>
                <div className={styles.detailValue}>
                  {formatDate(enquiry.createdAt)}
                </div>
              </div>
            </div>

            <aside className={styles.detailCard}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Email</span>
                <div className={styles.detailValue}>
                  <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>
                </div>
              </div>
              {enquiry.phone && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Phone</span>
                  <div className={styles.detailValue}>
                    <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a>
                  </div>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Type</span>
                <div className={styles.detailValue}>
                  <span
                    className={`${styles.pill} ${
                      styles[`pill_${enquiry.type}`] || ""
                    }`}
                  >
                    {enquiry.type}
                  </span>
                </div>
              </div>

              <div className={styles.sideStack}>
                <button
                  type="button"
                  className={`${styles.sideBtn} ${styles.sideBtnPrimary}`}
                  onClick={toggleStatus}
                  disabled={busy}
                >
                  {enquiry.status === "handled"
                    ? "Reopen enquiry"
                    : "Mark as handled"}
                </button>
                <a
                  className={styles.sideBtn}
                  href={`mailto:${enquiry.email}?subject=Re: ${encodeURIComponent(
                    enquiry.subject || "Your enquiry with Decor N Art"
                  )}`}
                >
                  Reply by email
                </a>
                {enquiry.phone && (
                  <a
                    className={styles.sideBtn}
                    href={`https://wa.me/${enquiry.phone.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Message on WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  className={`${styles.sideBtn} ${styles.sideBtnDanger}`}
                  onClick={onDelete}
                  disabled={busy}
                >
                  Delete enquiry
                </button>
              </div>
            </aside>
          </div>
        </>
      )}
    </AdminShell>
  );
}
