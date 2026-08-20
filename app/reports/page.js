"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell/AdminShell";
import { getPaymentsReport, getShippingReport } from "@/lib/api/admin";
import styles from "./reports.module.css";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const TABS = [
  { key: "payments", label: "Payments" },
  { key: "shipping", label: "Shipping" },
];

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = cell == null ? "" : String(cell);
          if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
          return s;
        })
        .join(",")
    )
    .join("\n");
}

function downloadCsv(name, csv) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [tab, setTab] = useState("payments");
  const [dateFrom, setDateFrom] = useState(isoDaysAgo(30));
  const [dateTo, setDateTo] = useState(todayIso());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState(null);
  const [shipping, setShipping] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [p, s] = await Promise.all([
        getPaymentsReport({ dateFrom, dateTo }),
        getShippingReport({ dateFrom, dateTo }),
      ]);
      setPayments(p);
      setShipping(s);
    } catch (e) {
      setError(e.message || "Could not load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  const exportPayments = () => {
    if (!payments) return;
    const rows = [
      ["Payments Report"],
      [`Period`, `${dateFrom} to ${dateTo}`],
      [],
      ["Metric", "Value"],
      ["Gross revenue (paid)", payments.revenue.gross],
      ["Refunded", payments.revenue.refunded],
      ["Net revenue", payments.revenue.net],
      ["GST collected", payments.revenue.gst],
      ["Shipping collected", payments.revenue.shipping],
      ["Discounts applied", payments.revenue.discount],
      ["Paid orders", payments.revenue.paidOrders],
      ["Average order value", Math.round(payments.revenue.averageOrderValue)],
      [],
      ["Payment status", "Count", "Total (INR)"],
      ["Paid", payments.counts.paid, payments.revenueByStatus.paid],
      ["Created", payments.counts.created, payments.revenueByStatus.created],
      ["Failed", payments.counts.failed, payments.revenueByStatus.failed],
      ["Refunded", payments.counts.refunded, payments.revenueByStatus.refunded],
      [],
      ["Provider", "Count", "Total (INR)"],
      ...payments.providers.map((p) => [p.provider, p.count, p.total]),
      [],
      ["Date", "Paid", "Created", "Failed", "Refunded", "Paid revenue"],
      ...payments.daily.map((d) => [d.date, d.paid, d.created, d.failed, d.refunded, d.paidRevenue]),
    ];
    downloadCsv(`payments-report_${dateFrom}_to_${dateTo}.csv`, toCsv(rows));
  };

  const exportShipping = () => {
    if (!shipping) return;
    const rows = [
      ["Shipping Report"],
      [`Period`, `${dateFrom} to ${dateTo}`],
      [],
      ["Metric", "Value"],
      ["Total orders", shipping.totals.orders],
      ["Shipping charged (total)", shipping.totals.shippingRevenue],
      ["Average shipping / order", Math.round(shipping.totals.averageShipping)],
      ["With AWB assigned", shipping.tracking.withAwb],
      ["Pickup scheduled", shipping.tracking.pickupScheduled],
      ["Shipped", shipping.tracking.shipped],
      ["Delivered", shipping.tracking.delivered],
      ["Cancelled", shipping.tracking.cancelled],
      [],
      ["Order status", "Count"],
      ...Object.entries(shipping.counts).map(([k, v]) => [k, v]),
      [],
      ["Courier", "Orders", "Shipping revenue"],
      ...shipping.couriers.map((c) => [c.courier, c.count, c.shippingRevenue]),
      [],
      ["State", "Orders", "Shipping revenue"],
      ...shipping.topStates.map((s) => [s.state, s.orders, s.shippingRevenue]),
    ];
    downloadCsv(`shipping-report_${dateFrom}_to_${dateTo}.csv`, toCsv(rows));
  };

  const setRange = (days) => {
    setDateFrom(isoDaysAgo(days));
    setDateTo(todayIso());
  };

  const paymentsMaxRevenue = useMemo(() => {
    if (!payments) return 0;
    return payments.daily.reduce((m, d) => Math.max(m, d.paidRevenue || 0), 0);
  }, [payments]);

  return (
    <AdminShell>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Insights</span>
          <h1 className={styles.heading}>Reports</h1>
          <p className={styles.muted}>
            Payment and shipping performance for the selected period. Use export to save a CSV snapshot.
          </p>
        </div>
        <button
          type="button"
          className={styles.exportBtn}
          onClick={tab === "payments" ? exportPayments : exportShipping}
          disabled={loading || (tab === "payments" ? !payments : !shipping)}
        >
          ↓ Export CSV
        </button>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.controls}>
        <div className={styles.filters}>
          <label className={styles.field}>
            <span className={styles.label}>From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={styles.input}
              max={dateTo || undefined}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={styles.input}
              min={dateFrom || undefined}
              max={todayIso()}
            />
          </label>
          <div className={styles.quickRange}>
            <button type="button" onClick={() => setRange(7)} className={styles.chip}>7d</button>
            <button type="button" onClick={() => setRange(30)} className={styles.chip}>30d</button>
            <button type="button" onClick={() => setRange(90)} className={styles.chip}>90d</button>
            <button type="button" onClick={() => setRange(365)} className={styles.chip}>1y</button>
          </div>
        </div>

        <nav className={styles.tabs} aria-label="Report type">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </section>

      {tab === "payments" ? (
        <PaymentsReport data={payments} loading={loading} maxRevenue={paymentsMaxRevenue} />
      ) : (
        <ShippingReport data={shipping} loading={loading} />
      )}

      <p className={styles.footNote}>
        Report window: {formatDate(dateFrom)} – {formatDate(dateTo)}
      </p>
    </AdminShell>
  );
}

