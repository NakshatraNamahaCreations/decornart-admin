"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { uploadImage, uploadVideo, isCloudinaryConfigured } from "@/lib/cloudinary";
import { listCategories } from "@/lib/api/admin";
import { FEATURE_ICONS, FEATURE_ICON_KEYS, renderFeatureIcon } from "@/lib/featureIcons";
import styles from "./ProductForm.module.css";

// Category list used to be a hardcoded array. It now lives in the DB and is
// fetched at mount so admin-created categories appear in the dropdown too.
// The fallback ships the original 8 slugs in case the fetch fails so this
// form is never blank.
const FALLBACK_CATEGORIES = [
  { id: "flower-basket-materials", label: "Flower Basket Materials" },
  { id: "gift-cards", label: "Gift Cards" },
  { id: "pipe-cleaners", label: "Pipe Cleaners" },
  { id: "gift-box", label: "Gift Box" },
  { id: "craft-essentials", label: "Craft Essentials" },
  { id: "crochet-materials", label: "Crochet Materials" },
  { id: "ribbons", label: "Ribbons" },
  { id: "wrapping-papers", label: "Wrapping Sheets & Papers" },
];

const STATUSES = ["active", "draft", "archived"];

// Material facet — mirrored on the storefront sidebar as a multi-select
// checkbox group. Slug (lowercase) is what's stored on the product;
// label is what's shown in this form.
const MATERIAL_OPTIONS = [
  { id: "paper", label: "Paper" },
  { id: "wood", label: "Wood" },
  { id: "cotton", label: "Cotton" },
  { id: "glass", label: "Glass" },
  { id: "jute", label: "Jute" },
];

// Occasion facet — the gifting/event moments this product suits. Stored
// in the product's `occasions` array (lowercase slugs). Mirrored on the
// storefront sidebar as multi-select checkboxes.
const OCCASION_OPTIONS = [
  { id: "birthday", label: "Birthday" },
  { id: "anniversary", label: "Anniversary" },
  { id: "wedding", label: "Wedding" },
  { id: "baby-shower", label: "Baby Shower" },
  { id: "house-warming", label: "House Warming" },
  { id: "festivals", label: "Festivals" },
];

// Brand style facet — the visual vibe of the product. Stored in the
// product's `brandStyles` array (lowercase slugs). Mirrored on the
// storefront sidebar as multi-select checkboxes.
const BRAND_STYLE_OPTIONS = [
  { id: "luxury", label: "Luxury" },
  { id: "minimalist", label: "Minimalist" },
  { id: "modern", label: "Modern" },
  { id: "classic", label: "Classic" },
  { id: "rustic", label: "Rustic" },
  { id: "romantic", label: "Romantic" },
  { id: "artisan", label: "Artisan" },
];

// Categories whose product page swaps its hero image when the shopper
// picks a colour. The admin form only reveals the "Colour images" upload
// section — and the payload only carries a non-empty `colorImages` array —
// for products in these categories. Add a slug here to opt-in.
const CATEGORIES_WITH_COLOR_IMAGES = new Set([
  "pipe-cleaners",
  "crochet-materials",
]);

