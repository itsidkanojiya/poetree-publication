import apiClient from "./apiClient";

export const getUserProfile = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || "Failed to fetch user";
  }
};
