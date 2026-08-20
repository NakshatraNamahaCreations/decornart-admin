"use client";

import { api } from "./client";

export function getDashboard() {
  return api.get("/admin/dashboard");
}

export function listProducts(query = {}) {
  return api.get("/admin/products", { query, envelope: true });
}

export function getProduct(id) {
  return api.get(`/admin/products/${id}`);
}

export function createProduct(payload) {
  return api.post("/admin/products", payload);
}

export function updateProduct(id, payload) {
  return api.patch(`/admin/products/${id}`, payload);
}

export function deleteProduct(id) {
  return api.delete(`/admin/products/${id}`);
}

// ── Inventory ─────────────────────────────────────────────────────────
// Payload is `{ stock: number, variantId?: string }`. Omitting variantId
// moves the parent product's stock; including one targets that variant.
export function updateInventory(productId, payload) {
  return api.patch(`/admin/inventory/${productId}`, payload);
}

// ── Orders ────────────────────────────────────────────────────────────
export function listOrders(query = {}) {
  return api.get("/admin/orders", { query, envelope: true });
}

export function getOrder(id) {
  return api.get(`/admin/orders/${id}`);
}

export function updateOrderStatus(id, payload) {
  return api.patch(`/admin/orders/${id}/status`, payload);
}

export function addOrderNote(id, payload) {
  return api.post(`/admin/orders/${id}/notes`, payload);
}

// ── Customers ─────────────────────────────────────────────────────────
export function listCustomers(query = {}) {
  return api.get("/admin/customers", { query, envelope: true });
}

export function getCustomer(id) {
  return api.get(`/admin/customers/${id}`);
}

export function setCustomerBlocked(id, blocked) {
  return api.patch(`/admin/customers/${id}/status`, { blocked });
}

export function deleteCustomer(id) {
  return api.delete(`/admin/customers/${id}`);
}

// ── Categories ────────────────────────────────────────────────────────
export function listCategories() {
  return api.get("/admin/categories");
}

export function getCategory(id) {
  return api.get(`/admin/categories/${id}`);
}

export function createCategory(payload) {
  return api.post("/admin/categories", payload);
}

export function updateCategory(id, payload) {
  return api.patch(`/admin/categories/${id}`, payload);
}

export function deleteCategory(id) {
  return api.delete(`/admin/categories/${id}`);
}

export function reorderCategories(ids) {
  return api.post("/admin/categories/reorder", { ids });
}

// ── Coupons ───────────────────────────────────────────────────────────
export function listCoupons(query = {}) {
  return api.get("/admin/coupons", { query, envelope: true });
}

export function getCoupon(id) {
  return api.get(`/admin/coupons/${id}`);
}

export function createCoupon(payload) {
  return api.post("/admin/coupons", payload);
}

export function updateCoupon(id, payload) {
  return api.patch(`/admin/coupons/${id}`, payload);
}

export function deleteCoupon(id) {
  return api.delete(`/admin/coupons/${id}`);
}

// ── DIY Videos ────────────────────────────────────────────────────────
export function listDiyVideos() {
  return api.get("/admin/diy-videos");
}

export function getDiyVideo(id) {
  return api.get(`/admin/diy-videos/${id}`);
}

export function createDiyVideo(payload) {
  return api.post("/admin/diy-videos", payload);
}

export function updateDiyVideo(id, payload) {
  return api.patch(`/admin/diy-videos/${id}`, payload);
}

export function deleteDiyVideo(id) {
  return api.delete(`/admin/diy-videos/${id}`);
}

export function reorderDiyVideos(ids) {
  return api.post("/admin/diy-videos/reorder", { ids });
}

// ── Instagram Posts ───────────────────────────────────────────────────
export function listInstagramPosts() {
  return api.get("/admin/instagram-posts");
}

export function getInstagramPost(id) {
  return api.get(`/admin/instagram-posts/${id}`);
}

export function createInstagramPost(payload) {
  return api.post("/admin/instagram-posts", payload);
}

export function updateInstagramPost(id, payload) {
  return api.patch(`/admin/instagram-posts/${id}`, payload);
}

export function deleteInstagramPost(id) {
  return api.delete(`/admin/instagram-posts/${id}`);
}

export function reorderInstagramPosts(ids) {
  return api.post("/admin/instagram-posts/reorder", { ids });
}

// ── Banners ───────────────────────────────────────────────────────────
export function listBanners(query = {}) {
  return api.get("/admin/banners", { query });
}

export function getBanner(id) {
  return api.get(`/admin/banners/${id}`);
}

export function createBanner(payload) {
  return api.post("/admin/banners", payload);
}

export function updateBanner(id, payload) {
  return api.patch(`/admin/banners/${id}`, payload);
}

export function deleteBanner(id) {
  return api.delete(`/admin/banners/${id}`);
}

export function reorderBanners(ids) {
  return api.post("/admin/banners/reorder", { ids });
}

// ── Settings ──────────────────────────────────────────────────────────
export function getSettings() {
  return api.get("/admin/settings");
}

export function updateSettings(payload) {
  return api.patch("/admin/settings", payload);
}

// ── Shipping rules ────────────────────────────────────────────────────
export function listShippingRules() {
  return api.get("/admin/shipping/rules");
}

export function getShippingRule(id) {
  return api.get(`/admin/shipping/rules/${id}`);
}

export function createShippingRule(payload) {
  return api.post("/admin/shipping/rules", payload);
}

export function updateShippingRule(id, payload) {
  return api.patch(`/admin/shipping/rules/${id}`, payload);
}

export function deleteShippingRule(id) {
  return api.delete(`/admin/shipping/rules/${id}`);
}

// ── Payments ──────────────────────────────────────────────────────────
export function getPaymentsSummary(query = {}) {
  return api.get("/admin/payments/summary", { query });
}

// ── Reports ───────────────────────────────────────────────────────────
export function getPaymentsReport(query = {}) {
  return api.get("/admin/reports/payments", { query });
}

export function getShippingReport(query = {}) {
  return api.get("/admin/reports/shipping", { query });
}

export function refundOrder(id, payload = {}) {
  return api.post(`/admin/orders/${id}/refund`, payload);
}

// ── Enquiries (contact + wholesale form submissions) ─────────────────
export function listEnquiries(query = {}) {
  return api.get("/admin/enquiries", { query, envelope: true });
}

export function getEnquiry(id) {
  return api.get(`/admin/enquiries/${id}`);
}

export function updateEnquiryStatus(id, status) {
  return api.patch(`/admin/enquiries/${id}/status`, { status });
}

export function deleteEnquiry(id) {
  return api.delete(`/admin/enquiries/${id}`);
}

// ── Shiprocket actions on an order ────────────────────────────────────
export function shiprocketSync(id) {
  return api.post(`/admin/orders/${id}/shiprocket/sync`);
}
export function shiprocketPickup(id) {
  return api.post(`/admin/orders/${id}/shiprocket/pickup`);
}
export function shiprocketLabel(id) {
  return api.post(`/admin/orders/${id}/shiprocket/label`);
}
export function shiprocketCancel(id) {
  return api.post(`/admin/orders/${id}/shiprocket/cancel`);
}
export function shiprocketTrack(id) {
  return api.get(`/admin/orders/${id}/shiprocket/track`);
}
