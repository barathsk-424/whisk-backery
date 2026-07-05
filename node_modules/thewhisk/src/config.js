/**
 * config.js
 * ─────────────────────────────────────────────────────────────
 * Centralized configuration for The Whisk Bakery.
 */

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const APP_CONFIG = {
  name: "The Whisk",
  description: "AI-Powered Artisan Bakery",
  themeColor: "#4A2A1A",
};
