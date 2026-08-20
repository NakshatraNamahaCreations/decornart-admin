// Mirror of decornart-bouquets/lib/featureIcons.js — kept in sync so the
// admin's icon picker shows the same options the storefront can render.
// If you add an icon here, add it there too (same key + icon component).

import {
  FiFeather,
  FiRefreshCw,
  FiDroplet,
  FiShield,
  FiStar,
  FiHeart,
  FiTool,
  FiRotateCcw,
  FiUmbrella,
  FiWind,
  FiGift,
} from "react-icons/fi";
import { FaLeaf } from "react-icons/fa";

export const FEATURE_ICONS = {
  soft:        { label: "Soft / Fluffy",           svg: <FiFeather aria-hidden="true" /> },
  bend:        { label: "Flexible / Bendable",     svg: <FiRefreshCw aria-hidden="true" /> },
  colors:      { label: "Vibrant colours",         svg: <FiDroplet aria-hidden="true" /> },
  safe:        { label: "Kid safe / Non-toxic",    svg: <FiShield aria-hidden="true" /> },
  premium:     { label: "Premium quality",         svg: <FiStar aria-hidden="true" /> },
  eco:         { label: "Eco / Sustainable",       svg: <FaLeaf aria-hidden="true" /> },
  beautiful:    { label: "beautiful / Curated",      svg: <FiHeart aria-hidden="true" /> },
  durable:     { label: "Durable / Long-lasting",  svg: <FiTool aria-hidden="true" /> },
  reusable:    { label: "Reusable / Recyclable",   svg: <FiRotateCcw aria-hidden="true" /> },
  washable:    { label: "Washable / Waterproof",   svg: <FiUmbrella aria-hidden="true" /> },
  lightweight: { label: "Lightweight",             svg: <FiWind aria-hidden="true" /> },
  giftReady:   { label: "Gift-ready",              svg: <FiGift aria-hidden="true" /> },
};

export const FEATURE_ICON_KEYS = Object.keys(FEATURE_ICONS);

export function renderFeatureIcon(key) {
  const entry = FEATURE_ICONS[key];
  return entry ? entry.svg : null;
}
