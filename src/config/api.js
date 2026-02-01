/**
 * Single source of truth for API base URL.
 * Change only here or via .env:
 *
 * Local testing:  Create .env with  VITE_API_URL=http://localhost:4000/api
 * Deployment:     Use default or set VITE_API_URL=https://poetreebackend.netlify.app/api in build env
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://poetreebackend.netlify.app/api";

/** Base URL without /api (e.g. for images/assets on same host) */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "") || API_BASE_URL;