// Preset color palette shown as clickable swatches in the admin form. Each
// entry maps a display name to a rough hex so the swatch renders visually
// instead of just a label. Order mirrors the pipe-cleaners catalog so hues
// group together in the picker.
const PRESET_COLOR_SWATCHES = [
  // Reds
  { name: "Rose Red", hex: "#c93848" },
  { name: "Blood Red", hex: "#7a0d0d" },
  { name: "Wine Red", hex: "#5c1a2b" },
  { name: "Cherry Red", hex: "#e63946" },
  { name: "Coral Red", hex: "#ff6b6b" },
  { name: "Maroon", hex: "#800000" },
  { name: "Crimson", hex: "#dc143c" },

  // Purples
  { name: "Purple", hex: "#7a3fbf" },
  { name: "Dark Purple", hex: "#3f1d5c" },
  { name: "Violet", hex: "#8f00ff" },
  { name: "Magenta", hex: "#ff00ff" },
  { name: "Plum", hex: "#8e4585" },
  { name: "Mauve", hex: "#b784a7" },
  { name: "Orchid", hex: "#da70d6" },

  // Pinks
  { name: "Pink", hex: "#ff8fb4" },
  { name: "Dark Pink", hex: "#d94f8a" },
  { name: "Hot Pink", hex: "#ff69b4" },
  { name: "Fuchsia", hex: "#ff1493" },
  { name: "Salmon Pink", hex: "#ff91a4" },
  { name: "Rose Pink", hex: "#ffb6c1" },
  { name: "Blush Pink", hex: "#f4c2c2" },

  // Peach / Coral
  { name: "Peach", hex: "#ffbfa0" },
  { name: "Peach Pink", hex: "#ffb0b0" },
  { name: "Coral", hex: "#ff7f50" },
  { name: "Apricot", hex: "#fbceb1" },
  { name: "Salmon", hex: "#fa8072" },

  // Yellows / Golds
  { name: "Lemon Yellow", hex: "#fff275" },
  { name: "Pumpkin Yellow", hex: "#f5b800" },
  { name: "Mustard Yellow", hex: "#e1ad01" },
  { name: "Golden Yellow", hex: "#ffd700" },
  { name: "Gold", hex: "#d4af37" },
  { name: "Cream", hex: "#fffdd0" },
  { name: "Ivory", hex: "#fffff0" },
  { name: "Champagne", hex: "#f7e7ce" },

  // Oranges
  { name: "Orange", hex: "#ff8324" },
  { name: "Dark Orange", hex: "#cc5500" },
  { name: "Burnt Orange", hex: "#cc5500" },
  { name: "Tangerine", hex: "#f28500" },
  { name: "Rust", hex: "#b7410e" },
  { name: "Terracotta", hex: "#e2725b" },

  // Greens
  { name: "Olive Green", hex: "#7d8a2e" },
  { name: "Dark Green", hex: "#1f5c2b" },
  { name: "Army Green", hex: "#4b5320" },
  { name: "Fluorescent Green", hex: "#39ff14" },
  { name: "Emerald Green", hex: "#50c878" },
  { name: "Forest Green", hex: "#228b22" },
  { name: "Sage Green", hex: "#9caf88" },
  { name: "Mint Green", hex: "#98ff98" },
  { name: "Lime Green", hex: "#bfff00" },
  { name: "Teal", hex: "#008080" },

  // Blues
  { name: "Royal Blue", hex: "#1d3fc0" },
  { name: "Ice Blue", hex: "#bfe4ee" },
  { name: "Lake Blue", hex: "#2a7d9b" },
  { name: "Navy Blue", hex: "#000080" },
  { name: "Sky Blue", hex: "#87ceeb" },
  { name: "Turquoise", hex: "#40e0d0" },
  { name: "Cyan", hex: "#00ffff" },
  { name: "Aqua", hex: "#7fdbda" },
  { name: "Cobalt Blue", hex: "#0047ab" },
  { name: "Denim Blue", hex: "#1560bd" },

  // Purples / Lavenders
  { name: "Lavender", hex: "#c8a2d8" },
  { name: "Indigo", hex: "#4b0082" },
  { name: "Periwinkle", hex: "#ccccff" },

  // Browns / Neutrals
  { name: "Light Brown", hex: "#b98c5b" },
  { name: "Dark Brown", hex: "#4a2b1c" },
  { name: "Chocolate Brown", hex: "#7b3f00" },
  { name: "Tan", hex: "#d2b48c" },
  { name: "Camel", hex: "#c19a6b" },
  { name: "Beige", hex: "#e6d3b3" },
  { name: "Nude", hex: "#e3bc9a" },
  { name: "Khaki", hex: "#c3b091" },

  // Greys / Blacks / Whites
  { name: "Light Grey", hex: "#c9c9c9" },
  { name: "Dark Grey", hex: "#5a5a5a" },
  { name: "Charcoal", hex: "#36454f" },
  { name: "Silver", hex: "#c0c0c0" },
  { name: "Black", hex: "#111111" },
  { name: "White", hex: "#ffffff" },
  { name: "Off White", hex: "#faf9f6" },

  // Pastels
  { name: "Pastel Pink", hex: "#ffd1dc" },
  { name: "Pastel Rose", hex: "#ffc0cb" },
  { name: "Pastel Peach", hex: "#ffdab9" },
  { name: "Pastel Coral", hex: "#ffb6a3" },
  { name: "Pastel Yellow", hex: "#fdfd96" },
  { name: "Pastel Cream", hex: "#fff5cd" },
  { name: "Pastel Orange", hex: "#ffcc99" },
  { name: "Pastel Green", hex: "#c1e1c1" },
  { name: "Pastel Mint", hex: "#aaf0d1" },
  { name: "Pastel Sage", hex: "#cddabf" },
  { name: "Pastel Blue", hex: "#aec6cf" },
  { name: "Pastel Sky", hex: "#bde0fe" },
  { name: "Pastel Aqua", hex: "#b2f7ef" },
  { name: "Pastel Turquoise", hex: "#afeeee" },
  { name: "Pastel Purple", hex: "#b39eb5" },
  { name: "Pastel Lavender", hex: "#dcd0ff" },
  { name: "Pastel Lilac", hex: "#c8a2c8" },
  { name: "Pastel Violet", hex: "#cfbfe6" },
  { name: "Pastel Mauve", hex: "#e0b0c0" },
  { name: "Pastel Brown", hex: "#d6b8a1" },
  { name: "Pastel Beige", hex: "#f5e6d3" },
  { name: "Pastel Grey", hex: "#d3d3d3" },
];
const PRESET_COLORS = PRESET_COLOR_SWATCHES.map((c) => c.name);
const SWATCH_HEX = Object.fromEntries(
  PRESET_COLOR_SWATCHES.map((c) => [c.name, c.hex])
);

// Crochet cotton yarn shade card — 41 named colours the supplier ships.
// Kept as a separate list so the admin's Colours picker swaps to this
// palette when the product is in the "crochet-materials" category.
const CROCHET_PRESET_COLOR_SWATCHES = [
  { name: "Pure white", hex: "#ffffff" },
  { name: "Milky white", hex: "#f5f1e7" },
  { name: "Rice noodles", hex: "#eee6ce" },
  { name: "Apricot color", hex: "#f1be8b" },
  { name: "Chestnut brown", hex: "#a94a15" },
  { name: "Dark Khaki", hex: "#9c8968" },
  { name: "Champagne color", hex: "#ead9bc" },
  { name: "Turmeric", hex: "#e5af16" },
  { name: "Champagne gold", hex: "#e8d3b3" },
  { name: "Golden Yellow", hex: "#f5c518" },
  { name: "Gray", hex: "#bfbfbf" },
  { name: "Dark gray", hex: "#6a6a6a" },
  { name: "Light blue", hex: "#b7d3e5" },
  { name: "Mist Blue", hex: "#9dbfdd" },
  { name: "Sapphire blue", hex: "#113f92" },
  { name: "Lake Blue", hex: "#2da6b8" },
  { name: "Light purple", hex: "#cfb5e4" },
  { name: "Skin powder", hex: "#f0c9be" },
  { name: "Deep Purple", hex: "#661793" },
  { name: "Purple", hex: "#a047c8" },
  { name: "Bright Purple", hex: "#b92cba" },
  { name: "Rich Purple", hex: "#722798" },
  { name: "Red", hex: "#c11313" },
  { name: "Bright Red", hex: "#d2101f" },
  { name: "Cherry Red", hex: "#8b1b24" },
  { name: "Wine red", hex: "#5a1b1e" },
  { name: "Coral Pink", hex: "#e97781" },
  { name: "Rouge Powder", hex: "#e7a8bb" },
  { name: "Powder", hex: "#f5c0ce" },
  { name: "Rubber Red", hex: "#b92224" },
  { name: "Peach powder", hex: "#f2c1af" },
  { name: "Emerald green", hex: "#167b3b" },
  { name: "Kong Green", hex: "#4a6221" },
  { name: "Matcha green", hex: "#a6c088" },
  { name: "Bean Green", hex: "#93af66" },
  { name: "Grass Green", hex: "#7ab829" },
  { name: "Dark green", hex: "#0e4a26" },
  { name: "Green", hex: "#1e8a3b" },
  { name: "Kong Lan", hex: "#7da69c" },
  { name: "Bright Blue", hex: "#1961af" },
  { name: "Black", hex: "#000000" },
  { name: "Dark Coffee", hex: "#3a2418" },
];

