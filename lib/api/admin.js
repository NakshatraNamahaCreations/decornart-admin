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
