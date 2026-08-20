"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/AdminShell/AdminShell";
import { getDashboard } from "@/lib/api/admin";
import styles from "./dashboard.module.css";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDay(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
}

const STATUS_LABELS = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const d = await getDashboard();
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load the dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalRevenue30d = useMemo(() => {
    if (!data?.salesSeries) return 0;
    return data.salesSeries.reduce((sum, d) => sum + (d.revenue || 0), 0);
  }, [data]);

  return (
    <AdminShell>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Overview</span>
          <h1 className={styles.heading}>Dashboard</h1>
        </div>
        <Link href="/products/new" className={styles.cta}>
          + New product
        </Link>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.cards}>
        <Stat label="Products" value={data?.counts?.products} sub={`${data?.counts?.activeProducts ?? "—"} active`} loading={loading} />
        <Stat label="Low stock" value={data?.counts?.lowStock} sub="< 5 units left" tone={data?.counts?.lowStock > 0 ? "warn" : "neutral"} loading={loading} />
        <Stat label="Customers" value={data?.counts?.users} sub="registered accounts" loading={loading} />
        <Stat label="Orders" value={data?.counts?.orders} sub={`${data?.counts?.recentOrders ?? 0} in last 30 days`} loading={loading} />
        <Stat
          label="Revenue (paid)"
          value={data ? inr.format(data.revenue?.lifetimePaid || 0) : null}
          sub={`Last 30d: ${inr.format(totalRevenue30d)}`}
          loading={loading}
          big
        />
      </section>

      <section className={styles.twoCol}>
        <div className={styles.panel}>
          <header className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Sales · last 30 days</h2>
            <span className={styles.muted}>{inr.format(totalRevenue30d)} total</span>
          </header>
          {loading ? (
            <p className={styles.muted}>Loading…</p>
          ) : (
            <SalesChart data={data?.salesSeries || []} />
          )}
        </div>

        <div className={styles.panel}>
          <header className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Orders by status · last 30 days</h2>
          </header>
          {loading ? (
            <p className={styles.muted}>Loading…</p>
          ) : (
            <StatusBreakdown breakdown={data?.statusBreakdown || {}} />
          )}
        </div>
      </section>

      <section className={styles.twoCol}>
        <div className={styles.panel}>
          <header className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Top selling products</h2>
            <Link href="/products" className={styles.panelLink}>All products →</Link>
          </header>
          {loading ? (
            <p className={styles.muted}>Loading…</p>
          ) : data?.topProducts?.length ? (
            <ul className={styles.topList}>
              {data.topProducts.map((p, i) => (
                <li key={p.id || p.slug || i} className={styles.topRow}>
                  <span className={styles.topRank}>{String(i + 1).padStart(2, "0")}</span>
                  <div className={styles.topText}>
                    <span className={styles.topName}>{p.name || p.slug}</span>
                    <span className={styles.topSub}>
                      {p.qty} sold · {inr.format(p.revenue || 0)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.muted}>No sales data yet.</p>
          )}
        </div>

        <div className={styles.panel}>
          <header className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Low stock alerts</h2>
            <Link href="/products?filter=lowstock" className={styles.panelLink}>All products →</Link>
          </header>
          {loading ? (
            <p className={styles.muted}>Loading…</p>
          ) : data?.lowStockList?.length ? (
            <ul className={styles.topList}>
              {data.lowStockList.map((p) => (
                <li key={p.id} className={styles.topRow}>
                  <span className={`${styles.topRank} ${styles.topRankWarn}`}>!</span>
                  <div className={styles.topText}>
                    <Link href={`/products/${p.id}`} className={styles.topName}>{p.name}</Link>
                    <span className={styles.topSub}>{p.stock} left</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.muted}>All products fully stocked. Nice.</p>
          )}
        </div>
      </section>

      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Recent orders</h2>
          <Link href="/orders" className={styles.panelLink}>All orders →</Link>
        </header>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : data?.recentOrders?.length ? (
          <ul className={styles.orderList}>
            {data.recentOrders.map((o) => (
              <li key={o.id} className={styles.orderRow}>
                <div className={styles.orderMain}>
                  <Link href={`/orders/${o.id}`} className={styles.orderNumber}>#{o.orderNumber}</Link>
                  <span className={styles.orderDate}>{formatDate(o.createdAt)}</span>
                </div>
                <span className={styles.orderTotal}>{inr.format(o.total)}</span>
                <span className={`${styles.pill} ${styles[`pill_${o.paymentStatus || "none"}`] || ""}`}>
                  {o.paymentStatus || "—"}
                </span>
                <span className={`${styles.pill} ${styles[`pill_${o.status || "none"}`] || ""}`}>
                  {o.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>No orders yet.</p>
        )}
      </section>
    </AdminShell>
  );
}

function Stat({ label, value, sub, tone = "neutral", loading = false, big = false }) {
  return (
    <article className={`${styles.stat} ${big ? styles.statBig : ""} ${styles[`tone_${tone}`] || ""}`}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>
        {loading ? "…" : value ?? "—"}
      </span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </article>
  );
}

// Inline SVG bar chart — one bar per day for the last 30 days. Hover any bar
// for the day, revenue and order count. Zero-revenue days render as a faint
// baseline stub so the shape of the month stays legible.
function SalesChart({ data }) {
  if (!data.length) return <p className={styles.muted}>No sales in this window.</p>;
  const width = 640;
  const height = 180;
  const padX = 12;
  const padTop = 14;
  const padBottom = 18;
  const chartHeight = height - padTop - padBottom;
  const max = Math.max(1, ...data.map((d) => d.revenue));

  const gap = 3;
  const barW = (width - padX * 2 - gap * (data.length - 1)) / data.length;
  const baselineY = height - padBottom;
  const MIN_BAR = 2; // sliver so zero days still register

  return (
    <div className={styles.chartWrap}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.chart} aria-label="Daily sales chart" role="img">
        {/* subtle baseline */}
        <line
          x1={padX}
          x2={width - padX}
          y1={baselineY}
          y2={baselineY}
          className={styles.chartBaseline}
        />
        {data.map((d, i) => {
          const x = padX + i * (barW + gap);
          const h = d.revenue > 0 ? Math.max(MIN_BAR, (d.revenue / max) * chartHeight) : MIN_BAR;
          const y = baselineY - h;
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={Math.min(2, barW / 2)}
                className={`${styles.chartBar} ${d.revenue === 0 ? styles.chartBarEmpty : ""}`}
              />
              <title>
                {formatDay(d.date)}: {inr.format(d.revenue)} ({d.orders} order{d.orders === 1 ? "" : "s"})
              </title>
            </g>
          );
        })}
      </svg>
      <div className={styles.chartAxis}>
        <span>{formatDay(data[0].date)}</span>
        <span>{formatDay(data[Math.floor(data.length / 2)].date)}</span>
        <span>{formatDay(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}

function StatusBreakdown({ breakdown }) {
  const total = Object.values(breakdown).reduce((s, v) => s + v, 0);
  if (!total) return <p className={styles.muted}>No orders in this window.</p>;
  return (
    <ul className={styles.breakdown}>
      {STATUS_LABELS.map((label) => {
        const count = breakdown[label] || 0;
        const pct = total ? Math.round((count / total) * 100) : 0;
        return (
          <li key={label} className={styles.breakdownRow}>
            <span className={styles.breakdownLabel}>{label}</span>
            <span className={styles.breakdownBar} aria-hidden="true">
              <span
                className={`${styles.breakdownFill} ${styles[`fill_${label}`] || ""}`}
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className={styles.breakdownCount}>
              {count} <span className={styles.breakdownPct}>· {pct}%</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
