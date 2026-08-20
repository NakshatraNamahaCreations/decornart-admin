"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { uploadImage, isCloudinaryConfigured } from "@/lib/cloudinary";
import { listCategories } from "@/lib/api/admin";
import styles from "./BannerForm.module.css";

// Picker-selectable slots. Other slots (announcement-bar, homepage-mid)
// remain valid in the backend enum so legacy banners keep working — the
// picker just doesn't offer them anymore.
const SLOTS = [
  { value: "homepage-hero", label: "Home banner" },
  { value: "category-banner", label: "Category banner" },
  { value: "about-hero", label: "About page hero" },
  { value: "shop-hero", label: "Shop page hero" },
  { value: "offers-hero", label: "Offers page hero" },
  { value: "craft-essentials-hero", label: "Craft Essentials hero" },
  { value: "inspiration-gallery-hero", label: "Inspiration Gallery hero" },
  { value: "checkout-hero", label: "Checkout page hero" },
  { value: "thank-you-hero", label: "Thank-you page hero" },
  { value: "collections-hero", label: "Collections / New Arrivals hero" },
  { value: "contact-hero", label: "Contact page hero" },
  { value: "categories-hero", label: "Categories page hero" },
  { value: "gallery-hero", label: "Gallery page hero" },
  { value: "wholesale-hero", label: "Wholesale page hero" },
  { value: "special-moments", label: "Special Moments card (homepage)" },
  { value: "promo-banner", label: "Promo banner card (homepage)" },
];

const EMPTY = {
  slot: "homepage-hero",
  eyebrow: "",
  title: "",
  script: "",
  scriptStyle: "script",
  subtitle: "",
  image: "",
  imageMobile: "",
  href: "",
  ctaLabel: "",
  position: 0,
  active: true,
  visibleOn: "both",
  categorySlug: "",
};

function toFormState(initial) {
  if (!initial) return EMPTY;
  return {
    ...EMPTY,
    ...initial,
  };
}