function PaymentsReport({ data, loading, maxRevenue }) {
  if (loading && !data) return <p className={styles.muted}>Loading payments report…</p>;
  if (!data) return <p className={styles.muted}>No data yet.</p>;

  return (
    <>
      <section className={styles.statGrid}>
        <StatCard label="Gross revenue" value={inr.format(data.revenue.gross)} tone="good" />
        <StatCard label="Refunded" value={`− ${inr.format(data.revenue.refunded)}`} tone="bad" />
        <StatCard label="Net revenue" value={inr.format(data.revenue.net)} tone="strong" />
        <StatCard label="Paid orders" value={data.revenue.paidOrders} />
        <StatCard label="Avg. order value" value={inr.format(Math.round(data.revenue.averageOrderValue))} />
        <StatCard label="GST collected" value={inr.format(data.revenue.gst)} />
        <StatCard label="Shipping collected" value={inr.format(data.revenue.shipping)} />
        <StatCard label="Discounts applied" value={inr.format(data.revenue.discount)} />
      </section>

      <div className={styles.grid2}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>By payment status</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Status</th>
                  <th className={styles.numCol}>Count</th>
                  <th className={styles.numCol}>Total</th>
                </tr>
              </thead>
              <tbody>
                <StatusRow name="Paid" count={data.counts.paid} total={data.revenueByStatus.paid} className={styles.pill_paid} />
                <StatusRow name="Created" count={data.counts.created} total={data.revenueByStatus.created} className={styles.pill_created} />
                <StatusRow name="Failed" count={data.counts.failed} total={data.revenueByStatus.failed} className={styles.pill_failed} />
                <StatusRow name="Refunded" count={data.counts.refunded} total={data.revenueByStatus.refunded} className={styles.pill_refunded} />
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>By provider</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th className={styles.numCol}>Orders</th>
                  <th className={styles.numCol}>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.providers.length === 0 ? (
                  <tr><td colSpan={3} className={styles.mute}>No data.</td></tr>
                ) : (
                  data.providers.map((p) => (
                    <tr key={p.provider}>
                      <td className={styles.name}>{p.provider}</td>
                      <td className={styles.numCol}>{p.count}</td>
                      <td className={styles.numCol}>{inr.format(p.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Daily paid revenue</h2>
        {data.daily.length === 0 ? (
          <p className={styles.mute}>No orders in this period.</p>
        ) : (
          <div className={styles.chart}>
            {data.daily.map((d) => {
              const h = maxRevenue > 0 ? Math.max(4, Math.round((d.paidRevenue / maxRevenue) * 140)) : 4;
              return (
                <div key={d.date} className={styles.bar} title={`${d.date} — ${inr.format(d.paidRevenue)} • ${d.paid} paid`}>
                  <span className={styles.barFill} style={{ height: `${h}px` }} />
                  <span className={styles.barLabel}>{d.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Daily breakdown</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th className={styles.numCol}>Paid</th>
                <th className={styles.numCol}>Created</th>
                <th className={styles.numCol}>Failed</th>
                <th className={styles.numCol}>Refunded</th>
                <th className={styles.numCol}>Paid revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.daily.length === 0 ? (
                <tr><td colSpan={6} className={styles.mute}>No data.</td></tr>
              ) : (
                data.daily.map((d) => (
                  <tr key={d.date}>
                    <td className={styles.mono}>{d.date}</td>
                    <td className={styles.numCol}>{d.paid}</td>
                    <td className={styles.numCol}>{d.created}</td>
                    <td className={styles.numCol}>{d.failed}</td>
                    <td className={styles.numCol}>{d.refunded}</td>
                    <td className={styles.numCol}>{inr.format(d.paidRevenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function ShippingReport({ data, loading }) {
  if (loading && !data) return <p className={styles.muted}>Loading shipping report…</p>;
  if (!data) return <p className={styles.muted}>No data yet.</p>;

  return (
    <>
      <section className={styles.statGrid}>
        <StatCard label="Total orders" value={data.totals.orders} tone="strong" />
        <StatCard label="Shipping revenue" value={inr.format(data.totals.shippingRevenue)} tone="good" />
        <StatCard label="Avg. shipping" value={inr.format(Math.round(data.totals.averageShipping))} />
        <StatCard label="With AWB" value={data.tracking.withAwb} />
        <StatCard label="Pickup scheduled" value={data.tracking.pickupScheduled} />
        <StatCard label="Shipped" value={data.tracking.shipped} />
        <StatCard label="Delivered" value={data.tracking.delivered} tone="good" />
        <StatCard label="Cancelled" value={data.tracking.cancelled} tone="bad" />
      </section>

      <div className={styles.grid2}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Orders by status</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Status</th>
                  <th className={styles.numCol}>Count</th>
                  <th className={styles.numCol}>Share</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.counts).map(([status, count]) => {
                  const total = data.totals.orders || 1;
                  const share = Math.round((count / total) * 100);
                  return (
                    <tr key={status}>
                      <td>
                        <span className={`${styles.pill} ${styles[`status_${status}`] || ""}`}>{status}</span>
                      </td>
                      <td className={styles.numCol}>{count}</td>
                      <td className={styles.numCol}>
                        <div className={styles.share}>
                          <span className={styles.shareBar}>
                            <span className={styles.shareFill} style={{ width: `${share}%` }} />
                          </span>
                          <span className={styles.shareText}>{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>By courier</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Courier</th>
                  <th className={styles.numCol}>Orders</th>
                  <th className={styles.numCol}>Shipping revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.couriers.length === 0 ? (
                  <tr><td colSpan={3} className={styles.mute}>No courier data yet.</td></tr>
                ) : (
                  data.couriers.map((c) => (
                    <tr key={c.courier}>
                      <td className={styles.name}>{c.courier}</td>
                      <td className={styles.numCol}>{c.count}</td>
                      <td className={styles.numCol}>{inr.format(c.shippingRevenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Top delivery states</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>State</th>
                <th className={styles.numCol}>Orders</th>
                <th className={styles.numCol}>Shipping revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.topStates.length === 0 ? (
                <tr><td colSpan={3} className={styles.mute}>No state data captured for this period.</td></tr>
              ) : (
                data.topStates.map((s) => (
                  <tr key={s.state}>
                    <td className={styles.name}>{s.state}</td>
                    <td className={styles.numCol}>{s.orders}</td>
                    <td className={styles.numCol}>{inr.format(s.shippingRevenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={`${styles.statValue} ${tone ? styles[`tone_${tone}`] : ""}`}>{value}</span>
    </div>
  );
}

function StatusRow({ name, count, total, className }) {
  return (
    <tr>
      <td><span className={`${styles.pill} ${className || ""}`}>{name}</span></td>
      <td className={styles.numCol}>{count}</td>
      <td className={styles.numCol}>{inr.format(total || 0)}</td>
    </tr>
  );
}
