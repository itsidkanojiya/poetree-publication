import apiClient from "./apiClient";
import { addNewPaper } from "./paperService";
import { API_BASE_URL } from "../config/api";

/**
 * Suggest MCQs for quiz creation.
 * GET /api/quiz/suggest-mcq
 * @param {{ subject_id?: string|number, subject_title_id?: string|number, chapter_id?: string|number, standard?: string|number, board_id?: string|number, count?: number }} params
 * @returns {Promise<Array>} List of questions (options shown; do not expose correct answer in UI)
 */
export const suggestMcq = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.subject_id != null && params.subject_id !== "") searchParams.append("subject_id", String(params.subject_id));
  if (params.subject_title_id != null && params.subject_title_id !== "") searchParams.append("subject_title_id", String(params.subject_title_id));
  if (params.chapter_id != null && params.chapter_id !== "") searchParams.append("chapter_id", String(params.chapter_id));
  if (params.standard != null && params.standard !== "") searchParams.append("standard", String(params.standard));
  if (params.board_id != null && params.board_id !== "") searchParams.append("board_id", String(params.board_id));
  if (params.count != null && params.count > 0) searchParams.append("count", String(params.count));
  const url = `/quiz/suggest-mcq${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const response = await apiClient.get(url);
  const data = response.data;
  return Array.isArray(data?.questions) ? data.questions : (Array.isArray(data) ? data : []);
};

/**
 * Get quiz (paper) with full question list for detail/edit.
 * GET /api/quiz/:paperId or GET /api/papers/:id/with-questions
 */
export const getQuizWithQuestions = async (paperId) => {
  const response = await apiClient.get(`/quiz/${paperId}`);
  const data = response.data;
  if (data && typeof data === "object" && data.data != null && data.success !== undefined) return data.data;
  return data;
};

/**
 * Download a PDF from quiz endpoint and trigger file save.
 * @param {string|number} paperId
 * @param {string} endpoint - e.g. 'paper-pdf', 'answer-key', 'omr-sheet'
 * @param {string} filename - e.g. 'quiz-student.pdf'
 */
const downloadQuizPdf = async (paperId, endpoint, filename) => {
  const token = localStorage.getItem("authToken");
  const url = `${API_BASE_URL}/quiz/${paperId}/${endpoint}`;
  const response = await fetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error(response.statusText || "Download failed");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename || `${endpoint}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
};

export const getQuizPaperPdf = (paperId, filename = "quiz-student.pdf") =>
  downloadQuizPdf(paperId, "paper-pdf", filename);

export const getQuizAnswerKey = (paperId, filename = "quiz-answer-key.pdf") =>
  downloadQuizPdf(paperId, "answer-key", filename);

export const getQuizOmrSheet = (paperId, filename = "quiz-omr-sheet.pdf") =>
  downloadQuizPdf(paperId, "omr-sheet", filename);

/**
 * Save a new quiz (create).
 * POST /api/papers with type=quiz, body=selectedQuestionIds, plus metadata.
 * @param {{ user: { id: number }, paper_title: string, date?: string, timing?: string, standard?: number|string, subject?: string, subject_id?: number, board?: string, board_id?: number, subject_title_id?: number, chapter_id?: number }} metadata
 * @param {number[]} selectedQuestionIds
 */
export const saveQuiz = async (metadata, selectedQuestionIds) => {
  if (!metadata?.user?.id) throw new Error("User not authenticated.");
  const formData = new FormData();
  formData.append("user_id", metadata.user.id);
  formData.append("type", "quiz");
  formData.append("body", JSON.stringify(selectedQuestionIds));
  formData.append("paper_title", metadata.paper_title || "");
  const now = new Date();
  const formattedDate = now.toISOString().split("T")[0];
  formData.append("date", metadata.date || formattedDate);
  if (metadata.timing != null && metadata.timing !== "") formData.append("timing", metadata.timing);
  const standardValue = metadata.standard != null
    ? (typeof metadata.standard === "string" ? parseInt(metadata.standard, 10) || 0 : metadata.standard)
    : 0;
  formData.append("standard", standardValue);
  formData.append("subject", metadata.subject || "NA");
  formData.append("board", metadata.board != null && metadata.board !== "" ? String(metadata.board) : "NA");
  if (metadata.subject_id != null) formData.append("subject_id", String(metadata.subject_id));
  if (metadata.board_id != null) formData.append("board_id", String(metadata.board_id));
  if (metadata.subject_title_id != null && metadata.subject_title_id !== "") formData.append("subject_title_id", String(metadata.subject_title_id));
  if (metadata.chapter_id != null && metadata.chapter_id !== "") formData.append("chapter_id", String(metadata.chapter_id));
  return addNewPaper(formData);
};

/**
 * Update an existing quiz.
 * PUT /api/papers/:id
 */
export const updateQuiz = async (paperId, metadata, selectedQuestionIds) => {
  const formData = new FormData();
  formData.append("type", "quiz");
  formData.append("body", JSON.stringify(selectedQuestionIds));
  formData.append("paper_title", metadata.paper_title || "");
  formData.append("date", metadata.date || "");
  if (metadata.timing != null && metadata.timing !== "") formData.append("timing", metadata.timing);
  const standardValue = metadata.standard != null
    ? (typeof metadata.standard === "string" ? parseInt(metadata.standard, 10) || 0 : metadata.standard)
    : 0;
  formData.append("standard", standardValue);
  formData.append("subject", metadata.subject || "NA");
  formData.append("board", metadata.board != null && metadata.board !== "" ? String(metadata.board) : "NA");
  if (metadata.subject_title_id != null && metadata.subject_title_id !== "") formData.append("subject_title_id", String(metadata.subject_title_id));
  if (metadata.chapter_id != null && metadata.chapter_id !== "") formData.append("chapter_id", String(metadata.chapter_id));
  const response = await apiClient.put(`/papers/${paperId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
