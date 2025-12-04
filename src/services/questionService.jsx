import apiClient from "./apiClient";

export const getQuestions = async (type) => {
  try {
    const response = await apiClient.get(`/questions?type=${type}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || "Failed to fetch questions";
  }
};
