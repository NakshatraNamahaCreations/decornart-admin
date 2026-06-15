"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadImage, isCloudinaryConfigured } from "@/lib/cloudinary";
import styles from "./ProductForm.module.css";

const CATEGORIES = ["signature", "handmade", "classic", "seasonal"];
const STATUSES = ["active", "draft", "archived"];

const EMPTY = {
  slug: "",
  name: "",
  description: "",
  price: "",
  occasion: "",
  occasions: "",
  category: "signature",
  stems: "",
  images: [],
  stock: 100,
  isNew: false,
  isBestseller: false,
  status: "active",
};

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toFormState(product) {
  if (!product) return EMPTY;
  return {
    ...EMPTY,
    ...product,
    occasions: Array.isArray(product.occasions) ? product.occasions.join(", ") : (product.occasions || ""),
    images: Array.isArray(product.images) ? product.images : [],
  };
}

export default function ProductForm({ initial, submitLabel = "Save", onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toFormState(initial));
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef(null);

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const onText = (key) => (e) => update(key, e.target.value);
  const onCheck = (key) => (e) => update(key, e.target.checked);
  const onNumber = (key) => (e) => update(key, e.target.value);

  const onNameBlur = () => {
    if (!form.slug && form.name) update("slug", slugify(form.name));
  };

  const handleUpload = async (files) => {
    if (!files || !files.length) return;
    if (!isCloudinaryConfigured()) {
      setError(
        "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in decornart-admin/.env.local."
      );
      return;
    }
    setError("");
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        // eslint-disable-next-line no-await-in-loop
        const result = await uploadImage(file);
        uploaded.push(result.url);
      }
      setForm((p) => ({ ...p, images: [...p.images, ...uploaded] }));
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const removeImage = (url) =>
    setForm((p) => ({ ...p, images: p.images.filter((u) => u !== url) }));

  const moveImage = (url, dir) =>
    setForm((p) => {
      const idx = p.images.indexOf(url);
      if (idx < 0) return p;
      const next = [...p.images];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return p;
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...p, images: next };
    });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      occasion: form.occasion.trim() || undefined,
      occasions: form.occasions
        ? form.occasions
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      category: form.category,
      stems: form.stems.trim() || undefined,
      images: form.images,
      stock: Number(form.stock || 0),
      isNew: !!form.isNew,
      isBestseller: !!form.isBestseller,
      status: form.status,
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

  return (
    <form className={styles.form} onSubmit={submit}>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.grid}>
        <Section title="Basics">
          <Row>
            <Field label="Name" required>
              <input
                type="text"
                required
                className={styles.input}
                value={form.name}
                onChange={onText("name")}
                onBlur={onNameBlur}
              />
            </Field>
            <Field label="Slug" required >
              <input
                type="text"
                required
                className={styles.input}
                value={form.slug}
                onChange={(e) => update("slug", slugify(e.target.value))}
              />
            </Field>
          </Row>

          <Field label="Description">
            <textarea
              rows={4}
              className={`${styles.input} ${styles.textarea}`}
              value={form.description}
              onChange={onText("description")}
            />
          </Field>

          <Row>
            <Field label="Category" required>
              <select
                className={styles.input}
                value={form.category}
                onChange={onText("category")}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                className={styles.input}
                value={form.status}
                onChange={onText("status")}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </Row>
        </Section>

        <Section title="Pricing & inventory">
          <Row>
            <Field label="Price (INR)" required>
              <input
                type="number"
                min="0"
                step="1"
                required
                className={styles.input}
                value={form.price}
                onChange={onNumber("price")}
              />
            </Field>
            <Field label="Stock">
              <input
                type="number"
                min="0"
                step="1"
                className={styles.input}
                value={form.stock}
                onChange={onNumber("stock")}
              />
            </Field>
          </Row>

          <Row>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={!!form.isNew}
                onChange={onCheck("isNew")}
              />
              <span>Mark as New</span>
            </label>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={!!form.isBestseller}
                onChange={onCheck("isBestseller")}
              />
              <span>Bestseller</span>
            </label>
          </Row>
        </Section>

        <Section title="Occasions & stems">
          <Row>
            <Field label="Primary occasion">
              <input
                type="text"
                className={styles.input}
                placeholder="Anniversary"
                value={form.occasion}
                onChange={onText("occasion")}
              />
            </Field>
            <Field label="Occasions (filters)">
              <input
                type="text"
                className={styles.input}
                placeholder="anniversary, just-because"
                value={form.occasions}
                onChange={onText("occasions")}
              />
            </Field>
          </Row>

          <Field label="Stems / materials">
            <textarea
              rows={3}
              className={`${styles.input} ${styles.textarea}`}
              placeholder="Garden roses · 5 stems&#10;Ranunculus · 7 stems"
              value={form.stems}
              onChange={onText("stems")}
            />
          </Field>
        </Section>

        <Section title="Images" hint={!isCloudinaryConfigured() ? "Cloudinary not configured — see .env.local.example" : null}>
          <div className={styles.gallery}>
            {form.images.length === 0 && (
              <p className={styles.muted}>No images yet — upload at least one.</p>
            )}
            {form.images.map((url, i) => (
              <div key={url} className={styles.thumb}>
                <Image
                  src={url}
                  alt={`Image ${i + 1}`}
                  fill
                  sizes="200px"
                  unoptimized
                />
                {i === 0 && <span className={styles.primaryBadge}>Primary</span>}
                <div className={styles.thumbActions}>
                  <button
                    type="button"
                    onClick={() => moveImage(url, -1)}
                    disabled={i === 0}
                    aria-label="Move left"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(url, 1)}
                    disabled={i === form.images.length - 1}
                    aria-label="Move right"
                  >
                    ▶
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    aria-label="Remove"
                    className={styles.removeBtn}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.uploadRow}>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleUpload(e.target.files)}
              className={styles.fileInput}
              id="product-images"
            />
            <label htmlFor="product-images" className={styles.uploadBtn}>
              {uploading ? "Uploading…" : "Upload images"}
            </label>
          </div>
        </Section>
      </div>

      <footer className={styles.footer}>
        {onCancel && (
          <button type="button" className={styles.ghost} onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className={styles.submit} disabled={submitting || uploading}>
          {submitting ? "Saving…" : submitLabel}
        </button>
      </footer>
    </form>
  );
}

function Section({ title, hint, children }) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {hint && <span className={styles.sectionHint}>{hint}</span>}
      </header>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function Row({ children }) {
  return <div className={styles.row}>{children}</div>;
}

function Field({ label, hint, required, children }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>
        {label}
        {required && <span className={styles.required}> *</span>}
        {hint && <span className={styles.fieldHint}> · {hint}</span>}
      </span>
      {children}
    </label>
  );
}
