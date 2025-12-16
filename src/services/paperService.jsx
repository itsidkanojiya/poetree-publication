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

// ==================== DEFAULT PAPER TEMPLATES (USER) ====================

/**
 * Get available templates for user
 * GET /api/papers/templates/available
 */
export const getAvailableTemplates = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.subject_id) params.append("subject_id", filters.subject_id);
    if (filters.standard) params.append("standard", filters.standard);
    if (filters.board_id) params.append("board_id", filters.board_id);
    
    const queryString = params.toString();
    const url = `/papers/templates/available${queryString ? `?${queryString}` : ""}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching available templates:", error);
    throw error;
  }
};

/**
 * View template details (User - read-only)
 * GET /api/papers/templates/:id/view
 */
export const viewTemplate = async (id) => {
  try {
    const response = await apiClient.get(`/papers/templates/${id}/view`);
    return response.data;
  } catch (error) {
    console.error("Error viewing template:", error);
    throw error;
  }
};

/**
 * Customize template (create user's copy)
 * POST /api/papers/templates/:id/customize
 */
export const customizeTemplate = async (templateId, replacements = []) => {
  try {
    const response = await apiClient.post(`/papers/templates/${templateId}/customize`, {
      replacements,
    });
    return response.data;
  } catch (error) {
    console.error("Error customizing template:", error);
    throw error;
  }
};

/**
 * Replace question in customized paper
 * PUT /api/papers/:id/replace-question
 */
export const replaceQuestion = async (paperId, position, questionId) => {
  try {
    const response = await apiClient.put(`/papers/${paperId}/replace-question`, {
      position,
      question_id: questionId,
    });
    return response.data;
  } catch (error) {
    console.error("Error replacing question:", error);
    throw error;
  }
};

/**
 * Get user's customized papers
 * GET /api/papers/my-customized
 */
export const getMyCustomizedPapers = async (templateId = null) => {
  try {
    const params = templateId ? `?template_id=${templateId}` : "";
    const response = await apiClient.get(`/papers/my-customized${params}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching customized papers:", error);
    throw error;
  }
};