"use client";

import { useState } from "react";
import Image from "next/image";
import { uploadImage, isCloudinaryConfigured } from "@/lib/cloudinary";
import styles from "@/components/DiyVideoForm/DiyVideoForm.module.css";

const EMPTY = {
  image: "",
  alt: "",
  link: "",
  position: 0,
  active: true,
};

function toFormState(initial) {
  if (!initial) return EMPTY;
  return {
    image: initial.image || "",
    alt: initial.alt || "",
    link: initial.link || "",
    position: initial.position ?? 0,
    active: initial.active !== false,
  };
}

export default function InstagramPostForm({
  initial,
  submitLabel = "Save",
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(() => toFormState(initial));
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const onText = (key) => (e) => update(key, e.target.value);

  const handleImageUpload = async (files) => {
    if (!files || !files.length) return;
    if (!isCloudinaryConfigured()) {
      setError("Cloudinary is not configured.");
      return;
    }
    setError("");
    setUploadingImage(true);
    try {
      const result = await uploadImage(files[0], {
        folder: "Decor N Art/instagram",
      });
      update("image", result.url);
    } catch (err) {
      setError(err.message || "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.image.trim()) return setError("Image is required.");

    const payload = {
      image: form.image.trim(),
      alt: form.alt.trim(),
      link: form.link.trim(),
      position: Number(form.position || 0),
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

  return (
    <form className={styles.form} onSubmit={submit}>
      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.section}>
        <header className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Card details</h2>
          <span className={styles.sectionHint}>
            Alt text is for screen readers. Link opens on tile click.
          </span>
        </header>
        <div className={styles.sectionBody}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Alt text</span>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Butterfly luxe gift box"
              value={form.alt}
              onChange={onText("alt")}
              maxLength={200}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Link (optional)</span>
            <input
              type="url"
              className={styles.input}
              placeholder="https://www.instagram.com/p/..."
              value={form.link}
              onChange={onText("link")}
              maxLength={600}
            />
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Position</span>
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
                onChange={(e) => update("active", e.target.checked)}
              />
              <span>Active (visible on storefront)</span>
            </label>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Image</h2>
          <span className={styles.sectionHint}>
            Square-ish crops look best in the Instagram grid
          </span>
        </header>
        <div className={styles.sectionBody}>
          {form.image && (
            <div className={styles.thumbPreview}>
              <Image
                src={form.image}
                alt=""
                fill
                sizes="240px"
                unoptimized
              />
            </div>
          )}
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Image URL *</span>
            <input
              type="url"
              className={styles.input}
              placeholder="https://res.cloudinary.com/…/image.jpg"
              value={form.image}
              onChange={onText("image")}
              required
            />
          </label>
          <div className={styles.uploadRow}>
            <input
              type="file"
              accept="image/*"
              id="instagram-image"
              className={styles.fileInput}
              onChange={(e) => handleImageUpload(e.target.files)}
            />
            <label htmlFor="instagram-image" className={styles.uploadBtn}>
              {uploadingImage
                ? "Uploading…"
                : form.image
                  ? "Replace image"
                  : "Upload image"}
            </label>
            {form.image && (
              <button
                type="button"
                className={styles.ghost}
                onClick={() => update("image", "")}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        {onCancel && (
          <button type="button" className={styles.ghost} onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          className={styles.submit}
          disabled={submitting || uploadingImage}
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </footer>
    </form>
  );
}
