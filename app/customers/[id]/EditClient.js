"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiMapPin, FiPhone } from "react-icons/fi";
import AdminShell from "@/components/AdminShell/AdminShell";
import { getCustomer, setCustomerBlocked } from "@/lib/api/admin";
import styles from "../customers.module.css";
import orderStyles from "../../orders/orders.module.css";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getCustomer(id);
        if (!cancelled) setCustomer(data);
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load customer.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggleBlock = async () => {
    if (!customer) return;
    const next = !customer.blocked;
    const label = next ? "block" : "unblock";
    if (!window.confirm(`Are you sure you want to ${label} ${customer.name}?`)) return;
    setBusy(true);
    try {
      const updated = await setCustomerBlocked(customer.id, next);
      setCustomer((c) => ({ ...c, blocked: updated.blocked }));
    } catch (e) {
      window.alert(e.message || `Could not ${label} customer.`);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AdminShell>
        <p className={styles.muted}>Loading customer…</p>
      </AdminShell>
    );
  }

  if (!customer) {
    return (
      <AdminShell>
        <p className={styles.error}>{error || "Customer not found."}</p>
        <Link href="/customers" className={styles.backLink}>← Back to customers</Link>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <Link href="/customers" className={styles.backLink}>← Back to customers</Link>
      <header className={styles.detailHead}>
        <div>
          <span className={styles.eyebrow}>Customer</span>
          <h1 className={styles.heading}>{customer.name}</h1>
          <p className={styles.mute}>
            Joined {formatDate(customer.createdAt)}
          </p>
        </div>
        <div className={styles.detailHeadActions}>
          <span className={`${styles.pill} ${customer.blocked ? styles.pill_blocked : styles.pill_active}`}>
            {customer.blocked ? "Blocked" : "Active"}
          </span>
          <button
            type="button"
            onClick={toggleBlock}
            disabled={busy}
            className={customer.blocked ? styles.primary : styles.danger}
          >
            {busy ? "…" : customer.blocked ? "Unblock account" : "Block account"}
          </button>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.detailLayout}>
        {/* Left column — profile + addresses */}
        <div className={styles.col}>
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Overview</h2>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Orders</span>
                <span className={styles.statValue}>{customer.stats.orderCount}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Total spent</span>
                <span className={styles.statValue}>{inr.format(customer.stats.totalSpent || 0)}</span>
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Contact</h2>
            <dl className={styles.contact}>
              <dt>Email</dt>
              <dd>{customer.email}</dd>
              {customer.phone && (
                <>
                  <dt>Phone</dt>
                  <dd>{customer.phone}</dd>
                </>
              )}
              <dt>Role</dt>
              <dd>{customer.role}</dd>
            </dl>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Saved addresses</h2>
            {customer.addresses?.length ? (
              customer.addresses.map((a, i) => (
                <address key={a._id || i} className={styles.address}>
                  {a.label && (
                    <strong className={styles.addressLabel}>
                      <FiMapPin aria-hidden="true" className={styles.addressIcon} />
                      <span>{a.label}</span>
                      {a.isDefault && <span className={styles.badge}>Default</span>}
                    </strong>
                  )}
                  <div className={styles.addressLine}>
                    {a.line1}
                    {a.line2 ? <>, {a.line2}</> : null}
                  </div>
                  <div className={styles.addressLine}>
                    {a.city}, {a.state} {a.pincode}
                  </div>
                  {a.phone && (
                    <div className={styles.addressPhone}>
                      <FiPhone aria-hidden="true" className={styles.addressIcon} />
                      <span>{a.phone}</span>
                    </div>
                  )}
                </address>
              ))
            ) : (
              <p className={styles.mute}>No saved addresses.</p>
            )}
          </div>
        </div>

        {/* Right column — order history (latest 20) */}
        <div className={styles.col}>
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>
              Recent orders
              <span className={styles.mute} style={{ fontWeight: 400 }}>
                {customer.orders.length} of {customer.stats.orderCount}
              </span>
            </h2>

            {customer.orders.length === 0 ? (
              <p className={styles.mute}>This customer hasn&rsquo;t placed any orders yet.</p>
            ) : (
              <div className={orderStyles.tableWrap} style={{ marginTop: "0.4rem" }}>
                <table className={orderStyles.table}>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.orders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <Link href={`/orders/${o.id}`} className={orderStyles.linkStrong}>
                            #{o.orderNumber}
                          </Link>
                        </td>
                        <td className={orderStyles.mute}>{formatDate(o.createdAt)}</td>
                        <td>{inr.format(o.total)}</td>
                        <td>
                          <span className={`${orderStyles.pill} ${orderStyles[`pill_${o.paymentStatus || "none"}`] || ""}`}>
                            {o.paymentStatus || "—"}
                          </span>
                        </td>
                        <td>
                          <span className={`${orderStyles.pill} ${orderStyles[`pill_${o.status}`] || ""}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
