import apiClient from "./apiClient";

/**
 * Fetch dashboard stats in one call.
 * GET /api/dashboard
 * Optional query: subject_id, subject_title_id, standard, board_id (for context-filtered counts).
 * See docs/API-DASHBOARD-SPEC.md for backend contract.
 */
export const getDashboard = async (context = {}) => {
  const params = new URLSearchParams();
  if (context.subject_id != null) params.append("subject_id", context.subject_id);
  if (context.subject_title_id != null) params.append("subject_title_id", context.subject_title_id);
  if (context.standard != null) params.append("standard", context.standard);
  if (context.board_id != null) params.append("board_id", context.board_id);
  const query = params.toString();
  const url = `/dashboard${query ? `?${query}` : ""}`;
  const response = await apiClient.get(url);
  return response.data;
};
