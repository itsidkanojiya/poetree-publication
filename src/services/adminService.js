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

// ==================== SUBJECT REQUESTS ====================

/**
 * Get all subject requests
 * GET /api/admin/subject-requests
 */
export const getSubjectRequests = async () => {
  try {
    const response = await apiClient.get("/admin/subject-requests");
    return response.data;
  } catch (error) {
    // Try alternative endpoint if first fails
    try {
      const response = await apiClient.get("/admin/subject-requests");
      return response.data;
    } catch (err) {
      console.error("Error fetching subject requests:", err);
      throw err;
    }
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

/**
 * Remove a user's approved subject/subject-title selections (admin only).
 * POST /api/admin/users/:userId/selections/remove
 * Body: { user_subject_ids?: number[], user_subject_title_ids?: number[] }
 * Uses row ids from user_subjects and user_subject_titles for that user.
 */
export const removeUserApprovedSelections = async (
  userId,
  { user_subject_ids = [], user_subject_title_ids = [] }
) => {
  const sid = Array.isArray(user_subject_ids) ? user_subject_ids : [];
  const tid = Array.isArray(user_subject_title_ids) ? user_subject_title_ids : [];
  if (sid.length === 0 && tid.length === 0) {
    throw new Error("At least one of user_subject_ids or user_subject_title_ids must be non-empty");
  }
  const response = await apiClient.post(
    `/admin/users/${userId}/selections/remove`,
    {
      ...(sid.length > 0 ? { user_subject_ids: sid } : {}),
      ...(tid.length > 0 ? { user_subject_title_ids: tid } : {}),
    }
  );
  return response.data;
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
 * Get subject titles by subject ID with board and standard
 * GET /api/subject/{subjectId}/titles?board_id=1&standard=5
 */
export const getSubjectTitlesBySubjectAndContext = async (subjectId, { board_id, standard } = {}) => {
  if (!subjectId) return [];
  try {
    const params = new URLSearchParams();
    if (board_id != null && board_id !== "") params.append("board_id", String(board_id));
    if (standard != null && standard !== "") params.append("standard", String(standard));
    const query = params.toString();
    const response = await apiClient.get(`/subject/${subjectId}/titles${query ? `?${query}` : ""}`);
    const data = response.data;
    return Array.isArray(data) ? data : data?.subject_titles ?? data?.data ?? [];
  } catch (error) {
    console.error("Error fetching subject titles by context:", error);
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
 * Get subject titles filtered by subject_id and/or standard
 * GET /api/subjectTitle?subject_id=1&standard=5
 */
export const getSubjectTitlesFiltered = async ({ subject_id, standard } = {}) => {
  try {
    const params = new URLSearchParams();
    if (subject_id != null && subject_id !== "") params.append("subject_id", String(subject_id));
    if (standard != null && standard !== "") params.append("standard", String(standard));
    const query = params.toString();
    const response = await apiClient.get(`/subjectTitle${query ? `?${query}` : ""}`);
    const data = response.data;
    return Array.isArray(data) ? data : data?.subject_titles ?? data?.data ?? [];
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

// ==================== CHAPTERS ====================

/**
 * List chapters by subject title
 * GET /api/chapters?subject_title_id=:id
 */
export const getChaptersBySubjectTitle = async (subjectTitleId) => {
  try {
    const response = await apiClient.get("/chapters", {
      params: { subject_title_id: Number(subjectTitleId) },
    });
    const data = response.data;
    return Array.isArray(data?.chapters) ? data.chapters : data || [];
  } catch (error) {
    console.error("Error fetching chapters:", error);
    throw error;
  }
};

/**
 * Create chapter
 * POST /api/chapters
 * Body: { chapter_name: string, subject_title_id: number }
 */
export const createChapter = async ({ chapter_name, subject_title_id }) => {
  try {
    const response = await apiClient.post("/chapters", {
      chapter_name: String(chapter_name).trim(),
      subject_title_id: Number(subject_title_id),
    });
    return response.data;
  } catch (error) {
    console.error("Error creating chapter:", error);
    throw error;
  }
};

/**
 * Delete a chapter
 * DELETE /api/chapters/:chapterId
 */
export const deleteChapter = async (chapterId) => {
  try {
    const response = await apiClient.delete(`/chapters/${Number(chapterId)}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting chapter:", error);
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

// ==================== STANDARDS ====================

/**
 * Get all standards (no auth – use in dropdowns)
 * GET /api/standards
 */
export const getAllStandards = async () => {
  try {
    const response = await apiClient.get("/standards");
    const data = response.data;
    const list = Array.isArray(data?.standards) ? data.standards : data;
    return list || [];
  } catch (error) {
    console.error("Error fetching standards:", error);
    throw error;
  }
};

/**
 * Get one standard by ID
 * GET /api/standards/:id
 */
export const getStandardById = async (id) => {
  try {
    const response = await apiClient.get(`/standards/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching standard:", error);
    throw error;
  }
};

/**
 * Create standard (admin)
 * POST /api/standards
 */
export const createStandard = async (body) => {
  try {
    const response = await apiClient.post("/standards", body);
    return response.data;
  } catch (error) {
    console.error("Error creating standard:", error);
    throw error;
  }
};

/**
 * Update standard (admin)
 * PUT /api/standards/:id
 */
export const updateStandard = async (id, body) => {
  try {
    const response = await apiClient.put(`/standards/${id}`, body);
    return response.data;
  } catch (error) {
    console.error("Error updating standard:", error);
    throw error;
  }
};

/**
 * Delete standard (admin)
 * DELETE /api/standards/:id
 */
export const deleteStandard = async (id) => {
  try {
    const response = await apiClient.delete(`/standards/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting standard:", error);
    throw error;
  }
};

// ==================== ANIMATIONS ====================

/**
 * Get all animations (no auth – for user Animations page)
 * GET /api/animations
 * @param {{ chapter_id?: number }} [params] - Optional filter by chapter_id
 */
export const getAnimations = async (params = {}) => {
  try {
    const query = new URLSearchParams();
    if (params.chapter_id != null && params.chapter_id !== "") {
      query.append("chapter_id", String(params.chapter_id));
    }
    const url = query.toString() ? `/animations?${query.toString()}` : "/animations";
    const response = await apiClient.get(url);
    const data = response.data;
    const list = Array.isArray(data?.animations) ? data.animations : data;
    return list || [];
  } catch (error) {
    console.error("Error fetching animations:", error);
    throw error;
  }
};

/**
 * Get one animation by ID
 * GET /api/animations/:id
 */
export const getAnimationById = async (id) => {
  try {
    const response = await apiClient.get(`/animations/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching animation:", error);
    throw error;
  }
};

/**
 * Create animation (admin)
 * POST /api/animations
 */
export const createAnimation = async (body) => {
  try {
    const response = await apiClient.post("/animations", body);
    return response.data;
  } catch (error) {
    console.error("Error creating animation:", error);
    throw error;
  }
};

/**
 * Update animation (admin)
 * PUT /api/animations/:id
 */
export const updateAnimation = async (id, body) => {
  try {
    const response = await apiClient.put(`/animations/${id}`, body);
    return response.data;
  } catch (error) {
    console.error("Error updating animation:", error);
    throw error;
  }
};

/**
 * Delete animation (admin)
 * DELETE /api/animations/:id
 */
export const deleteAnimation = async (id) => {
  try {
    const response = await apiClient.delete(`/animations/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting animation:", error);
    throw error;
  }
};

// ==================== QUESTION MANAGEMENT ====================

/**
 * Get questions by type (and optional filters including chapter_id)
 * GET /api/question?type={type}&chapter_id=1
 */
export const getQuestionsByType = async (type, filters = {}) => {
  try {
    const apiType = type === "true&false" ? "truefalse" : type;
    const params = new URLSearchParams();
    params.append("type", apiType);
    if (filters.chapter_id != null && filters.chapter_id !== "") {
      const cid = Array.isArray(filters.chapter_id)
        ? filters.chapter_id.join(",")
        : String(filters.chapter_id);
      if (cid) params.append("chapter_id", cid);
    }
    const query = params.toString();
    const response = await apiClient.get(`/question?${query}`);
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
 * @param {Object} filters - Optional { chapter_id: number }
 */
export const getAllAnswerSheets = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.chapter_id != null && filters.chapter_id !== "") {
      params.append("chapter_id", String(filters.chapter_id));
    }
    const query = params.toString();
    const url = query ? `/answersheets?${query}` : "/answersheets";
    const response = await apiClient.get(url);
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
 * DELETE /api/answersheets/{id}
 */
export const deleteAnswerSheet = async (id) => {
  try {
    const response = await apiClient.delete(`/answersheets/${id}`);
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
 * @param {Object} filters - Optional { chapter_id: number }
 */
export const getAllWorksheets = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.chapter_id != null && filters.chapter_id !== "") {
      params.append("chapter_id", String(filters.chapter_id));
    }
    const query = params.toString();
    const url = query ? `/worksheets?${query}` : "/worksheets";
    const response = await apiClient.get(url);
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

// ==================== DEFAULT PAPER TEMPLATES ====================

/**
 * Create default paper template
 * POST /api/papers/templates/create
 */
export const createTemplate = async (templateData) => {
  try {
    const formData = new FormData();
    
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
    const schoolName = templateData.school_name ? String(templateData.school_name).trim() : "NA";
    const finalSchoolName = schoolName && schoolName !== "" ? schoolName : "NA";
    formData.append("school_name", finalSchoolName);
    // Add address if provided
    if (templateData.address) {
      formData.append("address", templateData.address);
    }
    // Add logo if provided (optional)
    if (templateData.logo) {
      if (typeof templateData.logo === "string") {
        formData.append("logo_url", templateData.logo);
      } else if (templateData.logo instanceof File) {
        formData.append("logo", templateData.logo);
      }
    }
    formData.append("standard", String(templateData.standard || 0));
    formData.append("subject_id", String(templateData.subject_id || ""));
    formData.append("subject_title_id", String(templateData.subject_title_id || ""));
    if (templateData.chapter_id != null && templateData.chapter_id !== "") {
      formData.append("chapter_id", String(templateData.chapter_id));
    }
    formData.append("board_id", String(templateData.board_id || ""));
    formData.append("subject", templateData.subject || "NA");
    formData.append("board", templateData.board || "NA");
    formData.append("date", templateData.date || new Date().toISOString().split("T")[0]);
    formData.append("body", templateData.body || "[]");
    formData.append("total_marks", String(templateData.total_marks || 0));
    
    // Marks breakdown
    formData.append("marks_mcq", String(templateData.marks_mcq || 0));
    formData.append("marks_short", String(templateData.marks_short || 0));
    formData.append("marks_long", String(templateData.marks_long || 0));
    formData.append("marks_blank", String(templateData.marks_blank || 0));
    formData.append("marks_onetwo", String(templateData.marks_onetwo || 0));
    formData.append("marks_truefalse", String(templateData.marks_truefalse || 0));
    formData.append("marks_passage", String(templateData.marks_passage || 0));
    formData.append("marks_match", String(templateData.marks_match || 0));
    
    // Optional fields
    if (templateData.timing) formData.append("timing", String(templateData.timing));
    
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
    
    const response = await apiClient.post("/papers/templates/create", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 seconds timeout for large requests
    });
    return response.data;
  } catch (error) {
    console.error("Error creating template:", error);
    throw error;
  }
};

/**
 * Get all templates (Admin)
 * GET /api/papers/templates
 */
export const getAllTemplates = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.subject) params.append("subject", filters.subject);
    if (filters.standard) params.append("standard", filters.standard);
    if (filters.board) params.append("board", filters.board);
    
    const queryString = params.toString();
    const url = `/papers/templates${queryString ? `?${queryString}` : ""}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching templates:", error);
    throw error;
  }
};

/**
 * Get single template details (Admin)
 * GET /api/papers/templates/:id
 */
export const getTemplateById = async (id) => {
  try {
    const response = await apiClient.get(`/papers/templates/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching template:", error);
    throw error;
  }
};

