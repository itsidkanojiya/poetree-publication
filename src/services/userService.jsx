import apiClient from "./apiClient";

export const getUserProfile = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || "Failed to fetch user";
  }
};

/**
 * Get current user's approved subjects and subject titles (admin-approved only).
 * GET /auth/my-selections/approved
 * Returns { approved_selections: { subjects: [], subject_titles: [] } }
 */
export const getMyApprovedSelections = async () => {
  try {
    const response = await apiClient.get("/auth/my-selections/approved");
    return response.data;
  } catch (error) {
    console.error("Error fetching approved selections:", error);
    throw error;
  }
};

/**
 * Remove approved subject and/or subject-title selections.
 * POST /api/auth/my-selections/remove
 * Body: { user_subject_ids?: number[], user_subject_title_ids?: number[] }
 * Backend deletes those rows; they disappear from pending and approved.
 */
export const removeApprovedSelections = async ({
  user_subject_ids = [],
  user_subject_title_ids = [],
}) => {
  const ids = Array.isArray(user_subject_ids) ? user_subject_ids : [];
  const titleIds = Array.isArray(user_subject_title_ids) ? user_subject_title_ids : [];
  if (ids.length === 0 && titleIds.length === 0) {
    throw new Error("At least one of user_subject_ids or user_subject_title_ids must be non-empty");
  }
  const response = await apiClient.post("/auth/my-selections/remove", {
    ...(ids.length > 0 ? { user_subject_ids: ids } : {}),
    ...(titleIds.length > 0 ? { user_subject_title_ids: titleIds } : {}),
  });
  return response.data;
};

/**
 * Remove/cancel subject title(s) so they disappear from all lists.
 * POST /api/auth/my-selections/remove-subject-title
 * Body: { user_subject_title_ids: number[] } — row ids (user_subject_titles.id) or master subject_title_id.
 * Use after success: refresh pending and approved lists.
 */
export const removeSubjectTitles = async ({ user_subject_title_ids = [] }) => {
  const titleIds = Array.isArray(user_subject_title_ids) ? user_subject_title_ids.map(Number) : [];
  if (titleIds.length === 0) {
    throw new Error("user_subject_title_ids must be a non-empty array");
  }
  const response = await apiClient.post("/auth/my-selections/remove-subject-title", {
    user_subject_title_ids: titleIds,
  });
  return response.data;
};
