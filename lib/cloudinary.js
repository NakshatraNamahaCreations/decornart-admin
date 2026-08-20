"use client";

// Signed Cloudinary uploads. The browser asks our own /api/uploads/sign
// (a Next.js Route Handler) for a short-lived signature, then POSTs the
// file directly to Cloudinary. The api_secret stays on the server.

import { getAccessToken } from "@/lib/api/client";

// We can't actually check from the client whether the server has Cloudinary
// configured (the env vars aren't public). Always report "configured" and
// let the actual upload error speak for itself if it isn't.
export function isCloudinaryConfigured() {
  return true;
}

async function fetchSignature(folder) {
  const token = getAccessToken();
  if (!token) {
    throw new Error("You are not signed in.");
  }
  const res = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ folder }),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j.error || "";
    } catch {
      /* ignore */
    }
    throw new Error(detail || "Could not get an upload signature.");
  }
  return res.json();
}

async function uploadToCloudinary(file, folder, resourceType) {
  const {
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder: signedFolder,
  } = await fetchSignature(folder);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", signedFolder);

  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = (j.error && j.error.message) || "";
    } catch {
      /* ignore */
    }
    throw new Error(`Cloudinary upload failed${detail ? `: ${detail}` : ""}`);
  }
  const json = await res.json();
  return {
    url: json.secure_url,
    publicId: json.public_id,
    width: json.width,
    height: json.height,
    bytes: json.bytes,
    duration: json.duration,
  };
}

export async function uploadImage(file, { folder = "Decor N Art/products" } = {}) {
  return uploadToCloudinary(file, folder, "image");
}

export async function uploadVideo(file, { folder = "Decor N Art/product-videos" } = {}) {
  return uploadToCloudinary(file, folder, "video");
}