const EMPTY = {
  slug: "",
  name: "",
  description: "",
  price: "",
  // Original / MRP. Blank means no strikethrough — storefront just shows
  // the sale `price`. Set to a value greater than `price` to display it
  // struck-through alongside a discount %.
  compareAt: "",
  category: "flower-basket-materials",
  // Craft-supply detail fields. Textareas — one line per entry.
  packContents: "",
  usage: "",
  // Materials the product is made from. Multi-select checkbox facet
  // (see MATERIAL_OPTIONS). Stored as lowercase slugs.
  materials: [],
  // Occasions this product suits (multi-select checkbox facet — see
  // OCCASION_OPTIONS). Stored as lowercase slugs on `occasions`.
  occasions: [],
  // Brand style vibes (multi-select checkbox facet — see
  // BRAND_STYLE_OPTIONS). Stored as lowercase slugs on `brandStyles`.
  brandStyles: [],
  // Optional color variants. Array of color names selected from the
  // preset chips or added via the custom input.
  colors: [],
  // Hex overrides keyed by color name — populated for custom colors the
  // admin adds via the picker. Serialised on submit as `colorSwatches`
  // so the storefront can render a real swatch instead of grey.
  colorHex: {},
  // Per-colour image overrides ({ [colorName]: imageUrl }). Kept as an
  // object in local form state for O(1) lookup while editing, then
  // serialised to a `[{ color, image }]` array on submit. Only rendered
  // in the UI when the category is pipe-cleaners.
  colorImages: {},
  // Specifications stored as a single object on save.
  specMaterial: "",
  specPack: "",
  specOrigin: "",
  specFinish: "",
  specThickness: "",
  specLength: "",
  faqs: [],
  // Curated customer reviews shown on the product page's Reviews tab.
  // Each row: { name, rating, date, title, body, verified, helpful }.
  reviews: [],
  // Feature badges rendered under the gallery on the storefront. Each
  // row: { icon, title, copy }. Empty array => storefront falls back
  // to its category default badges.
  featureBadges: [],
  // Priced variants (e.g. 6mm / 8mm pipe cleaners). Each has name/price and
  // optional stock/sku/image. Empty means single-price product.
  variantLabel: "",
  variants: [],
  // Optional product video shown on the storefront's "View Video" button
  // and the DIY tutorial card. `url` may be a Cloudinary MP4, a YouTube
  // link, a Vimeo link, or any direct MP4 URL.
  videoUrl: "",
  videoTitle: "",
  images: [],
  stock: 100,
  isNew: false,
  isBestseller: false,
  status: "active",
};

// Fresh variant row template.
const EMPTY_VARIANT = { name: "", price: "", stock: 100, sku: "", image: "" };

// Fresh review row template.
const EMPTY_REVIEW = {
  name: "",
  rating: 5,
  date: "",
  title: "",
  body: "",
  verified: false,
  helpful: 0,
};

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Convert an incoming product (which may have arrays / objects) into the
// flat string-based form state the inputs work with.
function toFormState(product) {
  if (!product) return EMPTY;
  const specs = product.specs || {};
  return {
    ...EMPTY,
    ...product,
    // Coerce null/undefined to "" so the numeric input stays controlled
    // (React warns when a value flips between "" and null).
    compareAt:
      product.compareAt === null || product.compareAt === undefined
        ? ""
        : product.compareAt,
    images: Array.isArray(product.images) ? product.images : [],
    packContents: Array.isArray(product.packContents)
      ? product.packContents.join("\n")
      : product.packContents || "",
    usage: Array.isArray(product.usage)
      ? product.usage.join("\n")
      : product.usage || "",
    colors: Array.isArray(product.colors)
      ? product.colors.filter(Boolean)
      : [],
    materials: Array.isArray(product.materials)
      ? product.materials.filter(Boolean).map((m) => String(m).toLowerCase())
      : [],
    occasions: Array.isArray(product.occasions)
      ? product.occasions.filter(Boolean).map((o) => String(o).toLowerCase())
      : [],
    brandStyles: Array.isArray(product.brandStyles)
      ? product.brandStyles.filter(Boolean).map((s) => String(s).toLowerCase())
      : [],
    colorImages: Array.isArray(product.colorImages)
      ? Object.fromEntries(
          product.colorImages
            .filter((c) => c && c.color && c.image)
            .map((c) => [c.color, c.image])
        )
      : {},
    colorHex: Array.isArray(product.colorSwatches)
      ? Object.fromEntries(
          product.colorSwatches
            .filter((c) => c && c.color && c.hex)
            .map((c) => [c.color, c.hex])
        )
      : {},
    specMaterial: specs.material || "",
    specPack: specs.pack || "",
    specOrigin: specs.origin || "",
    specFinish: specs.finish || "",
    specThickness: specs.thickness || "",
    specLength: specs.length || "",
    faqs: Array.isArray(product.faqs)
      ? product.faqs.map((f) => ({ q: f?.q || "", a: f?.a || "" }))
      : [],
    reviews: Array.isArray(product.reviews)
      ? product.reviews.map((r) => ({
          name: r?.name || "",
          rating: r?.rating ?? 5,
          date: r?.date || "",
          title: r?.title || "",
          body: r?.body || "",
          verified: !!r?.verified,
          helpful: r?.helpful ?? 0,
        }))
      : [],
    featureBadges: Array.isArray(product.featureBadges)
      ? product.featureBadges.map((b) => ({
          icon: b?.icon || "",
          title: b?.title || "",
          copy: b?.copy || "",
        }))
      : [],
    variants: Array.isArray(product.variants)
      ? product.variants.map((v) => ({
          name: v?.name || "",
          price: v?.price ?? "",
          stock: v?.stock ?? 100,
          sku: v?.sku || "",
          image: v?.image || "",
        }))
      : [],
    videoUrl: product.video?.url || "",
    videoTitle: product.video?.title || "",
  };
}

