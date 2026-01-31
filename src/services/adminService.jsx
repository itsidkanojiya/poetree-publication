import apiClient from "./apiClient";

// ==================== ANALYSIS/DASHBOARD ====================

/**
 * Get teacher/student analysis
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
 * Body: { subject_ids: number[], subject_title_ids: number[], reject_others: boolean }
 */
export const approveUserSelections = async (userId, { subject_ids, subject_title_ids, reject_others = false }) => {
  try {
    const body = {
      subject_ids: Array.isArray(subject_ids) ? subject_ids.map((id) => Number(id)) : [],
      subject_title_ids: Array.isArray(subject_title_ids) ? subject_title_ids.map((id) => Number(id)) : [],
      reject_others: Boolean(reject_others),
    };
    const response = await apiClient.post(
      `/admin/approve-selections/${userId}`,
      body
    );
    return response.data;
  } catch (error) {
    console.error("Error approving selections:", error);
    throw error;
  }
};

// ==================== SUBJECT REQUEST ====================

/**
 * Get all subject requests
 * GET /api/admin/subject-requests
 */
export const getSubjectRequests = async () => {
  try {
    const response = await apiClient.get("/admin/subject-requests");
    return response.data;
  } catch (error) {
    console.error("Error fetching subject requests:", error);
    throw error;
  }
};

/**
 * Approve a subject request
 * PUT /api/admin/subject-requests/{requestId}/approve?type={subject|subject_title}
 */
export const approveSubjectRequest = async (requestId, type) => {
  try {
    const response = await apiClient.put(
      `/admin/subject-requests/${requestId}/approve?type=${type}`
    );
    return response.data;
  } catch (error) {
    console.error("Error approving subject request:", error);
    throw error;
  }
};

/**
 * Reject a subject request
 * POST /api/admin/subject-requests/{requestId}/reject?type={subject|subject_title}
 */
