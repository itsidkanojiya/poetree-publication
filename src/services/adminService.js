import apiClient from "./apiClient";

// ==================== ANALYSIS/DASHBOARD ====================

/**
 * Get teacher/student analysis data
 * GET /api/admin/user/analysis
 */
export const getTeacherAnalysis = async () => {
  try {
    const response = await apiClient.get("/admin/user/analysis");
    return response.data;
  } catch (error) {
    console.error("Error fetching teacher analysis:", error);
    throw error;
  }
};

// ==================== TEACHER MANAGEMENT ====================

/**
 * Get all teachers/users
 * GET /api/admin/user
 */
export const getAllTeachers = async () => {
  try {
    const response = await apiClient.get("/admin/user");
    return response.data;
  } catch (error) {
    console.error("Error fetching teachers:", error);
    throw error;
  }
};

/**
 * Register new teacher
 * POST /api/teacher-register
 */
export const registerTeacher = async (teacherData) => {
  try {
    const response = await apiClient.post("/teacher-register", teacherData);
    return response.data;
  } catch (error) {
    console.error("Error registering teacher:", error);
    throw error;
  }
};

/**
 * Activate a teacher
 * PUT /api/admin/activate/{id}
 */
export const activateTeacher = async (id) => {
  try {
    const response = await apiClient.put(`/admin/activate/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error activating teacher:", error);
    throw error;
  }
};

/**
 * Deactivate a teacher
 * PUT /api/admin/deactivate/{id}
 */
export const deactivateTeacher = async (id) => {
  try {
    const response = await apiClient.put(`/admin/deactivate/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deactivating teacher:", error);
    throw error;
  }
};

/**
 * Delete a teacher
 * DELETE /api/admin/user/delete/{id}
 */
export const deleteTeacher = async (id) => {
  try {
    const response = await apiClient.delete(`/admin/user/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting teacher:", error);
    throw error;
  }
};

/**
 * Get user's subject/subject title selections
 * GET /api/admin/user/{userId}/selections
 */
export const getUserSelections = async (userId) => {
  try {
    const response = await apiClient.get(`/admin/user/${userId}/selections`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user selections:", error);
    throw error;
  }
};

/**
 * Approve user selections and activate user
 * POST /api/admin/approve-selections/{userId}
 */
export const approveUserSelections = async (userId, data) => {
  try {
    const response = await apiClient.post(
      `/admin/approve-selections/${userId}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error approving selections:", error);
    throw error;
  }
};

// ==================== SUBJECT REQUESTS ====================

/**
 * Get all subject requests
 * GET /api/admin/subject-requests or /api/api/admin/subject-requests
 */
export const getSubjectRequests = async () => {
  try {
    const response = await apiClient.get("/admin/subject-requests");
    return response.data;
  } catch (error) {
    // Try alternative endpoint if first fails
    try {
      const response = await apiClient.get("/api/admin/subject-requests");
      return response.data;
    } catch (err) {
      console.error("Error fetching subject requests:", err);
      throw err;
    }
  }
};

/**
 * Approve a subject request
 * PUT /api/api/admin/subject-requests/{requestId}/approve?type={subject|subject_title}
 */
export const approveSubjectRequest = async (requestId, type) => {
  try {
    const response = await apiClient.put(
      `/api/admin/subject-requests/${requestId}/approve?type=${type}`
    );
    return response.data;
  } catch (error) {
    console.error("Error approving subject request:", error);
    throw error;
  }
};

/**
 * Reject a subject request
 * PUT /api/api/admin/subject-requests/{requestId}/reject?type={subject|subject_title}
 */
export const rejectSubjectRequest = async (requestId, type) => {
  try {
    const response = await apiClient.put(
      `/api/admin/subject-requests/${requestId}/reject?type=${type}`
    );
    return response.data;
  } catch (error) {
    console.error("Error rejecting subject request:", error);
    throw error;
  }
};

// ==================== SUBJECT & SUBJECT TITLE ====================

/**
 * Get all subjects
 * GET /api/subjects
 */
export const getAllSubjects = async () => {
  try {
    const response = await apiClient.get("/subjects");
    return response.data;
  } catch (error) {
    console.error("Error fetching subjects:", error);
    throw error;
  }
};

/**
 * Get subject titles by subject ID
 * GET /api/subject/{subjectId}/titles
 */
export const getSubjectTitlesBySubject = async (subjectId) => {
  try {
    const response = await apiClient.get(`/subject/${subjectId}/titles`);
    return response.data;
  } catch (error) {
    console.error("Error fetching subject titles:", error);
    throw error;
  }
};

/**
 * Get all subject titles
 * GET /api/subjectTitle
 */
export const getAllSubjectTitles = async () => {
  try {
    const response = await apiClient.get("/subjectTitle");
    return response.data;
  } catch (error) {
    console.error("Error fetching subject titles:", error);
    throw error;
  }
};

/**
 * Add new subject title
 * POST /api/subjectTitle
 */
export const addSubjectTitle = async (data) => {
  try {
    const response = await apiClient.post("/subjectTitle", data);
    return response.data;
  } catch (error) {
    console.error("Error adding subject title:", error);
    throw error;
  }
};

/**
 * Delete subject title
 * DELETE /api/subjectTitle/{id}
 */
export const deleteSubjectTitle = async (id) => {
  try {
    const response = await apiClient.delete(`/subjectTitle/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting subject title:", error);
    throw error;
  }
};

/**
 * Get all boards
 * GET /api/boards
 */
export const getAllBoards = async () => {
  try {
    const response = await apiClient.get("/boards");
    return response.data;
  } catch (error) {
    console.error("Error fetching boards:", error);
    throw error;
  }
};

// ==================== QUESTION MANAGEMENT ====================

/**
 * Get questions by type
 * GET /api/question?type={type}
 */
export const getQuestionsByType = async (type) => {
  try {
    const response = await apiClient.get(`/question?type=${type}`);
    // Handle both array and object response formats
    return response.data?.questions || response.data || [];
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

/**
 * Add new question
 * POST /api/question/add (multipart/form-data)
 */
export const addQuestion = async (formData) => {
  try {
    const response = await apiClient.post("/question/add", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error adding question:", error);
    throw error;
  }
};

/**
 * Edit question
 * PUT /api/question/edit/{id} (multipart/form-data)
 */
export const editQuestion = async (id, formData) => {
  try {
    const response = await apiClient.put(`/question/edit/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error editing question:", error);
    throw error;
  }
};

/**
 * Delete question
 * DELETE /api/question/delete/{id}
 */
export const deleteQuestion = async (id) => {
  try {
    const response = await apiClient.delete(`/question/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting question:", error);
    throw error;
  }
};

/**
 * Get question statistics
 * GET /api/question/analysis
 */
export const getQuestionAnalysis = async () => {
  try {
    const response = await apiClient.get("/question/analysis");
    return response.data;
  } catch (error) {
    console.error("Error fetching question analysis:", error);
    throw error;
  }
};

// ==================== ANSWER SHEET MANAGEMENT ====================

/**
 * Get all answer sheets
 * GET /api/answersheets
 */
export const getAllAnswerSheets = async () => {
  try {
    const response = await apiClient.get("/answersheets");
    return response.data;
  } catch (error) {
    console.error("Error fetching answer sheets:", error);
    throw error;
  }
};

/**
 * Add new answer sheet
 * POST /api/answersheets/add (multipart/form-data)
 */
export const addAnswerSheet = async (formData) => {
  try {
    const response = await apiClient.post("/answersheets/add", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error adding answer sheet:", error);
    throw error;
  }
};

/**
 * Delete answer sheet
 * DELETE /api/answersheets?id={id}
 */
export const deleteAnswerSheet = async (id) => {
  try {
    const response = await apiClient.delete(`/answersheets?id=${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting answer sheet:", error);
    throw error;
  }
};

// ==================== WORKSHEET MANAGEMENT ====================

/**
 * Get all worksheets
 * GET /api/worksheets
 */
export const getAllWorksheets = async () => {
  try {
    const response = await apiClient.get("/worksheets");
    return response.data;
  } catch (error) {
    console.error("Error fetching worksheets:", error);
    throw error;
  }
};

/**
 * Add new worksheet
 * POST /api/worksheets/add (multipart/form-data)
 */
export const addWorksheet = async (formData) => {
  try {
    const response = await apiClient.post("/worksheets/add", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error adding worksheet:", error);
    throw error;
  }
};

/**
 * Delete worksheet
 * DELETE /api/worksheets/{id}
 */
export const deleteWorksheet = async (id) => {
  try {
    const response = await apiClient.delete(`/worksheets/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting worksheet:", error);
    throw error;
  }
};

