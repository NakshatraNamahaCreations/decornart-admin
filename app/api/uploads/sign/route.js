// Signs a Cloudinary upload request server-side so the api_secret never
// reaches the browser. The admin frontend calls this endpoint, receives a
// short-lived signature + timestamp, and uploads the file directly to
// Cloudinary. Gated to admin role via the upstream /auth/me endpoint.

import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

function readEnv(name) {
  // Defensive .trim() — the .env example contains a stray tab between the
  // key and value in places; trimming keeps the signature stable.
  return (process.env[name] || "").trim();
}

async function verifyAdmin(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: authHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const user = json && json.data;
    if (!user || user.role !== "admin") return null;
    return user;
  } catch {
    return null;
  }
}

export async function POST(request) {
  const CLOUD_NAME = readEnv("CLOUDINARY_CLOUD_NAME");
  const API_KEY = readEnv("CLOUDINARY_API_KEY");
  const API_SECRET = readEnv("CLOUDINARY_API_SECRET");

  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return NextResponse.json(
      {
        error:
          "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Decor N Art-admin/.env.local.",
      },
      { status: 500 }
    );
  }

  const user = await verifyAdmin(request.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    /* empty body is fine */
  }
  const folder = (body.folder || "Decor N Art/products").toString();
  const timestamp = Math.floor(Date.now() / 1000);

  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
  });

  // Only fields we sign here are what we send up with the file.
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    API_SECRET
  );

  return NextResponse.json({
    signature,
    timestamp,
    apiKey: API_KEY,
    cloudName: CLOUD_NAME,
    folder,
  });
}