export const rejectSubjectRequest = async (requestId, type) => {
  try {
    const response = await apiClient.post(
      `/admin/subject-requests/${requestId}/reject?type=${type}`
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
    // Handle both array and object response
    return response.data?.questions || response.data || [];
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

/**
 * Add new question (multipart/form-data)
 * POST /api/question/add
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
 * Edit question (multipart/form-data)
 * PUT /api/question/edit/{id}
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

// ==================== ANSWER SHEET ====================

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
 * Add new answer sheet (multipart/form-data)
 * POST /api/answersheet/add
 */
export const addAnswerSheet = async (formData) => {
  try {
    const response = await apiClient.post("/answersheet/add", formData, {
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

// ==================== WORKSHEET ====================

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
 * Add new worksheet (multipart/form-data)
 * POST /api/worksheet/add
 */
export const addWorksheet = async (formData) => {
  try {
    const response = await apiClient.post("/worksheet/add", formData, {
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

// ==================== DEFAULT PAPER TEMPLATES ====================

/**
 * Create default paper template
 * POST /api/papers/templates/create
 */
export const createTemplate = async (templateData) => {
  try {
    const formData = new FormData();

    // Debug: Log templateData to see what we're receiving
    console.log("createTemplate - templateData received:", templateData);
    console.log(
      "createTemplate - school_name value:",
      templateData.school_name
    );
    
    // Required fields
    formData.append("user_id", templateData.user_id);
    formData.append("type", templateData.type || "default");
    // Always set is_template to true for template creation endpoint
    formData.append("is_template", "true");
    formData.append("title", templateData.title || "");
    // Add paper_title if provided (optional)
    if (templateData.paper_title) {
      formData.append("paper_title", templateData.paper_title);
    }
    // Add school_name (required by API, comes from user profile)
    // CRITICAL: This must be sent, even if "NA"
    let finalSchoolName = "NA";
    if (templateData.school_name) {
      finalSchoolName = String(templateData.school_name).trim();
      if (finalSchoolName === "") {
        finalSchoolName = "NA";
      }
    }

    // ALWAYS append school_name - this is required by the API
    formData.append("school_name", finalSchoolName);

    console.log("=== SCHOOL_NAME DEBUG ===");
    console.log(
      "createTemplate - templateData.school_name:",
      templateData.school_name
    );
    console.log("createTemplate - finalSchoolName:", finalSchoolName);
    console.log(
      "createTemplate - Appending school_name to FormData:",
      finalSchoolName
    );

    // Verify it was added to FormData BEFORE sending
    const formDataEntries = Array.from(formData.entries());
    const schoolNameEntry = formDataEntries.find(
      ([key]) => key === "school_name"
    );
    console.log(
      "createTemplate - Verified school_name in FormData:",
      schoolNameEntry
    );
    console.log("=== END SCHOOL_NAME DEBUG ===");

    // Add address if provided (might be required by API)
    if (templateData.address) {
      formData.append("address", templateData.address);
      console.log("createTemplate - Appending address:", templateData.address);
    }

    // Add logo if provided (optional)
    if (templateData.logo) {
      // If logo is a URL string, append as logo_url, otherwise it's a file
      if (typeof templateData.logo === "string") {
        formData.append("logo_url", templateData.logo);
        console.log("createTemplate - Appending logo_url:", templateData.logo);
      } else if (templateData.logo instanceof File) {
        formData.append("logo", templateData.logo);
        console.log(
          "createTemplate - Appending logo file:",
          templateData.logo.name
        );
      }
    }

    formData.append("standard", String(templateData.standard || 0));
    formData.append("subject_id", String(templateData.subject_id || ""));
    formData.append(
      "subject_title_id",
      String(templateData.subject_title_id || "")
    );
    formData.append("board_id", String(templateData.board_id || ""));
    formData.append("subject", templateData.subject || "NA");
    formData.append("board", templateData.board || "NA");
    formData.append(
      "date",
      templateData.date || new Date().toISOString().split("T")[0]
    );
    formData.append("body", templateData.body || "[]");
    formData.append("total_marks", String(templateData.total_marks || 0));
    
    // Marks breakdown
    formData.append("marks_mcq", String(templateData.marks_mcq || 0));
    formData.append("marks_short", String(templateData.marks_short || 0));
    formData.append("marks_long", String(templateData.marks_long || 0));
    formData.append("marks_blank", String(templateData.marks_blank || 0));
    formData.append("marks_onetwo", String(templateData.marks_onetwo || 0));
    formData.append(
      "marks_truefalse",
      String(templateData.marks_truefalse || 0)
    );
    formData.append("marks_passage", String(templateData.marks_passage || 0));
    formData.append("marks_match", String(templateData.marks_match || 0));
    
    // Optional fields
    if (templateData.timing)
      formData.append("timing", String(templateData.timing));
    
    // Template metadata (includes header_id and question_types)
    // Always send template_metadata - never null
    if (templateData.template_metadata) {
      formData.append("template_metadata", templateData.template_metadata);
    } else {
      // Fallback: create minimal template_metadata if not provided
      // This should not happen if CreateTemplate is working correctly, but adding as safety
      console.warn("template_metadata not provided, creating minimal metadata");
      const minimalMetadata = JSON.stringify({
        question_types: {},
        header_id: null,
      });
      formData.append("template_metadata", minimalMetadata);
    }

    const response = await apiClient.post(
      "/papers/templates/create",
      formData,
      {
      headers: {
        "Content-Type": "multipart/form-data",
      },
        timeout: 60000, // 60 seconds timeout for large requests
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error creating template:", error);
    console.error("Error response data:", error.response?.data);
    console.error("Error response status:", error.response?.status);

    // Log all FormData entries to debug
    if (error.response?.data?.message?.includes("Missing required fields")) {
      console.error("=== FormData Debug ===");
      console.error("FormData was sent, but API says fields are missing.");
      console.error("Check backend validation for required fields.");
    }

    throw error;
  }
};
