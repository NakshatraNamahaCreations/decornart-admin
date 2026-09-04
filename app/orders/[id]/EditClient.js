"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminShell from "@/components/AdminShell/AdminShell";
import { getOrder, updateOrderStatus } from "@/lib/api/admin";
import styles from "./order-detail.module.css";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const STATUS_FLOW = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

// Business details rendered on the printed invoice header. Kept as a
// constant here so a designer can tweak without hunting through JSX.
const SELLER = {
  name: "Decor N Art",
  tagline: "Handcrafted floral bouquets & gift décor",
  address1: "#828, Sri Hanuma Dhaye, 2nd Main 10th Cross",
  address2: "Sir M Visvesvaraya Layout Block 1, Bengaluru-560056",
  country: "India",
  email: "official@decornart.in",
  phone: "+91 9986988786",
  gstin: "29ABCDE1234F1Z5",
  website: "www.decornart.in",
};

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Status form — tracking fields (awb/courier/url) are managed by the
  // Shiprocket auto-sync, so this form only handles status + optional note.
  const [nextStatus, setNextStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  // Note form
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getOrder(id);
        if (!cancelled) {
          setOrder(data);
          setNextStatus(data.status);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load order.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const submitStatus = async (e) => {
    e.preventDefault();
    if (!nextStatus || (nextStatus === order?.status && !statusNote)) return;
    setSavingStatus(true);
    setError("");
    try {
      const updated = await updateOrderStatus(id, {
        status: nextStatus,
        note: statusNote || undefined,
      });
      setOrder(updated);
      setStatusNote("");
    } catch (e) {
      setError(e.message || "Could not update status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const printInvoice = () => {
    if (typeof window === "undefined") return;
    // Browsers print `document.title` in the top-margin header. Swap it to
    // an invoice-flavoured title for the duration of the print dialog so
    // "Decor N Art Admin" doesn't show up above the invoice.
    const previousTitle = document.title;
    document.title = `Invoice-${order.orderNumber}`;
    // Restore after the print dialog closes (works in Chrome/Edge/Safari).
    const restore = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  };

  if (loading) {
    return (
      <AdminShell>
        <p className={styles.muted}>Loading order…</p>
      </AdminShell>
    );
  }

  if (!order) {
    return (
      <AdminShell>
        <p className={styles.error}>{error || "Order not found."}</p>
        <Link href="/orders" className={styles.backLink}>← Back to orders</Link>
      </AdminShell>
    );
  }

  const addr = order.shippingAddress || {};

  const paidStatus = order.payment?.status || "unpaid";
  const paymentMethod =
    order.payment?.provider === "razorpay"
      ? "Razorpay (Online)"
      : order.payment?.provider || "—";
  const invoiceItems = order.items || [];

  return (
    <AdminShell>
      {/* Print-only invoice. `.invoiceRoot` hides on screen and everything
          else on the page hides on print — so window.print() renders just
          this block. Layout mimics a standard business invoice: seller
          header, bill-to / ship-to, itemised table, totals, footer. */}
      <div className={styles.invoiceRoot} aria-hidden="true">
        <div className={styles.invoice}>
          <header className={styles.invHead}>
            <div className={styles.invBrand}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/new-logo.png"
                alt="Decor N Art"
                className={styles.invLogo}
              />
              <div className={styles.invSellerLines}>
                <div className={styles.invSellerName}>{SELLER.name}</div>
                <div className={styles.invSellerLine}>{SELLER.tagline}</div>
                <div className={styles.invSellerLine}>{SELLER.address1}</div>
                <div className={styles.invSellerLine}>{SELLER.address2}</div>
                <div className={styles.invSellerLine}>
                  {SELLER.email} · {SELLER.phone}
                </div>
                <div className={styles.invSellerLine}>GSTIN: {SELLER.gstin}</div>
              </div>
            </div>
            <div className={styles.invMeta}>
              <div className={styles.invTitle}>INVOICE</div>
              <dl className={styles.invMetaList}>
                <dt>Invoice #</dt>
                <dd>{order.orderNumber}</dd>
                <dt>Issue date</dt>
                <dd>{formatDate(order.createdAt)}</dd>
                <dt>Status</dt>
                <dd className={styles.invStatus}>{paidStatus.toUpperCase()}</dd>
              </dl>
            </div>
          </header>

          <section className={styles.invParties}>
            <div className={styles.invParty}>
              <div className={styles.invPartyLabel}>Billed to</div>
              <div className={styles.invPartyName}>
                {order.customer?.name || addr.name || "Customer"}
              </div>
              {order.customer?.email && (
                <div className={styles.invPartyLine}>{order.customer.email}</div>
              )}
              {(order.customer?.phone || addr.phone) && (
                <div className={styles.invPartyLine}>
                  {order.customer?.phone || addr.phone}
                </div>
              )}
            </div>
            <div className={styles.invParty}>
              <div className={styles.invPartyLabel}>Ship to</div>
              <div className={styles.invPartyName}>{addr.name || "—"}</div>
              {addr.line1 && (
                <div className={styles.invPartyLine}>{addr.line1}</div>
              )}
              {addr.line2 && (
                <div className={styles.invPartyLine}>{addr.line2}</div>
              )}
              {(addr.city || addr.state || addr.pincode) && (
                <div className={styles.invPartyLine}>
                  {[addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
                </div>
              )}
              {addr.phone && (
                <div className={styles.invPartyLine}>Phone: {addr.phone}</div>
              )}
            </div>
          </section>

          <table className={styles.invTable}>
            <thead>
              <tr>
                <th className={styles.invColNum}>#</th>
                <th className={styles.invColItem}>Item</th>
                <th className={styles.invColQty}>Qty</th>
                <th className={styles.invColRate}>Rate</th>
                <th className={styles.invColAmt}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.map((i, idx) => (
                <tr key={`inv-${i.product || i.slug}-${idx}`}>
                  <td className={styles.invColNum}>{idx + 1}</td>
                  <td className={styles.invColItem}>
                    <div className={styles.invItemName}>{i.name}</div>
                    {i.variantName && (
                      <div className={styles.invItemVariant}>{i.variantName}</div>
                    )}
                  </td>
                  <td className={styles.invColQty}>{i.qty}</td>
                  <td className={styles.invColRate}>{inr.format(i.price || 0)}</td>
                  <td className={styles.invColAmt}>{inr.format(i.lineTotal || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <section className={styles.invTotalsWrap}>
            <div className={styles.invPay}>
              <div className={styles.invPayLabel}>Payment</div>
              <div className={styles.invPayLine}>Method: {paymentMethod}</div>
              {order.payment?.razorpayPaymentId && (
                <div className={styles.invPayLine}>
                  Ref: {order.payment.razorpayPaymentId}
                </div>
              )}
              <div className={styles.invPayLine}>
                Order status: <strong>{order.status}</strong>
              </div>
            </div>

            <dl className={styles.invTotals}>
              <dt>Subtotal</dt>
              <dd>{inr.format(order.summary?.subtotal || 0)}</dd>
              {order.summary?.gst ? (
                <>
                  <dt>GST</dt>
                  <dd>{inr.format(order.summary.gst)}</dd>
                </>
              ) : null}
              {order.summary?.shipping ? (
                <>
                  <dt>Shipping</dt>
                  <dd>{inr.format(order.summary.shipping)}</dd>
                </>
              ) : null}
              {order.summary?.discount ? (
                <>
                  <dt>
                    Discount{order.promoCode ? ` (${order.promoCode})` : ""}
                  </dt>
                  <dd>− {inr.format(order.summary.discount)}</dd>
                </>
              ) : null}
              <dt className={styles.invGrand}>Total</dt>
              <dd className={styles.invGrand}>
                {inr.format(order.summary?.total || 0)}
              </dd>
            </dl>
          </section>

          <footer className={styles.invFoot}>
            <p className={styles.invThanks}>Thank you for shopping with us.</p>
            <p className={styles.invFine}>
              This is a computer-generated invoice and does not require a
              physical signature. For any questions about this order write to{" "}
              {SELLER.email} or call {SELLER.phone}.
            </p>
            <p className={styles.invFine}>{SELLER.website}</p>
          </footer>
        </div>
      </div>

      <div className={styles.printHide}>
        <Link href="/orders" className={styles.backLink}>← Back to orders</Link>
        <header className={styles.head}>
          <div>
            <span className={styles.eyebrow}>Order</span>
            <h1 className={styles.heading}>#{order.orderNumber}</h1>
            <p className={styles.muted}>Placed {formatDate(order.createdAt)}</p>
          </div>
          <div className={styles.headActions}>
            <button type="button" onClick={printInvoice} className={styles.secondary}>
              Print invoice
            </button>
            <span className={`${styles.pill} ${styles[`pill_${order.status}`] || ""}`}>{order.status}</span>
            <span className={`${styles.pill} ${styles[`pill_${order.paymentStatus || order.payment?.status || "none"}`] || ""}`}>
              {order.payment?.status || "—"}
            </span>
          </div>
        </header>

        {error && <p className={styles.error}>{error}</p>}
      </div>

      <section className={styles.layout}>
        {/* ── Left: items + status + notes ── */}
        <div className={styles.col}>
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Items</h2>
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((i, idx) => (
                  <tr key={`${i.product || i.slug}-${idx}`}>
                    <td>
                      <div className={styles.name}>{i.name}</div>
                      <div className={styles.mute}>/{i.slug}</div>
                    </td>
                    <td>{i.qty}</td>
                    <td>{inr.format(i.price || 0)}</td>
                    <td>{inr.format(i.lineTotal || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className={styles.summary}>
              <dt>Subtotal</dt>
              <dd>{inr.format(order.summary?.subtotal || 0)}</dd>
              <dt>GST</dt>
              <dd>{inr.format(order.summary?.gst || 0)}</dd>
              <dt>Shipping</dt>
              <dd>{inr.format(order.summary?.shipping || 0)}</dd>
              {order.summary?.discount ? (
                <>
                  <dt>Discount {order.promoCode ? `(${order.promoCode})` : ""}</dt>
                  <dd>− {inr.format(order.summary.discount)}</dd>
                </>
              ) : null}
              <dt className={styles.grand}>Total</dt>
              <dd className={styles.grand}>{inr.format(order.summary?.total || 0)}</dd>
            </dl>
          </div>

          <div className={`${styles.panel} ${styles.printHide}`}>
            <h2 className={styles.panelTitle}>Update status</h2>
            <form onSubmit={submitStatus} className={styles.form}>
              <div className={styles.field}>
                <label>Status</label>
                <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} className={styles.input}>
                  {STATUS_FLOW.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>Note (optional)</label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Handed to Delhivery courier"
                  className={styles.input}
                  maxLength={500}
                />
              </div>
              <div className={styles.formFoot}>
                <button type="submit" disabled={savingStatus} className={styles.primary}>
                  {savingStatus ? "Saving…" : "Save status"}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* ── Right: customer + shipping + payment + timeline ── */}
        <aside className={styles.col}>
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Customer</h2>
            {order.customer ? (
              <div className={styles.stack}>
                <div>
                  <div className={styles.name}>{order.customer.name}</div>
                  <div className={styles.mute}>{order.customer.email}</div>
                  {order.customer.phone && <div className={styles.mute}>{order.customer.phone}</div>}
                </div>
                <Link href={`/customers/${order.customer.id}`} className={styles.secondaryLink}>
                  View customer →
                </Link>
              </div>
            ) : (
              <p className={styles.muted}>Guest / deleted user</p>
            )}
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Shipping address</h2>
            {addr && addr.line1 ? (
              <address className={styles.address}>
                {addr.line1}
                {addr.line2 ? <>, {addr.line2}</> : null}
                <br />
                {addr.city}, {addr.state} {addr.pincode}
                <br />
                {addr.phone && <>📞 {addr.phone}</>}
              </address>
            ) : (
              <p className={styles.muted}>No shipping address on file.</p>
            )}
          </div>

          <div className={`${styles.panel} ${styles.printHide}`}>
            <h2 className={styles.panelTitle}>Payment</h2>
            <dl className={styles.kv}>
              <dt>Status</dt>
              <dd>
                <span className={`${styles.pill} ${styles[`pill_${order.payment?.status || "none"}`] || ""}`}>
                  {order.payment?.status || "—"}
                </span>
              </dd>
              <dt>Provider</dt>
              <dd>{order.payment?.provider || "—"}</dd>
              {order.payment?.razorpayOrderId && (
                <>
                  <dt>Razorpay order</dt>
                  <dd className={styles.mono}>{order.payment.razorpayOrderId}</dd>
                </>
              )}
              {order.payment?.razorpayPaymentId && (
                <>
                  <dt>Razorpay payment</dt>
                  <dd className={styles.mono}>{order.payment.razorpayPaymentId}</dd>
                </>
              )}
            </dl>
          </div>

          {(order.tracking?.awb || order.tracking?.courier) && (
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Shipment</h2>
              <dl className={styles.kv}>
                {order.tracking.courier && (
                  <>
                    <dt>Courier</dt>
                    <dd>{order.tracking.courier}</dd>
                  </>
                )}
                {order.tracking.awb && (
                  <>
                    <dt>AWB</dt>
                    <dd className={styles.mono}>{order.tracking.awb}</dd>
                  </>
                )}
                {order.tracking.url && (
                  <>
                    <dt>Track</dt>
                    <dd>
                      <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                        Open tracking →
                      </a>
                    </dd>
                  </>
                )}
              </dl>
            </div>
          )}

          {/* Shiprocket — read-only. The order auto-pushes to SR on payment
              confirmation and a background sweep retries failures, so the
              admin panel only needs to *display* the SR handles. If auto-push
              hasn't landed yet, we surface the last error so it's obvious. */}
          <div className={`${styles.panel} ${styles.printHide}`}>
            <h2 className={styles.panelTitle}>Shiprocket</h2>
            <dl className={styles.kv}>
              {order.tracking?.shiprocketOrderId && (
                <>
                  <dt>SR order</dt>
                  <dd className={styles.mono}>{order.tracking.shiprocketOrderId}</dd>
                </>
              )}
              {order.tracking?.shipmentId && (
                <>
                  <dt>Shipment</dt>
                  <dd className={styles.mono}>{order.tracking.shipmentId}</dd>
                </>
              )}
              {order.tracking?.lastSyncError && !order.tracking?.shipmentId && (
                <>
                  <dt>Auto-push failed</dt>
                  <dd style={{ color: "#b3261e" }}>
                    {order.tracking.lastSyncError}
                    {order.tracking.syncAttempts
                      ? ` (retried ${order.tracking.syncAttempts}×)`
                      : ""}
                  </dd>
                </>
              )}
              {!order.tracking?.shiprocketOrderId && !order.tracking?.lastSyncError && (
                <>
                  <dt>Status</dt>
                  <dd className={styles.muted}>Awaiting auto-push…</dd>
                </>
              )}
            </dl>
          </div>

          <div className={`${styles.panel} ${styles.printHide}`}>
            <h2 className={styles.panelTitle}>Status timeline</h2>
            {(order.statusHistory || []).length === 0 ? (
              <p className={styles.muted}>No status changes yet.</p>
            ) : (
              <ul className={styles.timeline}>
                {[...(order.statusHistory || [])].reverse().map((s) => (
                  <li key={s.id} className={styles.timelineRow}>
                    <span className={styles.timelineDot} aria-hidden="true" />
                    <div className={styles.timelineBody}>
                      <div>
                        <strong>{s.from || "—"}</strong> → <strong>{s.to}</strong>
                      </div>
                      <div className={styles.mute}>
                        {formatDate(s.at)} · {s.byName || "Admin"}
                      </div>
                      {s.note && <p className={styles.noteBody}>{s.note}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>
    </AdminShell>
  );
}
