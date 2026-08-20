"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminShell from "@/components/AdminShell/AdminShell";
import { listBanners, deleteBanner, reorderBanners } from "@/lib/api/admin";
import styles from "./banners.module.css";

const SLOT_LABELS = {
  "homepage-hero": "Home banners",
  "category-banner": "Category banners",
  "about-hero": "About page hero",
  "shop-hero": "Shop page hero",
  "offers-hero": "Offers page hero",
  "craft-essentials-hero": "Craft Essentials hero",
  "inspiration-gallery-hero": "Inspiration Gallery hero",
  "checkout-hero": "Checkout page hero",
  "thank-you-hero": "Thank-you page hero",
  "collections-hero": "Collections / New Arrivals hero",
  "contact-hero": "Contact page hero",
  "categories-hero": "Categories page hero",
  "gallery-hero": "Gallery page hero",
  "special-moments": "Special Moments cards",
  "promo-banner": "Promo banner cards",
  // Legacy slots kept for banners created before the picker was simplified.
  "homepage-mid": "Homepage mid-promo (legacy)",
  "announcement-bar": "Announcement bar (legacy)",
};

export default function BannersListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listBanners();
      setItems(data || []);
    } catch (e) {
      setError(e.message || "Could not load banners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const bySlot = new Map();
    for (const b of items) {
      if (!bySlot.has(b.slot)) bySlot.set(b.slot, []);
      bySlot.get(b.slot).push(b);
    }
    return Array.from(bySlot.entries()); // [[slot, banners[]], ...]
  }, [items]);

  const move = async (slot, id, dir) => {
    const list = items.filter((b) => b.slot === slot);
    const idx = list.findIndex((b) => b.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= list.length) return;
    const nextList = [...list];
    [nextList[idx], nextList[target]] = [nextList[target], nextList[idx]];
    // Reflect the new order in the outer items array.
    const others = items.filter((b) => b.slot !== slot);
    setItems([...others, ...nextList].sort((a, b) => a.slot.localeCompare(b.slot)));
    setBusy(true);
    try {
      await reorderBanners(nextList.map((b) => b.id));
    } catch (e) {
      setError(e.message || "Could not save order.");
      load();
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (banner) => {
    if (!window.confirm(`Delete "${banner.title || banner.slot} banner"?`)) return;
    setBusy(true);
    try {
      await deleteBanner(banner.id);
      setItems((prev) => prev.filter((b) => b.id !== banner.id));
    } catch (e) {
      window.alert(e.message || "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Content</span>
          <h1 className={styles.heading}>Banners & sliders</h1>
        </div>
        <Link href="/banners/new" className={styles.cta}>+ New banner</Link>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : items.length === 0 ? (
        <p className={styles.muted}>
          No banners yet. <Link href="/banners/new" className={styles.inlineLink}>Add one →</Link>
        </p>
      ) : (
        grouped.map(([slot, banners]) => (
          <section key={slot} className={styles.slotBlock}>
            <header className={styles.slotHead}>
              <h2 className={styles.slotTitle}>{SLOT_LABELS[slot] || slot}</h2>
              <span className={styles.mute}>{banners.length} banner{banners.length === 1 ? "" : "s"}</span>
            </header>
            <ul className={styles.bannerList}>
              {banners.map((b, i) => (
                <li key={b.id} className={styles.bannerRow}>
                  <div className={styles.thumb}>
                    {b.image ? (
                      <Image src={b.image} alt="" fill sizes="140px" unoptimized />
                    ) : (
                      <div className={styles.thumbEmpty}>
                        {slot === "announcement-bar" ? "📢" : "—"}
                      </div>
                    )}
                  </div>
                  <div className={styles.bannerBody}>
                    <div className={styles.bannerHead}>
                      <Link href={`/banners/${b.id}`} className={styles.title}>
                        {b.title || <em className={styles.mute}>Untitled</em>}
                      </Link>
                      <span className={`${styles.pill} ${b.active ? styles.pill_active : styles.pill_inactive}`}>
                        {b.active ? "Active" : "Hidden"}
                      </span>
                      {b.visibleOn !== "both" && (
                        <span className={styles.smallPill}>{b.visibleOn}</span>
                      )}
                    </div>
                    {b.subtitle && <p className={styles.subtitle}>{b.subtitle}</p>}
                    <div className={styles.meta}>
                      {b.href && <span>→ {b.href}</span>}
                      {b.categorySlug && <span>Category: {b.categorySlug}</span>}
                    </div>
                  </div>
                  <div className={styles.bannerActions}>
                    <button
                      type="button"
                      onClick={() => move(slot, b.id, -1)}
                      disabled={busy || i === 0}
                      className={styles.iconBtn}
                      aria-label="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => move(slot, b.id, 1)}
                      disabled={busy || i === banners.length - 1}
                      className={styles.iconBtn}
                      aria-label="Move down"
                    >
                      ▼
                    </button>
                    <Link href={`/banners/${b.id}`} className={styles.action}>Edit</Link>
                    <button
                      type="button"
                      onClick={() => onDelete(b)}
                      disabled={busy}
                      className={`${styles.action} ${styles.actionDanger}`}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </AdminShell>
  );
}
