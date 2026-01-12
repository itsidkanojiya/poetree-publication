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
    let data = response.data;
    
    // Parse template_metadata if it comes as a string
    if (data?.papers && Array.isArray(data.papers)) {
      data.papers = data.papers.map(paper => {
        if (paper.template_metadata && typeof paper.template_metadata === 'string') {
          try {
            paper.template_metadata = JSON.parse(paper.template_metadata);
          } catch (error) {
            console.error("Error parsing template_metadata:", error);
          }
        }
        return paper;
      });
    } else if (Array.isArray(data)) {
      data = data.map(paper => {
        if (paper.template_metadata && typeof paper.template_metadata === 'string') {
          try {
            paper.template_metadata = JSON.parse(paper.template_metadata);
          } catch (error) {
            console.error("Error parsing template_metadata:", error);
          }
        }
        return paper;
      });
    }
    
    return data;
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
    throw new Error(error.response?.data?.message || "Error deleting paper");
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
    const response = await apiClient.put(`/papers/${id}`, paperData, {
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
 * GET /api/papers/templates
 * No authentication required - accessible to both admin and users
 */
export const getAvailableTemplates = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    // Map filters to API query parameters
    if (filters.subject) params.append("subject", filters.subject);
    if (filters.standard) params.append("standard", filters.standard);
    if (filters.board) params.append("board", filters.board);
    
    const queryString = params.toString();
    const url = `/papers/templates${queryString ? `?${queryString}` : ""}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching available templates:", error);
    throw error;
  }
};

/**
 * View template details (User - read-only)
 * GET /api/papers/templates/:id
 */
export const viewTemplate = async (id) => {
  try {
    const response = await apiClient.get(`/papers/templates/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error viewing template:", error);
    throw error;
  }
};

/**
 * Clone template (creates a new editable paper)
 * POST /api/papers/templates/:id/clone
 * Response: Returns new paper with id (e.g., id: 187)
 */
export const cloneTemplate = async (templateId) => {
  try {
    // Get user_id from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.id || user?.user_id;

    if (!userId) {
      throw new Error("User ID not found. Please log in again.");
    }

    const response = await apiClient.post(
      `/papers/templates/${templateId}/clone`,
      {
        user_id: userId,
      }
    );
    
    const data = response.data;
    
    // Parse template_metadata if it comes as a string
    if (data?.template_metadata && typeof data.template_metadata === 'string') {
      try {
        data.template_metadata = JSON.parse(data.template_metadata);
      } catch (error) {
        console.error("Error parsing template_metadata:", error);
      }
    }
    
    // Also parse if data is nested in a paper object
    if (data?.paper?.template_metadata && typeof data.paper.template_metadata === 'string') {
      try {
        data.paper.template_metadata = JSON.parse(data.paper.template_metadata);
      } catch (error) {
        console.error("Error parsing template_metadata:", error);
      }
    }
    
    return data;
  } catch (error) {
    console.error("Error cloning template:", error);
    throw error;
  }
};

/**
 * @deprecated Use cloneTemplate instead
 * Customize template (create user's copy)
 * POST /api/papers/templates/:id/customize
 */
export const customizeTemplate = async (templateId, replacements = []) => {
  try {
    const response = await apiClient.post(
      `/papers/templates/${templateId}/customize`,
      {
      replacements,
      }
    );
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
    const response = await apiClient.put(
      `/papers/${paperId}/replace-question`,
      {
      position,
      question_id: questionId,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error replacing question:", error);
    throw error;
  }
};

/**
 * Get user's customized papers (cloned templates)
 * Uses GET /api/papers/user/:user_id and filters for cloned templates
 * Cloned templates are identified by having question_types in template_metadata
 */
export const getMyCustomizedPapers = async (templateId = null) => {
  try {
    // Get user_id from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.id || user?.user_id;

    if (!userId) {
      throw new Error("User ID not found. Please log in again.");
    }

    // Get all papers for the user
    const data = await getPapersByUserId(userId);
    
    // Extract papers array from response
    let papers = [];
    if (data?.papers && Array.isArray(data.papers)) {
      papers = data.papers;
    } else if (Array.isArray(data)) {
      papers = data;
    }
    
    // Filter for cloned templates: papers with question_types in template_metadata
    const clonedTemplates = papers.filter(paper => {
      const metadata = paper.template_metadata;
      if (!metadata) return false;
      
      // Check if template_metadata has question_types (indicating it's a cloned template)
      return metadata.question_types && Object.keys(metadata.question_types).length > 0;
    });
    
    // Optionally filter by templateId if provided
    let filtered = clonedTemplates;
    if (templateId) {
      // If templateId is provided, filter papers that were cloned from that template
      // This would require storing the original template_id, which may not be available
      // For now, just return all cloned templates
      filtered = clonedTemplates;
    }
    
    return {
      papers: filtered,
      success: true
    };
  } catch (error) {
    console.error("Error fetching customized papers:", error);
    throw error;
  }
};
