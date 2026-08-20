"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import styles from "./AdminShell.module.css";

const NAV = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/orders", label: "Orders", icon: "⌂" },
  { href: "/payments", label: "Payments", icon: "₹" },
  { href: "/products", label: "Products", icon: "◇" },
  { href: "/inventory", label: "Inventory", icon: "▣" },
  { href: "/categories", label: "Categories", icon: "▤" },
  { href: "/customers", label: "Customers", icon: "◉" },
  { href: "/enquiries", label: "Enquiries", icon: "✉" },
  { href: "/coupons", label: "Coupons", icon: "%" },
  { href: "/banners", label: "Banners", icon: "▭" },
  { href: "/diy-videos", label: "Product Showcase Videos", icon: "▶" },
  { href: "/instagram-posts", label: "Instagram", icon: "◐" },
  { href: "/reports", label: "Reports", icon: "◈" },
  { href: "/settings", label: "Shipping Settings", icon: "⚙" },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const { user, logout, status } = useAuth();

  // Auth gate hides the entire shell while we don't know yet, or while a guest
  // is about to be redirected. AuthProvider handles the actual redirect.
  if (status !== "authed") {
    return (
      <div className={styles.boot}>
        <span className={styles.bootDot} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Image
            src="/new-logo-1.png"
            alt="Decor N Art"
            width={220}
            height={80}
            priority
            className={styles.brandLogo}
          />
        </div>

        <nav className={styles.nav} aria-label="Primary">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
              >
                <span className={styles.navIcon} aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFoot}>
          <div className={styles.who}>
            <span className={styles.whoAvatar} aria-hidden="true">
              {(user?.name || "?").charAt(0)}
            </span>
            <span className={styles.whoText}>
              <span className={styles.whoName}>{user?.name}</span>
              <span className={styles.whoEmail}>{user?.email}</span>
            </span>
          </div>
          <button type="button" className={styles.signOut} onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
