"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminShell from "@/components/AdminShell/AdminShell";
import {
  listProducts,
  listCategories,
  updateInventory,
} from "@/lib/api/admin";
import styles from "./inventory.module.css";

const LOW_STOCK_THRESHOLD = 5;

// The filter block below the header — Category + Select-Products picker,
// with two actions: Fetch (reloads the list) and Download Excel (CSV of
// the visible rows).

function toCsv(rows) {
  const header = [
    "Product",
    "Variant",
    "SKU",
    "Category",
    "Status",
    "Stock",
    "Last Updated",
  ];
  const escape = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.productName,
        r.variantName || "",
        r.sku || "",
        r.category || "",
        r.status || "",
        r.stock,
        r.updatedAt ? new Date(r.updatedAt).toISOString().slice(0, 10) : "",
      ]
        .map(escape)
        .join(",")
    );
  }
  return lines.join("\n");
}

function downloadCsv(name, csv) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function InventoryPage() {
  // Filter state — Category dropdown + a multi-select Product picker
  // scoped to whatever the current fetch returned.
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [category, setCategory] = useState("all");
  const [lowOnly, setLowOnly] = useState(false);
  // Backend-driven stock filter — "all" (no filter), "in" (stock > 0),
  // or "out" (stock === 0). Sent as ?stockStatus= on the products list.
  const [stockStatus, setStockStatus] = useState("all");

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  const [edits, setEdits] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const [savedKey, setSavedKey] = useState(null);

  const load = async (pageOverride) => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await listProducts({
        page: pageOverride ?? page,
        limit: 60,
        category: category === "all" ? undefined : category,
        stockStatus: stockStatus === "all" ? undefined : stockStatus,
      });
      setItems(data || []);
      setMeta(
        meta || {
          page: pageOverride ?? page,
          pages: 1,
          hasNext: false,
          hasPrev: (pageOverride ?? page) > 1,
        }
      );
      setHasFetched(true);
    } catch (e) {
      setError(e.message || "Could not load inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    listCategories()
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        setCategories(data.map((c) => ({ slug: c.slug, name: c.name })));
      })
      .catch(() => {
        /* keep empty */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply the product-picker + low-only filters client-side against the
  // loaded set. Server pagination still governs the underlying list.
  const visibleProducts = useMemo(() => {
    if (selectedProductIds.length === 0) return items;
    const picked = new Set(selectedProductIds);
    return items.filter((p) => picked.has(p.id));
  }, [items, selectedProductIds]);

  const rows = useMemo(() => {
    const out = [];
    for (const p of visibleProducts) {
      const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
      out.push({
        key: p.id,
        productId: p.id,
        variantId: null,
        kind: hasVariants ? "parent-with-variants" : "product",
        productName: p.name,
        variantName: "",
        image: (p.images || [])[0] || null,
        category: p.category,
        status: p.status,
        slug: p.slug,
        sku: "",
        stock: p.stock ?? 0,
        updatedAt: p.updatedAt,
      });
      if (hasVariants) {
        for (const v of p.variants) {
          out.push({
            key: `${p.id}:${v.id}`,
            productId: p.id,
            variantId: v.id,
            kind: "variant",
            productName: p.name,
            variantName: v.name,
            sku: v.sku || "",
            image: v.image || null,
            category: p.category,
            status: p.status,
            slug: p.slug,
            stock: v.stock ?? 0,
            updatedAt: p.updatedAt,
          });
        }
      }
    }
    if (lowOnly) {
      return out.filter(
        (r) => r.kind !== "parent-with-variants" && r.stock <= LOW_STOCK_THRESHOLD
      );
    }
    return out;
  }, [visibleProducts, lowOnly]);

  const stats = useMemo(() => {
    const stockRows = rows.filter((r) => r.kind !== "parent-with-variants");
    return {
      totalUnits: stockRows.reduce((s, r) => s + (Number(r.stock) || 0), 0),
      lowCount: stockRows.filter((r) => r.stock > 0 && r.stock <= LOW_STOCK_THRESHOLD)
        .length,
      outCount: stockRows.filter((r) => r.stock === 0).length,
      itemCount: stockRows.length,
    };
  }, [rows]);

  const setDraft = (key, value) =>
    setEdits((prev) => ({ ...prev, [key]: value }));

  const commit = async (row) => {
    const draft = edits[row.key];
    if (draft == null || draft === "") return;
    const next = Math.max(0, Math.floor(Number(draft) || 0));
    if (next === row.stock) {
      setEdits((prev) => {
        const copy = { ...prev };
        delete copy[row.key];
        return copy;
      });
      return;
    }
    setSavingKey(row.key);
    try {
      const updated = await updateInventory(row.productId, {
        stock: next,
        variantId: row.variantId || undefined,
      });
      setItems((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
      setEdits((prev) => {
        const copy = { ...prev };
        delete copy[row.key];
        return copy;
      });
      setSavedKey(row.key);
      setTimeout(
        () => setSavedKey((cur) => (cur === row.key ? null : cur)),
        1400
      );
    } catch (e) {
      window.alert(e.message || "Could not save stock.");
    } finally {
      setSavingKey(null);
    }
  };

  const onFetch = () => {
    setPage(1);
    load(1);
  };

  const onDownloadExcel = () => {
    if (!rows.length) return;
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`inventory-${stamp}.csv`, toCsv(rows));
  };

  const onClearFilters = () => {
    setSelectedProductIds([]);
    setCategory("all");
    setStockStatus("all");
    setLowOnly(false);
  };

  return (
    <AdminShell>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Catalogue</span>
          <h1 className={styles.heading}>Inventory Product</h1>
        </div>
      </header>

      {/* ── Filter card ── */}
      <section className={styles.filterCard}>
        <h2 className={styles.filterTitle}>Filter Inventory</h2>

        <div className={styles.filterGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Category</span>
            <select
              className={styles.input}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Stock Status</span>
            <select
              className={styles.input}
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
            >
              <option value="all">All stock</option>
              <option value="in">In Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Select Products</span>
            <select
              multiple
              className={`${styles.input} ${styles.multi}`}
              value={selectedProductIds}
              onChange={(e) =>
                setSelectedProductIds(
                  Array.from(e.target.selectedOptions).map((o) => o.value)
                )
              }
            >
              {items.length === 0 ? (
                <option disabled>Fetch inventory first, then pick…</option>
              ) : (
                items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
            {selectedProductIds.length > 0 && (
              <span className={styles.hint}>
                {selectedProductIds.length} selected ·{" "}
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => setSelectedProductIds([])}
                >
                  clear
                </button>
              </span>
            )}
          </label>
        </div>

        <div className={styles.filterActions}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={(e) => setLowOnly(e.target.checked)}
            />
            <span>
              Low stock only <em>(≤ {LOW_STOCK_THRESHOLD})</em>
            </span>
          </label>
          <div className={styles.filterButtons}>
            {(selectedProductIds.length > 0 ||
              category !== "all" ||
              stockStatus !== "all" ||
              lowOnly) && (
              <button
                type="button"
                className={styles.ghost}
                onClick={onClearFilters}
              >
                Clear filters
              </button>
            )}
            <button
              type="button"
              className={styles.primary}
              onClick={onFetch}
              disabled={loading}
            >
              {loading ? "Fetching…" : "Fetch Filtered Inventory"}
            </button>
            <button
              type="button"
              className={styles.primaryAlt}
              onClick={onDownloadExcel}
              disabled={rows.length === 0}
              title={
                rows.length === 0
                  ? "Fetch some rows first"
                  : "Download visible rows as CSV"
              }
            >
              Download Excel
            </button>
          </div>
        </div>
      </section>

      {error && <p className={styles.error}>{error}</p>}

      {/* ── Results ── */}
      {hasFetched && (
        <>
          <div className={styles.statsStrip}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Items</span>
              <span className={styles.statValue}>{stats.itemCount.toLocaleString("en-IN")}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Total units</span>
              <span className={styles.statValue}>{stats.totalUnits.toLocaleString("en-IN")}</span>
            </div>
            <div className={`${styles.stat} ${styles.statLow}`}>
              <span className={styles.statLabel}>Low stock</span>
              <span className={styles.statValue}>{stats.lowCount}</span>
            </div>
            <div className={`${styles.stat} ${styles.statOut}`}>
              <span className={styles.statLabel}>Out of stock</span>
              <span className={styles.statValue}>{stats.outCount}</span>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>SKU</th>
                  <th className={styles.numeric}>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className={styles.muted}>Loading…</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.muted}>
                      {lowOnly ? "No low-stock items 🎉" : "No products match the filters."}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const isVariant = r.kind === "variant";
                    const isParent = r.kind === "parent-with-variants";
                    const low = !isParent && r.stock <= LOW_STOCK_THRESHOLD;
                    const draft = edits[r.key];
                    const saving = savingKey === r.key;
                    const saved = savedKey === r.key;
                    return (
                      <tr
                        key={r.key}
                        className={isVariant ? styles.variantRow : undefined}
                      >
                        <td>
                          <div className={styles.itemCell}>
                            {isVariant ? (
                              <span className={styles.variantDash} aria-hidden="true">
                                ↳
                              </span>
                            ) : (
                              <div className={styles.thumb}>
                                {r.image ? (
                                  <Image
                                    src={r.image}
                                    alt=""
                                    fill
                                    sizes="52px"
                                    unoptimized
                                  />
                                ) : (
                                  <span className={styles.thumbEmpty}>—</span>
                                )}
                              </div>
                            )}
                            <div className={styles.itemText}>
                              <Link
                                href={`/products/${r.productId}`}
                                className={styles.linkStrong}
                              >
                                {isVariant ? r.variantName : r.productName}
                              </Link>
                              {isParent && (
                                <span className={styles.mute}>
                                  Stock is per-variant below
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={styles.mute}>{isVariant ? "" : r.category}</td>
                        <td className={styles.mute}>{r.sku || (isVariant ? "—" : "")}</td>
                        <td className={styles.numeric}>
                          {isParent ? (
                            <span className={styles.mute}>—</span>
                          ) : (
                            <div className={styles.stockCell}>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                className={styles.stockInput}
                                value={draft !== undefined ? draft : String(r.stock)}
                                onChange={(e) => setDraft(r.key, e.target.value)}
                                onBlur={() => commit(r)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    e.currentTarget.blur();
                                  }
                                  if (e.key === "Escape") {
                                    setEdits((prev) => {
                                      const copy = { ...prev };
                                      delete copy[r.key];
                                      return copy;
                                    });
                                    e.currentTarget.blur();
                                  }
                                }}
                                disabled={saving}
                              />
                              {low && <span className={styles.lowPill}>Low</span>}
                              {saving && <span className={styles.hint}>Saving…</span>}
                              {saved && <span className={styles.savedHint}>Saved ✓</span>}
                            </div>
                          )}
                        </td>
                        <td className={styles.rowActions}>
                          {!isParent && (
                            <Link
                              href={`/products/${r.productId}`}
                              className={styles.action}
                            >
                              Edit product
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.pager}>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => {
                const next = Math.max(1, page - 1);
                setPage(next);
                load(next);
              }}
              disabled={loading || !(meta?.hasPrev ?? page > 1)}
            >
              ← Prev
            </button>
            <span className={styles.pageInfo}>
              Page {meta?.page || page}
              {meta?.pages ? ` of ${meta.pages}` : ""}
              {typeof meta?.total === "number" ? ` · ${meta.total} products` : ""}
            </span>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => {
                const next = page + 1;
                setPage(next);
                load(next);
              }}
              disabled={loading || !(meta?.hasNext ?? items.length >= 60)}
            >
              Next →
            </button>
          </div>
        </>
      )}

      {!hasFetched && !loading && (
        <p className={styles.emptyState}>
          Pick a date range, category, or product list above and hit{" "}
          <strong>Fetch Filtered Inventory</strong> to see stock.
        </p>
      )}
    </AdminShell>
  );
}
