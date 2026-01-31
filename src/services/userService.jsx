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