// Textarea → array. Splits on newlines, trims, drops blanks.
const linesToArray = (s) =>
  String(s || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

export default function ProductForm({ initial, submitLabel = "Save", onSubmit, onCancel }) {
  // eslint-disable-next-line no-console
  console.log("[ProductForm] initial.video on mount:", initial?.video);
  const [form, setForm] = useState(() => toFormState(initial));
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [customColorHex, setCustomColorHex] = useState("#cccccc");
  const [showAllColors, setShowAllColors] = useState(false);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const fileInput = useRef(null);

  useEffect(() => {
    let cancelled = false;
    listCategories()
      .then((data) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        setCategories(data.map((c) => ({ id: c.slug, label: c.name })));
      })
      .catch(() => {
        /* keep FALLBACK_CATEGORIES */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Category-aware preset palette. Crochet materials ship on a distinct
  // 41-shade yarn card; every other category uses the shared preset list.
  const activePresetSwatches =
    form.category === "crochet-materials"
      ? CROCHET_PRESET_COLOR_SWATCHES
      : PRESET_COLOR_SWATCHES;
  const activePresetNames = activePresetSwatches.map((c) => c.name);
  const activeSwatchHex = Object.fromEntries(
    activePresetSwatches.map((c) => [c.name, c.hex])
  );

  const toggleColor = (color) =>
    setForm((p) => {
      const removing = p.colors.includes(color);
      const nextColors = removing
        ? p.colors.filter((c) => c !== color)
        : [...p.colors, color];
      // Seed the preset's hex into `colorHex` so it flows through to
      // `colorSwatches` in the payload — the storefront then renders the
      // right swatch even when the shared COLOR_HEX map doesn't cover
      // this shade (e.g. any of the crochet-only names).
      const nextColorHex = { ...(p.colorHex || {}) };
      if (!removing && activeSwatchHex[color] && !nextColorHex[color]) {
        nextColorHex[color] = activeSwatchHex[color];
      }
      return { ...p, colors: nextColors, colorHex: nextColorHex };
    });

  const selectAllPresetColors = () =>
    setForm((p) => {
      const merged = [...p.colors];
      const nextColorHex = { ...(p.colorHex || {}) };
      activePresetNames.forEach((c) => {
        if (!merged.includes(c)) merged.push(c);
        if (activeSwatchHex[c] && !nextColorHex[c]) {
          nextColorHex[c] = activeSwatchHex[c];
        }
      });
      return { ...p, colors: merged, colorHex: nextColorHex };
    });

  const clearAllColors = () => setForm((p) => ({ ...p, colors: [] }));

  // Material checkbox toggle. Adds/removes the slug in form.materials.
  const toggleMaterial = (slug) =>
    setForm((p) => {
      const current = Array.isArray(p.materials) ? p.materials : [];
      const next = current.includes(slug)
        ? current.filter((m) => m !== slug)
        : [...current, slug];
      return { ...p, materials: next };
    });

  // Occasion checkbox toggle — same shape as toggleMaterial but for
  // the `occasions` array.
  const toggleOccasion = (slug) =>
    setForm((p) => {
      const current = Array.isArray(p.occasions) ? p.occasions : [];
      const next = current.includes(slug)
        ? current.filter((o) => o !== slug)
        : [...current, slug];
      return { ...p, occasions: next };
    });

  // Brand style checkbox toggle — same shape for `brandStyles`.
  const toggleBrandStyle = (slug) =>
    setForm((p) => {
      const current = Array.isArray(p.brandStyles) ? p.brandStyles : [];
      const next = current.includes(slug)
        ? current.filter((s) => s !== slug)
        : [...current, slug];
      return { ...p, brandStyles: next };
    });

  const addCustomColor = () => {
    const value = customColor.trim();
    if (!value) return;
    setForm((p) => {
      const alreadyThere = p.colors.includes(value);
      return {
        ...p,
        colors: alreadyThere ? p.colors : [...p.colors, value],
        // Always record the picked hex so re-adding a name updates its
        // swatch. Presets don't need this (SWATCH_HEX has them) but
        // custom colours rely on this map to render anything but grey.
        colorHex: { ...(p.colorHex || {}), [value]: customColorHex },
      };
    });
    setCustomColor("");
    setCustomColorHex("#cccccc");
  };

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
        "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in Decor N Art-admin/.env.local."
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

  const addFaq = () =>
    setForm((p) => ({ ...p, faqs: [...p.faqs, { q: "", a: "" }] }));

  const removeFaq = (index) =>
    setForm((p) => ({ ...p, faqs: p.faqs.filter((_, i) => i !== index) }));

  const updateFaq = (index, key, value) =>
    setForm((p) => ({
      ...p,
      faqs: p.faqs.map((f, i) => (i === index ? { ...f, [key]: value } : f)),
    }));

  // ── Review handlers ────────────────────────────────────────────────
  const addReview = () =>
    setForm((p) => ({ ...p, reviews: [...p.reviews, { ...EMPTY_REVIEW }] }));

  const removeReview = (index) =>
    setForm((p) => ({
      ...p,
      reviews: p.reviews.filter((_, i) => i !== index),
    }));

  const updateReview = (index, key, value) =>
    setForm((p) => ({
      ...p,
      reviews: p.reviews.map((r, i) =>
        i === index ? { ...r, [key]: value } : r
      ),
    }));

  // ── Feature-badge handlers ──────────────────────────────────────────
  const addFeatureBadge = () =>
    setForm((p) => ({
      ...p,
      featureBadges: [
        ...p.featureBadges,
        { icon: FEATURE_ICON_KEYS[0] || "", title: "", copy: "" },
      ],
    }));

  const removeFeatureBadge = (index) =>
    setForm((p) => ({
      ...p,
      featureBadges: p.featureBadges.filter((_, i) => i !== index),
    }));

  const updateFeatureBadge = (index, key, value) =>
    setForm((p) => ({
      ...p,
      featureBadges: p.featureBadges.map((b, i) =>
        i === index ? { ...b, [key]: value } : b
      ),
    }));

  // ── Variant handlers ─────────────────────────────────────────────────
  const addVariant = () =>
    setForm((p) => ({ ...p, variants: [...p.variants, { ...EMPTY_VARIANT }] }));

  const removeVariant = (index) =>
    setForm((p) => ({
      ...p,
      variants: p.variants.filter((_, i) => i !== index),
    }));

  const updateVariant = (index, key, value) =>
    setForm((p) => ({
      ...p,
      variants: p.variants.map((v, i) =>
        i === index ? { ...v, [key]: value } : v
      ),
    }));

  // Per-variant image upload — routes the same signed Cloudinary flow the
  // main gallery uses, but stores the URL against the target variant only.
  const uploadVariantImage = async (index, files) => {
    if (!files || !files.length) return;
    if (!isCloudinaryConfigured()) {
      setError("Cloudinary is not configured.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const result = await uploadImage(files[0], { folder: "Decor N Art/products" });
      updateVariant(index, "image", result.url);
    } catch (err) {
      setError(err.message || "Variant image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // Upload / clear the per-colour image on a pipe-cleaner product. Stored
  // as an entry on `form.colorImages[color]`; missing entries fall back
  // to the base gallery on the storefront.
  const uploadColorImage = async (color, files) => {
    if (!files || !files.length) return;
    if (!isCloudinaryConfigured()) {
      setError("Cloudinary is not configured.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const result = await uploadImage(files[0], { folder: "Decor N Art/products" });
      setForm((p) => ({
        ...p,
        colorImages: { ...(p.colorImages || {}), [color]: result.url },
      }));
    } catch (err) {
      setError(err.message || "Colour image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const clearColorImage = (color) =>
    setForm((p) => {
      const next = { ...(p.colorImages || {}) };
      delete next[color];
      return { ...p, colorImages: next };
    });

  // Cloudinary video upload — same signed flow as images but routed to
  // the /video/upload endpoint. Writes the returned secure_url into the
  // videoUrl field so the admin sees the link populated.
  const handleVideoUpload = async (files) => {
    if (!files || !files.length) return;
    if (!isCloudinaryConfigured()) {
      setError("Cloudinary is not configured.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const result = await uploadVideo(files[0]);
      setForm((p) => ({ ...p, videoUrl: result.url }));
    } catch (err) {
      setError(err.message || "Video upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    // Collapse the four spec inputs into a single object; drop empty keys.
    const specs = {};
    if (form.specMaterial.trim()) specs.material = form.specMaterial.trim();
    if (form.specPack.trim()) specs.pack = form.specPack.trim();
    if (form.specOrigin.trim()) specs.origin = form.specOrigin.trim();
    if (form.specFinish.trim()) specs.finish = form.specFinish.trim();
    if (form.specThickness.trim()) specs.thickness = form.specThickness.trim();
    if (form.specLength.trim()) specs.length = form.specLength.trim();

    // Drop FAQ rows that don't have both a question and an answer — persisting
    // half-filled entries would confuse the storefront's FAQ tab.
    const faqs = form.faqs
      .map((f) => ({ q: (f.q || "").trim(), a: (f.a || "").trim() }))
      .filter((f) => f.q && f.a);

    // Drop review rows missing the two required fields (name + body).
    // Coerce numerics so Zod doesn't reject strings.
    const reviews = form.reviews
      .map((r) => ({
        name: (r.name || "").trim(),
        rating: Math.min(5, Math.max(1, Number(r.rating) || 5)),
        date: (r.date || "").trim(),
        title: (r.title || "").trim(),
        body: (r.body || "").trim(),
        verified: !!r.verified,
        helpful: Math.max(0, Number(r.helpful) || 0),
      }))
      .filter((r) => r.name && r.body);

    // Drop variant rows missing name or price. Coerce numeric fields so the
    // backend zod schema doesn't reject strings.
    const variants = form.variants
      .map((v) => ({
        name: (v.name || "").trim(),
        price: v.price === "" ? NaN : Number(v.price),
        stock: v.stock === "" ? 0 : Number(v.stock),
        sku: (v.sku || "").trim(),
        image: v.image || "",
      }))
      .filter((v) => v.name && Number.isFinite(v.price));

    // Serialise the { color: url } map back into a stable array. Drop
    // entries whose colour is no longer in `colors` (admin may have
    // unselected a swatch after uploading its image) and any entry with a
    // blank URL. Only categories that render a per-colour image swap on
    // the storefront populate this array; the rest send [].
    const colorImages = CATEGORIES_WITH_COLOR_IMAGES.has(form.category)
      ? form.colors
          .map((c) => ({ color: c, image: form.colorImages?.[c] || "" }))
          .filter((c) => c.image)
      : [];

    // Only send hex overrides for colours that (a) are still selected and
    // (b) have a picked hex. Presets are omitted since the storefront's
    // static COLOR_HEX map already covers them.
    const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
    const colorSwatches = form.colors
      .map((c) => ({ color: c, hex: form.colorHex?.[c] || "" }))
      .filter((c) => c.hex && HEX_RE.test(c.hex));

    // Drop badge rows without a title; the icon/copy alone aren't
    // enough. Blank icon is allowed — storefront just skips the glyph.
    const featureBadges = form.featureBadges
      .map((b) => ({
        icon: (b.icon || "").trim(),
        title: (b.title || "").trim(),
        copy: (b.copy || "").trim(),
      }))
      .filter((b) => b.title);

    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      // Send null when the field is left blank so the backend clears any
      // previously set MRP. Any positive number goes through as-is.
      compareAt:
        form.compareAt === "" || form.compareAt === null
          ? null
          : Number(form.compareAt),
      category: form.category,
      packContents: linesToArray(form.packContents),
      usage: linesToArray(form.usage),
      materials: Array.isArray(form.materials) ? form.materials : [],
      occasions: Array.isArray(form.occasions) ? form.occasions : [],
      brandStyles: Array.isArray(form.brandStyles) ? form.brandStyles : [],
      colors: form.colors,
      colorImages,
      colorSwatches,
      variantLabel: form.variantLabel.trim(),
      variants,
      video: {
        url: (form.videoUrl || "").trim(),
        title: (form.videoTitle || "").trim(),
      },
      specs: Object.keys(specs).length ? specs : undefined,
      faqs,
      reviews,
      featureBadges,
      images: form.images,
      stock: Number(form.stock || 0),
      isNew: !!form.isNew,
      isBestseller: !!form.isBestseller,
      status: form.status,
    };
    // eslint-disable-next-line no-console
    console.log("[ProductForm] submitting payload.video:", payload.video);
    // eslint-disable-next-line no-console
    console.log(
      "[ProductForm] submitting reviews:",
      Array.isArray(payload.reviews) ? payload.reviews.length : "n/a",
      payload.reviews
    );
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
            <Field label="Slug" required>
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
              placeholder=""
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
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
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
                  <option key={s} value={s}>
                    {s}
                  </option>
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
            <Field label="Original / MRP (INR)">
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Leave blank if no discount"
                className={styles.input}
                value={form.compareAt}
                onChange={onNumber("compareAt")}
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

        <Section title="Pack details">
          <Field label="Pack contents" hint="One line per entry">
            <textarea
              rows={4}
              className={`${styles.input} ${styles.textarea}`}
              placeholder={
                ""
              }
              value={form.packContents}
              onChange={onText("packContents")}
            />
          </Field>

          <Field label="Usage & project ideas" hint="One line per entry">
            <textarea
              rows={4}
              className={`${styles.input} ${styles.textarea}`}
              placeholder={
                ""
              }
              value={form.usage}
              onChange={onText("usage")}
            />
          </Field>

          <Field
            label="Materials"
            hint="Tick every material this product is made from"
          >
            <div className={styles.materialGrid}>
              {MATERIAL_OPTIONS.map((opt) => {
                const active =
                  Array.isArray(form.materials) &&
                  form.materials.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={`${styles.materialRow} ${
                      active ? styles.materialRowActive : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className={styles.materialCheckbox}
                      checked={active}
                      onChange={() => toggleMaterial(opt.id)}
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </Field>

          <Field
            label="Occasions"
            hint="Tick every gifting moment this product suits"
          >
            <div className={styles.materialGrid}>
              {OCCASION_OPTIONS.map((opt) => {
                const active =
                  Array.isArray(form.occasions) &&
                  form.occasions.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={`${styles.materialRow} ${
                      active ? styles.materialRowActive : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className={styles.materialCheckbox}
                      checked={active}
                      onChange={() => toggleOccasion(opt.id)}
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </Field>

          <Field
            label="Brand Style"
            hint="Tick every style vibe that fits this product"
          >
            <div className={styles.materialGrid}>
              {BRAND_STYLE_OPTIONS.map((opt) => {
                const active =
                  Array.isArray(form.brandStyles) &&
                  form.brandStyles.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={`${styles.materialRow} ${
                      active ? styles.materialRowActive : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className={styles.materialCheckbox}
                      checked={active}
                      onChange={() => toggleBrandStyle(opt.id)}
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </Field>

          <Field
            label="Colors"
            hint="Optional · click a chip to toggle it on/off"
          >
            <div className={styles.colorPicker}>
              <div
                className={`${styles.colorChips} ${
                  showAllColors ? "" : styles.colorChipsCollapsed
                }`}
              >
                {(() => {
                  const seen = new Set();
                  const all = [];
                  activePresetNames.forEach((c) => {
                    if (!seen.has(c)) {
                      seen.add(c);
                      all.push(c);
                    }
                  });
                  form.colors.forEach((c) => {
                    if (!seen.has(c)) {
                      seen.add(c);
                      all.push(c);
                    }
                  });
                  return all.map((color) => {
                    const on = form.colors.includes(color);
                    const hex =
                      activeSwatchHex[color] ||
                      form.colorHex?.[color] ||
                      SWATCH_HEX[color] ||
                      "#999";
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleColor(color)}
                        className={`${styles.colorSwatch} ${
                          on ? styles.colorSwatchActive : ""
                        }`}
                        style={{ background: hex }}
                        aria-pressed={on}
                        aria-label={color}
                        title={color}
                      />
                    );
                  });
                })()}
              </div>

              <div className={styles.colorActions}>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => setShowAllColors((v) => !v)}
                >
                  {showAllColors ? "Show less" : "Show more"}
                </button>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={selectAllPresetColors}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={clearAllColors}
                  disabled={form.colors.length === 0}
                >
                  Clear
                </button>
              </div>

              <div className={styles.colorAddRow}>
                <input
                  type="color"
                  className={styles.colorAddPicker}
                  value={customColorHex}
                  onChange={(e) => setCustomColorHex(e.target.value)}
                  aria-label="Custom color swatch"
                  title="Pick a swatch colour for the custom name"
                />
                <input
                  type="text"
                  className={`${styles.input} ${styles.colorAddInput}`}
                  placeholder="Add a custom color…"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomColor();
                    }
                  }}
                />
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={addCustomColor}
                  disabled={!customColor.trim()}
                >
                  + Add
                </button>
              </div>
            </div>
          </Field>
        </Section>

        {CATEGORIES_WITH_COLOR_IMAGES.has(form.category) && form.colors.length > 0 && (
          <Section
            title="Colour images"
            hint="Upload one image per selected colour · shopper will see this swap when picking that colour"
          >
            <ul className={styles.colorImageList}>
              {form.colors.map((color) => {
                const url = form.colorImages?.[color] || "";
                const hex =
                  activeSwatchHex[color] ||
                  form.colorHex?.[color] ||
                  SWATCH_HEX[color] ||
                  "#999";
                const inputId = `color-image-${slugify(color)}`;
                return (
                  <li key={color} className={styles.colorImageRow}>
                    <div className={styles.colorImageThumb}>
                      {url ? (
                        <Image src={url} alt="" fill sizes="72px" unoptimized />
                      ) : (
                        <span className={styles.variantThumbEmpty}>—</span>
                      )}
                    </div>
                    <div className={styles.colorImageMeta}>
                      <span className={styles.colorImageName}>
                        <span
                          className={styles.colorImageDot}
                          style={{ background: hex }}
                          aria-hidden="true"
                        />
                        {color}
                      </span>
                      <div className={styles.colorImageActions}>
                        <input
                          type="file"
                          accept="image/*"
                          id={inputId}
                          className={styles.fileInput}
                          onChange={(e) =>
                            uploadColorImage(color, e.target.files)
                          }
                        />
                        <label
                          htmlFor={inputId}
                          className={styles.variantUploadBtn}
                        >
                          {url ? "Replace" : "Upload"}
                        </label>
                        {url && (
                          <button
                            type="button"
                            className={styles.ghost}
                            onClick={() => clearColorImage(color)}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        <Section title="Specifications">
          <Row>
            <Field label="Material">
              <input
                type="text"
                className={styles.input}
                placeholder=""
                value={form.specMaterial}
                onChange={onText("specMaterial")}
              />
            </Field>
            <Field label="Pack size">
              <input
                type="text"
                className={styles.input}
                placeholder=""
                value={form.specPack}
                onChange={onText("specPack")}
              />
            </Field>
          </Row>
          <Row>
            <Field label="Origin">
              <input
                type="text"
                className={styles.input}
                placeholder=""
                value={form.specOrigin}
                onChange={onText("specOrigin")}
              />
            </Field>
            <Field label="Finish">
              <input
                type="text"
                className={styles.input}
                placeholder=""
                value={form.specFinish}
                onChange={onText("specFinish")}
              />
            </Field>
          </Row>
          <Row>
            <Field label="Thickness">
              <input
                type="text"
                className={styles.input}
                placeholder=""
                value={form.specThickness}
                onChange={onText("specThickness")}
              />
            </Field>
            <Field label="Length">
              <input
                type="text"
                className={styles.input}
                placeholder=""
                value={form.specLength}
                onChange={onText("specLength")}
              />
            </Field>
          </Row>
        </Section>

        <Section
          title="Variants"
          
        >
          <Field
            label="Variant label"
            hint='(e.g. "Thickness", "Size")'
          >
            <input
              type="text"
              className={styles.input}
              placeholder="
              "
              value={form.variantLabel}
              onChange={onText("variantLabel")}
              maxLength={40}
            />
          </Field>
          {form.variants.length === 0 && (
            <p className={styles.muted}>
              No variants. This product will sell at the base price above.
            </p>
          )}
          {form.variants.map((v, i) => (
            <div key={i} className={styles.variantRow}>
              <div className={styles.variantThumb}>
                {v.image ? (
                  <Image src={v.image} alt="" fill sizes="72px" unoptimized />
                ) : (
                  <span className={styles.variantThumbEmpty}>—</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  id={`variant-image-${i}`}
                  className={styles.fileInput}
                  onChange={(e) => uploadVariantImage(i, e.target.files)}
                />
                <label
                  htmlFor={`variant-image-${i}`}
                  className={styles.variantUploadBtn}
                >
                  {v.image ? "Replace" : "Upload"}
                </label>
                {v.image && (
                  <button
                    type="button"
                    onClick={() => updateVariant(i, "image", "")}
                    className={styles.variantRemoveImg}
                    aria-label="Clear image"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className={styles.variantFields}>
                <Row>
                  <Field label="Variant name" required>
                    <input
                      type="text"
                      required
                      className={styles.input}
                      placeholder="e.g. 6mm"
                      value={v.name}
                      onChange={(e) => updateVariant(i, "name", e.target.value)}
                      maxLength={60}
                    />
                  </Field>
                  <Field label="Price (INR)" required>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      className={styles.input}
                      value={v.price}
                      onChange={(e) => updateVariant(i, "price", e.target.value)}
                    />
                  </Field>
                </Row>
                <Row>
                  <Field label="Stock">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={styles.input}
                      value={v.stock}
                      onChange={(e) => updateVariant(i, "stock", e.target.value)}
                    />
                  </Field>
                  <Field label="SKU">
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Optional"
                      value={v.sku}
                      onChange={(e) => updateVariant(i, "sku", e.target.value)}
                      maxLength={80}
                    />
                  </Field>
                </Row>
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  className={styles.ghost}
                >
                  Remove variant
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addVariant} className={styles.ghost}>
            + Add variant
          </button>
        </Section>

        <Section
          title="Feature badges"
          hint="Small icon + title + subtitle row shown under the product gallery · leave empty to use the storefront defaults"
        >
          {form.featureBadges.length === 0 && (
            <p className={styles.muted}>
              No badges yet — add one below (up to 8).
            </p>
          )}
          <div className={styles.featureBadgeGrid}>
            {form.featureBadges.map((b, i) => (
              <div key={i} className={styles.featureBadgeRow}>
                <div className={styles.featureBadgePreview}>
                  <span className={styles.featureBadgeIcon} aria-hidden="true">
                    {renderFeatureIcon(b.icon) || "—"}
                  </span>
                </div>
                <div className={styles.featureBadgeFields}>
                  <select
                    className={styles.featureBadgeInput}
                    value={b.icon}
                    onChange={(e) =>
                      updateFeatureBadge(i, "icon", e.target.value)
                    }
                    aria-label="Icon"
                  >
                    <option value="">(no icon)</option>
                    {FEATURE_ICON_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {FEATURE_ICONS[k].label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    className={styles.featureBadgeInput}
                    placeholder="Title (e.g. Soft & Fluffy)"
                    value={b.title}
                    onChange={(e) =>
                      updateFeatureBadge(i, "title", e.target.value)
                    }
                    maxLength={40}
                    aria-label="Title"
                  />
                  <input
                    type="text"
                    className={styles.featureBadgeInput}
                    placeholder="Subtitle (e.g. Premium Quality)"
                    value={b.copy}
                    onChange={(e) =>
                      updateFeatureBadge(i, "copy", e.target.value)
                    }
                    maxLength={60}
                    aria-label="Subtitle"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeFeatureBadge(i)}
                  className={styles.featureBadgeRemove}
                  aria-label="Remove badge"
                  title="Remove badge"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          {form.featureBadges.length < 8 && (
            <button
              type="button"
              onClick={addFeatureBadge}
              className={styles.ghost}
            >
              + Add feature badge
            </button>
          )}
        </Section>

        <Section title="FAQs" hint="Shown in the product's FAQ tab">
          {form.faqs.length === 0 && (
            <p className={styles.muted}>No FAQs yet — add one below.</p>
          )}
          <div className={styles.faqList}>
            {form.faqs.map((f, i) => (
              <div key={i} className={styles.faqCard}>
                <div className={styles.faqHead}>
                  <span className={styles.faqIndex}>Q{i + 1}</span>
                  <input
                    type="text"
                    className={`${styles.input} ${styles.faqQuestion}`}
                    placeholder="Question"
                    value={f.q}
                    onChange={(e) => updateFaq(i, "q", e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.faqRemove}
                    onClick={() => removeFaq(i)}
                    aria-label={`Remove FAQ ${i + 1}`}
                    title="Remove FAQ"
                  >
                    ×
                  </button>
                </div>
                <textarea
                  rows={2}
                  className={`${styles.input} ${styles.textarea} ${styles.faqAnswer}`}
                  placeholder="Answer"
                  value={f.a}
                  onChange={(e) => updateFaq(i, "a", e.target.value)}
                />
              </div>
            ))}
          </div>
          <button type="button" className={styles.ghost} onClick={addFaq}>
            + Add FAQ
          </button>
        </Section>

        <Section
          title="Reviews"
          hint="Curated customer reviews shown on the product's Reviews tab"
        >
          {form.reviews.length === 0 && (
            <p className={styles.muted}>
              No reviews yet — add one below.
            </p>
          )}
          <div className={styles.reviewList}>
            {form.reviews.map((r, i) => (
              <div key={i} className={styles.reviewCard}>
                <div className={styles.reviewHead}>
                  <span className={styles.reviewIndex}>#{i + 1}</span>
                  <input
                    type="text"
                    className={`${styles.input} ${styles.reviewName}`}
                    placeholder="Reviewer name (e.g. Priya Sharma)"
                    value={r.name}
                    onChange={(e) => updateReview(i, "name", e.target.value)}
                    maxLength={80}
                  />
                  <button
                    type="button"
                    className={styles.reviewRemove}
                    onClick={() => removeReview(i)}
                    aria-label={`Remove review ${i + 1}`}
                    title="Remove review"
                  >
                    ×
                  </button>
                </div>
                <Row>
                  <Field label="Rating (1–5)">
                    <select
                      className={styles.input}
                      value={r.rating}
                      onChange={(e) =>
                        updateReview(i, "rating", Number(e.target.value))
                      }
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} ★
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Date">
                    <input
                      type="text"
                      className={styles.input}
                      placeholder='e.g. "12 Mar 2025"'
                      value={r.date}
                      onChange={(e) => updateReview(i, "date", e.target.value)}
                      maxLength={40}
                    />
                  </Field>
                </Row>
                <Field label="Review title">
                  <input
                    type="text"
                    className={styles.input}
                    placeholder='e.g. "Absolutely perfect quality!"'
                    value={r.title}
                    onChange={(e) => updateReview(i, "title", e.target.value)}
                    maxLength={160}
                  />
                </Field>
                <Field label="Review body" required>
                  <textarea
                    rows={3}
                    className={`${styles.input} ${styles.textarea}`}
                    placeholder="What the reviewer said…"
                    value={r.body}
                    onChange={(e) => updateReview(i, "body", e.target.value)}
                    maxLength={2000}
                  />
                </Field>
                <Row>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={!!r.verified}
                      onChange={(e) =>
                        updateReview(i, "verified", e.target.checked)
                      }
                    />
                    <span>Verified Buyer</span>
                  </label>
                  <Field label="Helpful count">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={styles.input}
                      value={r.helpful}
                      onChange={(e) =>
                        updateReview(i, "helpful", e.target.value)
                      }
                    />
                  </Field>
                </Row>
              </div>
            ))}
          </div>
          <button type="button" className={styles.ghost} onClick={addReview}>
            + Add review
          </button>
        </Section>

        <Section
          title="Images"
          hint={
            !isCloudinaryConfigured()
              ? "Cloudinary not configured — see .env.local.example"
              : null
          }
        >
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

        <Section
          title="Video"
          hint=""
        >
          <Field
            label="Video URL"
            hint="Paste a YouTube, Vimeo, or direct MP4 link — or upload an .mp4 below"
          >
            <input
              type="url"
              className={styles.input}
              placeholder=""
              value={form.videoUrl}
              onChange={onText("videoUrl")}
            />
          </Field>

          <div className={styles.uploadRow}>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => handleVideoUpload(e.target.files)}
              className={styles.fileInput}
              id="product-video"
            />
            <label htmlFor="product-video" className={styles.uploadBtn}>
              {uploading ? "Uploading…" : form.videoUrl ? "Replace video" : "Upload video"}
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
            <p className={styles.muted} style={{ wordBreak: "break-all" }}>
              Current: {form.videoUrl}
            </p>
          )}

          <Field label="Video title" hint='Falls back to "DIY Flower Tutorial"'>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. DIY Flower Tutorial"
              value={form.videoTitle}
              onChange={onText("videoTitle")}
              maxLength={80}
            />
          </Field>
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
