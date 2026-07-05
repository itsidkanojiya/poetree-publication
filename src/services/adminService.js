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
 *
 * Backend contract (IMPORTANT):
 * - `subject_ids` and `subject_title_ids` are ROW IDs (user_subjects.id / user_subject_titles.id)
 * - To approve by MASTER IDs, use:
 *   - approve_by_subject_ids: number[] (subjects.subject_id)
 *   - approve_by_subject_title_ids: number[] (subject_titles.subject_title_id)
 *
 * Pass either row-id arrays or master-id arrays. Do not mix.
 */
export const approveUserSelections = async (
  userId,
  {
    // Row IDs
    subject_ids,
    subject_title_ids,
    // Master IDs
    approve_by_subject_ids,
    approve_by_subject_title_ids,
    reject_others = false,
  },
) => {
  try {
    const rowSubjectIds = Array.isArray(subject_ids)
      ? subject_ids.map((id) => Number(id))
      : [];
    const rowTitleIds = Array.isArray(subject_title_ids)
      ? subject_title_ids.map((id) => Number(id))
      : [];
    const masterSubjectIds = Array.isArray(approve_by_subject_ids)
      ? approve_by_subject_ids.map((id) => Number(id))
      : [];
    const masterTitleIds = Array.isArray(approve_by_subject_title_ids)
      ? approve_by_subject_title_ids.map((id) => Number(id))
      : [];

    const usingRowIds = rowSubjectIds.length > 0 || rowTitleIds.length > 0;
    const usingMasterIds = masterSubjectIds.length > 0 || masterTitleIds.length > 0;

    if (usingRowIds && usingMasterIds) {
      throw new Error("approveUserSelections: do not mix row-id and master-id fields");
    }

    const body = usingMasterIds
      ? {
          approve_by_subject_ids: masterSubjectIds,
          approve_by_subject_title_ids: masterTitleIds,
          reject_others: Boolean(reject_others),
        }
      : {
          subject_ids: rowSubjectIds,
          subject_title_ids: rowTitleIds,
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
 * List chapters by subject title.
 * GET /api/chapters?subject_title_id=:id
 *
 * Returns all chapters for the subject title, ordered by chapter_number
 * (numbered first, then unnumbered by name). chapter_number may be null.
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
 * Body: { chapter_name: string, subject_title_id: number, chapter_number?: number|null, standard?: number|null }
 */
export const createChapter = async ({ chapter_name, subject_title_id, chapter_number, standard }) => {
  try {
    const body = {
      chapter_name: String(chapter_name).trim(),
      subject_title_id: Number(subject_title_id),
    };
    if (chapter_number !== undefined) {
      body.chapter_number =
        chapter_number === "" || chapter_number == null ? null : Number(chapter_number);
    }
    if (standard !== undefined) {
      body.standard = standard === "" || standard == null ? null : Number(standard);
    }
    const response = await apiClient.post("/chapters", body);
    return response.data;
  } catch (error) {
    console.error("Error creating chapter:", error);
    throw error;
  }
};

/**
 * Update a chapter (admin)
 * PUT /api/chapters/:chapterId
 * Body: { chapter_name?: string, chapter_number?: number|null, standard?: number|null }
 */
export const updateChapter = async (chapterId, { chapter_name, chapter_number, standard } = {}) => {
  try {
    const body = {};
    if (chapter_name !== undefined) body.chapter_name = String(chapter_name).trim();
    if (chapter_number !== undefined) {
      body.chapter_number =
        chapter_number === "" || chapter_number == null ? null : Number(chapter_number);
    }
    if (standard !== undefined) {
      body.standard = standard === "" || standard == null ? null : Number(standard);
    }
    const response = await apiClient.put(`/chapters/${Number(chapterId)}`, body);
    return response.data;
  } catch (error) {
    console.error("Error updating chapter:", error);
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
 * Get questions by type (and optional filters including chapter_id, difficulty, scope)
 * GET /api/question?type={type}&chapter_id=1&difficulty=easy&subject_title_id=&board_id=&standard=
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
    if (filters.difficulty != null && filters.difficulty !== "") {
      const d = Array.isArray(filters.difficulty)
        ? filters.difficulty.join(",")
        : String(filters.difficulty);
      if (d) params.append("difficulty", d);
    }
    if (filters.subject_title_id != null && filters.subject_title_id !== "") {
      params.append("subject_title_id", String(filters.subject_title_id));
    }
    if (filters.board_id != null && filters.board_id !== "") {
      params.append("board_id", String(filters.board_id));
    }
    if (filters.standard != null && filters.standard !== "") {
      params.append("standard", String(filters.standard));
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
 * Smart paper proposal: balanced chapters, difficulty, sections (marks %)
 * POST /api/papers/smart-propose
 * @param {Object} payload - see docs/PROMPT_BACKEND_SMART_PAPER.md
 */
export const smartProposePaper = async (payload) => {
  try {
    const response = await apiClient.post("/papers/smart-propose", payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 120000,
    });
    return response.data;
  } catch (error) {
    console.error("Error proposing smart paper:", error);
    throw error;
  }
};

/**
 * Per question-type marks breakdown for the current teaching context.
 * Used to show a live estimated total (count × unit_marks) before generating.
 */
export const getMarksBreakdown = async ({ subject_title_id, board_id, standard }) => {
  try {
    const response = await apiClient.get("/papers/marks-breakdown", {
      params: {
        subject_title_id: Number(subject_title_id),
        board_id: Number(board_id),
        standard: Number(standard),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching marks breakdown:", error);
    throw error;
  }
};

/**
 * Optional: question bank stats for admin suggestions
 * GET /api/question/stats?subject_title_id=&board_id=&standard=
 */
export const getQuestionBankStats = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.subject_title_id != null && filters.subject_title_id !== "") {
      params.append("subject_title_id", String(filters.subject_title_id));
    }
    if (filters.board_id != null && filters.board_id !== "") {
      params.append("board_id", String(filters.board_id));
    }
    if (filters.standard != null && filters.standard !== "") {
      params.append("standard", String(filters.standard));
    }
    const q = params.toString();
    const response = await apiClient.get(`/question/stats${q ? `?${q}` : ""}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching question stats:", error);
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
 * Bulk delete questions
 * POST /api/question/bulk-delete  { ids: [...] }
 */
export const bulkDeleteQuestions = async (ids) => {
  try {
    const response = await apiClient.post(`/question/bulk-delete`, { ids });
    return response.data;
  } catch (error) {
    console.error("Error bulk deleting questions:", error);
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

/**
 * Bulk delete answer sheets
 * POST /api/answersheets/bulk-delete  { ids: [...] }
 */
export const bulkDeleteAnswerSheets = async (ids) => {
  try {
    const response = await apiClient.post(`/answersheets/bulk-delete`, { ids });
    return response.data;
  } catch (error) {
    console.error("Error bulk deleting answer sheets:", error);
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

/**
 * Bulk delete worksheets
 * POST /api/worksheets/bulk-delete  { ids: [...] }
 */
export const bulkDeleteWorksheets = async (ids) => {
  try {
    const response = await apiClient.post(`/worksheets/bulk-delete`, { ids });
    return response.data;
  } catch (error) {
    console.error("Error bulk deleting worksheets:", error);
    throw error;
  }
};

// ==================== READYMADE PAPERS ====================

/**
 * Get all readymade papers
 * GET /api/readymade-papers
 * @param {Object} filters - Optional { chapter_id: number }
 */
export const getAllReadymadePapers = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.chapter_id != null && filters.chapter_id !== "") {
      params.append("chapter_id", String(filters.chapter_id));
    }
    const query = params.toString();
    const url = query ? `/readymade-papers?${query}` : "/readymade-papers";
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching readymade papers:", error);
    throw error;
  }
};

/**
 * Add a readymade paper (PDF and/or Word)
 * POST /api/readymade-papers/add (multipart/form-data)
 */
export const addReadymadePaper = async (formData) => {
  try {
    const response = await apiClient.post("/readymade-papers/add", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Error adding readymade paper:", error);
    throw error;
  }
};

/**
 * Delete a readymade paper
 * DELETE /api/readymade-papers/{id}
 */
export const deleteReadymadePaper = async (id) => {
  try {
    const response = await apiClient.delete(`/readymade-papers/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting readymade paper:", error);
    throw error;
  }
};

/**
 * Bulk delete readymade papers
 * POST /api/readymade-papers/bulk-delete  { ids: [...] }
 */
export const bulkDeleteReadymadePapers = async (ids) => {
  try {
    const response = await apiClient.post(`/readymade-papers/bulk-delete`, { ids });
    return response.data;
  } catch (error) {
    console.error("Error bulk deleting readymade papers:", error);
    throw error;
  }
};

// ==================== PLANNERS ====================

/** Get all planners — GET /api/planners */
export const getAllPlanners = async () => {
  try {
    const response = await apiClient.get("/planners");
    return response.data;
  } catch (error) {
    console.error("Error fetching planners:", error);
    throw error;
  }
};

/** Add planner — POST /api/planners/add (multipart/form-data) */
export const addPlanner = async (formData) => {
  try {
    const response = await apiClient.post("/planners/add", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Error adding planner:", error);
    throw error;
  }
};

/** Delete planner — DELETE /api/planners/{id} */
export const deletePlanner = async (id) => {
  try {
    const response = await apiClient.delete(`/planners/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting planner:", error);
    throw error;
  }
};

/** Bulk delete planners — POST /api/planners/bulk-delete { ids: [...] } */
export const bulkDeletePlanners = async (ids) => {
  try {
    const response = await apiClient.post(`/planners/bulk-delete`, { ids });
    return response.data;
  } catch (error) {
    console.error("Error bulk deleting planners:", error);
    throw error;
  }
};

// ==================== TIME TABLES ====================

/** Get all time tables — GET /api/timetables */
export const getAllTimeTables = async () => {
  try {
    const response = await apiClient.get("/timetables");
    return response.data;
  } catch (error) {
    console.error("Error fetching time tables:", error);
    throw error;
  }
};

/** Add time table — POST /api/timetables/add (multipart/form-data) */
export const addTimeTable = async (formData) => {
  try {
    const response = await apiClient.post("/timetables/add", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Error adding time table:", error);
    throw error;
  }
};

/** Delete time table — DELETE /api/timetables/{id} */
export const deleteTimeTable = async (id) => {
  try {
    const response = await apiClient.delete(`/timetables/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting time table:", error);
    throw error;
  }
};

/** Bulk delete time tables — POST /api/timetables/bulk-delete { ids: [...] } */
export const bulkDeleteTimeTables = async (ids) => {
  try {
    const response = await apiClient.post(`/timetables/bulk-delete`, { ids });
    return response.data;
  } catch (error) {
    console.error("Error bulk deleting time tables:", error);
    throw error;
  }
};

// ==================== PAPER STYLES ====================

/** Get all paper styles — GET /api/paper-styles */
export const getAllPaperStyles = async () => {
  try {
    const response = await apiClient.get("/paper-styles");
    return response.data;
  } catch (error) {
    console.error("Error fetching paper styles:", error);
    throw error;
  }
};

/** Add paper style — POST /api/paper-styles/add (multipart/form-data) */
export const addPaperStyle = async (formData) => {
  try {
    const response = await apiClient.post("/paper-styles/add", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Error adding paper style:", error);
    throw error;
  }
};

/** Delete paper style — DELETE /api/paper-styles/{id} */
export const deletePaperStyle = async (id) => {
  try {
    const response = await apiClient.delete(`/paper-styles/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting paper style:", error);
    throw error;
  }
};

/** Bulk delete paper styles — POST /api/paper-styles/bulk-delete { ids: [...] } */
export const bulkDeletePaperStyles = async (ids) => {
  try {
    const response = await apiClient.post(`/paper-styles/bulk-delete`, { ids });
    return response.data;
  } catch (error) {
    console.error("Error bulk deleting paper styles:", error);
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

