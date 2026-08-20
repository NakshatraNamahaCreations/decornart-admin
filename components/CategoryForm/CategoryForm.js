"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadImage, isCloudinaryConfigured } from "@/lib/cloudinary";
import styles from "./CategoryForm.module.css";

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EMPTY = {
  slug: "",
  name: "",
  description: "",
  banner: "",
  image: "",
  position: 0,
  active: true,
};

function toFormState(initial) {
  if (!initial) return EMPTY;
  return {
    ...EMPTY,
    ...initial,
    active: initial.active !== false,
  };
}

export default function CategoryForm({ initial, submitLabel = "Save", onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toFormState(initial));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const bannerInput = useRef(null);
  const imageInput = useRef(null);

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const onText = (key) => (e) => update(key, e.target.value);
  const onCheck = (key) => (e) => update(key, e.target.checked);

  const onNameBlur = () => {
    if (!initial && !form.slug && form.name) update("slug", slugify(form.name));
  };

  const handleBannerUpload = async (files) => {
    if (!files?.length) return;
    setError("");
    setUploadingBanner(true);
    try {
      const uploaded = await uploadImage(files[0], { folder: "Decor N Art/categories" });
      update("banner", uploaded.url);
    } catch (err) {
      setError(err.message || "Banner upload failed.");
    } finally {
      setUploadingBanner(false);
      if (bannerInput.current) bannerInput.current.value = "";
    }
  };

  const handleImageUpload = async (files) => {
    if (!files?.length) return;
    setError("");
    setUploadingImage(true);
    try {
      const uploaded = await uploadImage(files[0], { folder: "Decor N Art/categories" });
      update("image", uploaded.url);
    } catch (err) {
      setError(err.message || "Tile upload failed.");
    } finally {
      setUploadingImage(false);
      if (imageInput.current) imageInput.current.value = "";
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      banner: form.banner || "",
      image: form.image || "",
      position: Number(form.position) || 0,
      active: !!form.active,
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

  const busy = submitting || uploadingBanner || uploadingImage;
  const cloudinaryReady = isCloudinaryConfigured();

  return (
    <form className={styles.form} onSubmit={submit}>
      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Basics</h2>
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Name<span className={styles.required}> *</span></span>
            <input
              type="text"
              required
              className={styles.input}
              value={form.name}
              onChange={onText("name")}
              onBlur={onNameBlur}
              maxLength={120}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Slug<span className={styles.required}> *</span></span>
            <input
              type="text"
              required
              className={styles.input}
              value={form.slug}
              onChange={(e) => update("slug", slugify(e.target.value))}
              maxLength={80}
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Description</span>
          <textarea
            rows={3}
            className={`${styles.input} ${styles.textarea}`}
            value={form.description}
            onChange={onText("description")}
            maxLength={500}
          />
        </label>

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
            <input
              type="checkbox"
              checked={!!form.active}
              onChange={onCheck("active")}
            />
            <span>Active — visible on storefront</span>
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Banner
          <span className={styles.hint}>Wide hero image on /category/{form.slug || "…"}</span>
        </h2>
        {form.banner ? (
          <div className={styles.previewWide}>
            <Image src={form.banner} alt="" fill sizes="640px" unoptimized />
            <button
              type="button"
              onClick={() => update("banner", "")}
              className={styles.removeBtn}
              aria-label="Remove banner"
            >
              ✕
            </button>
          </div>
        ) : (
          <p className={styles.muted}>No banner yet — upload a wide image (16:9 works best).</p>
        )}
        <div className={styles.uploadRow}>
          <input
            ref={bannerInput}
            type="file"
            accept="image/*"
            onChange={(e) => handleBannerUpload(e.target.files)}
            id="cat-banner"
            className={styles.fileInput}
            disabled={!cloudinaryReady}
          />
          <label htmlFor="cat-banner" className={styles.uploadBtn}>
            {uploadingBanner ? "Uploading…" : form.banner ? "Replace banner" : "Upload banner"}
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Tile image
          <span className={styles.hint}>Square-ish thumb used on /categories index</span>
        </h2>
        {form.image ? (
          <div className={styles.previewSquare}>
            <Image src={form.image} alt="" fill sizes="180px" unoptimized />
            <button
              type="button"
              onClick={() => update("image", "")}
              className={styles.removeBtn}
              aria-label="Remove tile image"
            >
              ✕
            </button>
          </div>
        ) : (
          <p className={styles.muted}>No tile yet — upload a roughly square image.</p>
        )}
        <div className={styles.uploadRow}>
          <input
            ref={imageInput}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e.target.files)}
            id="cat-image"
            className={styles.fileInput}
            disabled={!cloudinaryReady}
          />
          <label htmlFor="cat-image" className={styles.uploadBtn}>
            {uploadingImage ? "Uploading…" : form.image ? "Replace tile" : "Upload tile"}
          </label>
        </div>
      </section>

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
