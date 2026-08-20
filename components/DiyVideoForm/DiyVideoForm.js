"use client";

import { useState } from "react";
import Image from "next/image";
import { uploadImage, uploadVideo, isCloudinaryConfigured } from "@/lib/cloudinary";
import styles from "./DiyVideoForm.module.css";

const EMPTY = {
  thumbnail: "",
  videoUrl: "",
  position: 0,
  active: true,
};

function toFormState(initial) {
  if (!initial) return EMPTY;
  return {
    thumbnail: initial.thumbnail || "",
    videoUrl: initial.videoUrl || "",
    position: initial.position ?? 0,
    active: initial.active !== false,
  };
}

export default function DiyVideoForm({
  initial,
  submitLabel = "Save",
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(() => toFormState(initial));
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const onText = (key) => (e) => update(key, e.target.value);

  const handleThumbUpload = async (files) => {
    if (!files || !files.length) return;
    if (!isCloudinaryConfigured()) {
      setError("Cloudinary is not configured.");
      return;
    }
    setError("");
    setUploadingThumb(true);
    try {
      const result = await uploadImage(files[0], {
        folder: "Decor N Art/diy-videos",
      });
      update("thumbnail", result.url);
    } catch (err) {
      setError(err.message || "Thumbnail upload failed.");
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleVideoUpload = async (files) => {
    if (!files || !files.length) return;
    if (!isCloudinaryConfigured()) {
      setError("Cloudinary is not configured.");
      return;
    }
    setError("");
    setUploadingVideo(true);
    try {
      const result = await uploadVideo(files[0], {
        folder: "Decor N Art/diy-videos",
      });
      update("videoUrl", result.url);
    } catch (err) {
      setError(err.message || "Video upload failed.");
    } finally {
      setUploadingVideo(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.thumbnail.trim()) return setError("Thumbnail is required.");
    if (!form.videoUrl.trim()) return setError("Video URL is required.");

    const payload = {
      thumbnail: form.thumbnail.trim(),
      videoUrl: form.videoUrl.trim(),
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
        </header>
        <div className={styles.sectionBody}>
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
          <h2 className={styles.sectionTitle}>Thumbnail</h2>
          <span className={styles.sectionHint}>
            Poster image shown on the card before the video plays
          </span>
        </header>
        <div className={styles.sectionBody}>
          {form.thumbnail && (
            <div className={styles.thumbPreview}>
              <Image
                src={form.thumbnail}
                alt=""
                fill
                sizes="240px"
                unoptimized
              />
            </div>
          )}
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Thumbnail URL *</span>
            <input
              type="url"
              className={styles.input}
              placeholder="https://res.cloudinary.com/…/image.jpg"
              value={form.thumbnail}
              onChange={onText("thumbnail")}
              required
            />
          </label>
          <div className={styles.uploadRow}>
            <input
              type="file"
              accept="image/*"
              id="diy-thumb"
              className={styles.fileInput}
              onChange={(e) => handleThumbUpload(e.target.files)}
            />
            <label htmlFor="diy-thumb" className={styles.uploadBtn}>
              {uploadingThumb
                ? "Uploading…"
                : form.thumbnail
                  ? "Replace thumbnail"
                  : "Upload thumbnail"}
            </label>
            {form.thumbnail && (
              <button
                type="button"
                className={styles.ghost}
                onClick={() => update("thumbnail", "")}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Video</h2>
          <span className={styles.sectionHint}>
            YouTube, Vimeo, or direct MP4 (Cloudinary)
          </span>
        </header>
        <div className={styles.sectionBody}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Video URL *</span>
            <input
              type="url"
              className={styles.input}
              placeholder="https://youtu.be/… or https://res.cloudinary.com/…/video.mp4"
              value={form.videoUrl}
              onChange={onText("videoUrl")}
              required
            />
          </label>
          <div className={styles.uploadRow}>
            <input
              type="file"
              accept="video/*"
              id="diy-video"
              className={styles.fileInput}
              onChange={(e) => handleVideoUpload(e.target.files)}
            />
            <label htmlFor="diy-video" className={styles.uploadBtn}>
              {uploadingVideo
                ? "Uploading…"
                : form.videoUrl
                  ? "Replace video"
                  : "Upload video"}
            </label>
            {form.videoUrl && (
              <button
                type="button"
                className={styles.ghost}
                onClick={() => update("videoUrl", "")}
              >
                Clear
              </button>
            )}
          </div>
          {form.videoUrl && (
            <p className={styles.currentUrl}>Current: {form.videoUrl}</p>
          )}
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
          disabled={submitting || uploadingThumb || uploadingVideo}
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </footer>
    </form>
  );
}