export default function BannerForm({ initial, submitLabel = "Save", onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toFormState(initial));
  const [categories, setCategories] = useState([]);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const desktopInput = useRef(null);
  const mobileInput = useRef(null);

  useEffect(() => {
    let cancelled = false;
    listCategories()
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const onText = (key) => (e) => update(key, e.target.value);
  const onCheck = (key) => (e) => update(key, e.target.checked);

  const uploadTo = async (files, setter, key) => {
    if (!files?.length) return;
    setError("");
    setter(true);
    try {
      const uploaded = await uploadImage(files[0], { folder: "Decor N Art/banners" });
      update(key, uploaded.url);
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setter(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      slot: form.slot,
      eyebrow: form.eyebrow.trim(),
      title: form.title.trim(),
      script: form.script.trim(),
      scriptStyle: form.scriptStyle || "script",
      subtitle: form.subtitle.trim(),
      image: form.image || "",
      imageMobile: form.imageMobile || "",
      href: form.href.trim(),
      ctaLabel: form.ctaLabel.trim(),
      position: Number(form.position) || 0,
      active: !!form.active,
      // Scheduling deprecated in the UI — always send null so the backend
      // stores an unbounded window (active flag is now the only gate).
      startAt: null,
      endAt: null,
      visibleOn: form.visibleOn,
      categorySlug: form.categorySlug || "",
    };
    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      const detail = err.details
        ? ` — ${err.details.map((d) => d.message || d).join("; ")}`
        : "";
      setError(`${err.message || "Save failed."}${detail}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isText = form.slot === "announcement-bar";
  const busy = submitting || uploadingDesktop || uploadingMobile;
  const cloudinaryReady = isCloudinaryConfigured();

  // If the current slot isn't in the picker list (a legacy banner), append it
  // so the select doesn't fall back to a blank / mismatched value on edit.
  const slotOptions = SLOTS.some((s) => s.value === form.slot)
    ? SLOTS
    : [...SLOTS, { value: form.slot, label: `${form.slot} (legacy)` }];

  return (
    <form className={styles.form} onSubmit={submit}>
      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Placement</h2>
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Slot<span className={styles.required}> *</span></span>
            <select className={styles.input} value={form.slot} onChange={onText("slot")}>
              {slotOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Show on</span>
            <select className={styles.input} value={form.visibleOn} onChange={onText("visibleOn")}>
              <option value="both">Desktop & mobile</option>
              <option value="desktop">Desktop only</option>
              <option value="mobile">Mobile only</option>
            </select>
          </label>
        </div>

        {form.slot === "category-banner" && (
          <label className={styles.field}>
            <span className={styles.label}>Category</span>
            <select
              className={styles.input}
              value={form.categorySlug}
              onChange={onText("categorySlug")}
            >
              <option value="">— Select category —</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </label>
        )}

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Position</span>
            <input
              type="number"
              min="0"
              step="1"
              className={styles.input}
              value={form.position}
              onChange={onText("position")}
            />
          </label>
          <label className={styles.toggle}>
            <input type="checkbox" checked={!!form.active} onChange={onCheck("active")} />
            <span>Active</span>
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Content</h2>
        {!isText && (
          <label className={styles.field}>
            <span className={styles.label}>
              Eyebrow
              {/* <span className={styles.hint}>Small caps line shown above the title</span> */}
            </span>
            <input
              type="text"
              className={styles.input}
              value={form.eyebrow}
              onChange={onText("eyebrow")}
              maxLength={120}
              placeholder="Premium Craft Supplies"
            />
          </label>
        )}
        <label className={styles.field}>
          <span className={styles.label}>{isText ? "Message" : "Title"}</span>
          <input
            type="text"
            className={styles.input}
            value={form.title}
            onChange={onText("title")}
            maxLength={200}
            placeholder={isText ? "Free shipping on orders over ₹2500 🎁" : "Handpicked craft supplies"}
          />
        </label>

        {!isText && (
          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>Script accent</span>
              <input
                type="text"
                className={styles.input}
                value={form.script}
                onChange={onText("script")}
                maxLength={120}
                placeholder="Never Forget ♥"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Script style</span>
              <select
                className={styles.input}
                value={form.scriptStyle}
                onChange={onText("scriptStyle")}
              >
                <option value="script">Cursive script (Allura)</option>
                <option value="serif">Italic serif (Cormorant)</option>
                <option value="uppercase">Uppercase sans (Poppins)</option>
              </select>
            </label>
          </div>
        )}

        {!isText && (
          <label className={styles.field}>
            <span className={styles.label}>Subtitle</span>
            <input
              type="text"
              className={styles.input}
              value={form.subtitle}
              onChange={onText("subtitle")}
              maxLength={300}
            />
          </label>
        )}

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Link URL</span>
            <input
              type="text"
              className={styles.input}
              value={form.href}
              onChange={onText("href")}
              placeholder="/shop"
              maxLength={500}
            />
          </label>
          {!isText && (
            <label className={styles.field}>
              <span className={styles.label}>Button label</span>
              <input
                type="text"
                className={styles.input}
                value={form.ctaLabel}
                onChange={onText("ctaLabel")}
                placeholder="Shop now"
                maxLength={60}
              />
            </label>
          )}
        </div>
      </section>

      {!isText && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Images
            <span className={styles.hint}>Wide desktop + optional mobile crop</span>
          </h2>

          <div className={styles.imageBlock}>
            <span className={styles.imageLabel}>Desktop image</span>
            {form.image ? (
              <div className={styles.previewWide}>
                <Image src={form.image} alt="" fill sizes="640px" unoptimized />
                <button
                  type="button"
                  onClick={() => update("image", "")}
                  className={styles.removeBtn}
                  aria-label="Remove image"
                >
                  ✕
                </button>
              </div>
            ) : (
              <p className={styles.muted}>Upload a wide image (16:6 works well).</p>
            )}
            <div className={styles.uploadRow}>
              <input
                ref={desktopInput}
                type="file"
                accept="image/*"
                onChange={(e) => uploadTo(e.target.files, setUploadingDesktop, "image")}
                id="banner-desktop"
                className={styles.fileInput}
                disabled={!cloudinaryReady}
              />
              <label htmlFor="banner-desktop" className={styles.uploadBtn}>
                {uploadingDesktop ? "Uploading…" : form.image ? "Replace desktop" : "Upload desktop"}
              </label>
            </div>
          </div>

          <div className={styles.imageBlock}>
            <span className={styles.imageLabel}>Mobile image (optional)</span>
            {form.imageMobile ? (
              <div className={styles.previewMobile}>
                <Image src={form.imageMobile} alt="" fill sizes="320px" unoptimized />
                <button
                  type="button"
                  onClick={() => update("imageMobile", "")}
                  className={styles.removeBtn}
                  aria-label="Remove mobile image"
                >
                  ✕
                </button>
              </div>
            ) : (
              <p className={styles.muted}>Only needed if the desktop crop doesn't work on phones.</p>
            )}
            <div className={styles.uploadRow}>
              <input
                ref={mobileInput}
                type="file"
                accept="image/*"
                onChange={(e) => uploadTo(e.target.files, setUploadingMobile, "imageMobile")}
                id="banner-mobile"
                className={styles.fileInput}
                disabled={!cloudinaryReady}
              />
              <label htmlFor="banner-mobile" className={styles.uploadBtn}>
                {uploadingMobile ? "Uploading…" : form.imageMobile ? "Replace mobile" : "Upload mobile"}
              </label>
            </div>
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        {onCancel && (
          <button type="button" className={styles.ghost} onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className={styles.submit} disabled={busy}>
          {submitting ? "Saving…" : submitLabel}
        </button>
      </footer>
    </form>
  );
}
