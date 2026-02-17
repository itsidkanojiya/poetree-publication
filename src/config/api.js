/**
 * Single source of truth for API base URL.
 * Set VITE_API_URL in .env (see .env.example). No hardcoded default.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api";

/** Base URL without /api (e.g. for images/assets on same host) */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "") || API_BASE_URL;

/**
 * Brochure PDF download link (e.g. Google Drive direct link).
 * Set in .env as VITE_BROCHURE_PDF_URL or replace the default below.
 * For Google Drive: use "https://drive.google.com/uc?export=download&id=YOUR_FILE_ID"
 * or the share link; leave empty until you have the link.
 */
export const BROCHURE_PDF_URL =
  import.meta.env.VITE_BROCHURE_PDF_URL || "";
