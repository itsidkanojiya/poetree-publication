import apiClient from "./apiClient";
import { API_BASE_URL } from "../config/api";

/**
 * Start a live quiz session (teacher).
 * POST /api/live/start
 * @param {number} paperId - Quiz paper ID (Model 1 paper with type 'quiz')
 * @returns {Promise<{ sessionId: string, sessionCode?: string }>}
 */
export const startSession = async (paperId) => {
  const response = await apiClient.post("/live/start", { paperId: Number(paperId) });
  const data = response.data;
  return {
    sessionId: data.sessionId ?? data.session_id,
    sessionCode: data.sessionCode ?? data.session_code,
  };
};

/**
 * Get session state (teacher control view).
 * GET /api/live/session/:sessionId
 * @param {string} sessionId
 * @returns {Promise<object>} { status, sessionId, sessionCode, paper_title, currentQuestionIndex, questions, revealedQuestionIndices }
 */
export const getSessionState = async (sessionId) => {
  const response = await apiClient.get(`/live/session/${sessionId}`);
  return response.data?.data ?? response.data;
};

/**
 * Set current question index (teacher).
 * PATCH /api/live/session/:sessionId/current
 * @param {string} sessionId
 * @param {number} questionIndex - 0-based index
 */
export const setCurrentQuestion = async (sessionId, questionIndex) => {
  await apiClient.patch(`/live/session/${sessionId}/current`, {
    questionIndex: Number(questionIndex),
  });
};

/**
 * Reveal answer for a question (teacher).
 * POST /api/live/session/:sessionId/reveal
 * @param {string} sessionId
 * @param {number} [questionIndex] - 0-based; omit to use current
 */
export const revealAnswer = async (sessionId, questionIndex) => {
  const body = questionIndex != null ? { questionIndex: Number(questionIndex) } : {};
  await apiClient.post(`/live/session/${sessionId}/reveal`, body);
};

/**
 * End the live session (teacher).
 * POST /api/live/session/:sessionId/end
 * @param {string} sessionId
 */
export const endSession = async (sessionId) => {
  await apiClient.post(`/live/session/${sessionId}/end`);
};

/**
 * Fetch public session state (no auth). For projector/student views.
 * GET /api/live/public/:sessionId
 * @param {string} sessionId
 * @returns {Promise<object>} Same shape as getSessionState
 */
export const getPublicSessionState = async (sessionId) => {
  const url = `${API_BASE_URL}/live/public/${sessionId}`;
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    const err = new Error(response.status === 404 ? "Session not found" : "Failed to load session");
    err.status = response.status;
    throw err;
  }
  const data = await response.json();
  return data?.data ?? data;
};

/**
 * Fetch public session state by short code (no auth). For student view.
 * GET /api/live/public/code/:sessionCode
 * @param {string} sessionCode
 * @returns {Promise<object>} Same shape as getSessionState
 */
export const getPublicSessionByCode = async (sessionCode) => {
  const url = `${API_BASE_URL}/live/public/code/${encodeURIComponent(sessionCode)}`;
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    const err = new Error(response.status === 404 ? "Session not found" : "Failed to load session");
    err.status = response.status;
    throw err;
  }
  const data = await response.json();
  return data?.data ?? data;
};
