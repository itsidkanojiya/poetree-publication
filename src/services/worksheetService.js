import apiClient from "./apiClient";

/**
 * Fetches the personalized worksheet PDF (with user's school logo and name) from the backend.
 * Uses the auth token from apiClient. Use for both view (inline) and download (attachment).
 * @param {number|string} worksheetId - Worksheet ID (worksheet_id from list API)
 * @param {{ action?: 'view' | 'download' }} options - action: 'view' for inline, 'download' for attachment
 * @returns {Promise<Blob>} - PDF blob
 */
export async function getPersonalizedWorksheetPdfBlob(worksheetId, options = {}) {
  const { action = "view" } = options;
  const response = await apiClient.get(`/worksheets/${worksheetId}/personalized-pdf`, {
    params: { action },
    responseType: "blob",
  });
  return response.data;
}
