import apiClient from "./apiClient";

export const getAllPapers = async () => {
  try {
    const response = await apiClient.get(`/papers`);
    return response.data;
  } catch (error) {
    console.error("Error fetching papers:", error);
    throw error;
  }
};

export const addNewPaper = async (paperData) => {
  try {
    const response = await apiClient.post(`papers/add`, paperData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Error adding paper:", error);
    throw error;
  }
};

export const getPapersByUserId = async (user_id) => {
  try {
    const response = await apiClient.get(`/papers/user/${user_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching paper by user ID: ", error);
    throw error;
  }
};

export const deletePaperById = async (id) => {
  try {
    const response = await apiClient.delete(`/papers/delete/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error deleting paper');
  }
};

export const getPaperById = async (id) => {
  try {
    const response = await apiClient.get(`/papers/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching paper by ID:", error);
    throw error;
  }
};

export const updatePaper = async (id, paperData) => {
  try {
    const response = await apiClient.put(`/papers/update/${id}`, paperData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating paper:", error);
    throw error;
  }
};