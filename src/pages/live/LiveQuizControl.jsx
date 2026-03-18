import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getSessionState,
  setCurrentQuestion,
  revealAnswer,
  endSession,
} from "../../services/liveQuizService";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Square,
  ExternalLink,
  Loader,
  AlertCircle,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useFullscreen } from "./useFullscreen";
import { getOptionsList, isCorrectOption, normalizeSessionState } from "./liveQuizUtils";
import { getRandomQuote } from "./studyQuotes";
import QuizCompleteScreen from "./QuizCompleteScreen";

const POLL_INTERVAL_MS = 3000;

const LiveQuizControl = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(containerRef);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfettiOnce, setShowConfettiOnce] = useState(false);
  const [completionQuote, setCompletionQuote] = useState(null);
  const quoteWhenEndedRef = useRef(null);

  const fetchState = useCallback(async () => {
    if (!sessionId) return;
    try {
      const raw = await getSessionState(sessionId);
      setState(normalizeSessionState(raw));
      setError(null);
    } catch (err) {
      setError(err.response?.status === 404 || err.status === 404 ? "Session not found" : err.message || "Failed to load session");
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    if (!sessionId || state?.status === "ended") return;
    const interval = setInterval(fetchState, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [sessionId, state?.status, fetchState]);

  const handlePrevious = async () => {
    if (!state || state.status === "ended" || actionLoading) return;
    const idx = Math.max(0, (state.currentQuestionIndex ?? 0) - 1);
    setActionLoading(true);
    try {
      await setCurrentQuestion(sessionId, idx);
      await fetchState();
    } catch (err) {
      setError(err.message || "Failed to change question");
    } finally {
      setActionLoading(false);
    }
  };

  const handleNext = async () => {
    if (!state || state.status === "ended" || actionLoading) return;
    const questions = state.questions ?? [];
    const currentIdx = state.currentQuestionIndex ?? 0;
    const total = questions.length;
    const isLastQuestion = total > 0 && currentIdx >= total - 1;

    if (isLastQuestion) {
      setCompletionQuote(getRandomQuote());
      setShowConfettiOnce(true);
      setState((prev) => (prev ? { ...prev, status: "ended" } : prev));
      setActionLoading(true);
      try {
        await endSession(sessionId);
      } catch (err) {
        // Session ended locally
      } finally {
        setActionLoading(false);
      }
      return;
    }

    const idx = Math.min(total - 1, currentIdx + 1);
    setActionLoading(true);
    try {
      await setCurrentQuestion(sessionId, idx);
      await fetchState();
    } catch (err) {
      setError(err.message || "Failed to change question");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReveal = async () => {
    if (!state || state.status === "ended" || actionLoading) return;
    setActionLoading(true);
    try {
      await revealAnswer(sessionId, state.currentQuestionIndex);
      await fetchState();
    } catch (err) {
      setError(err.message || "Failed to reveal answer");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!state || state.status === "ended" || actionLoading) return;
    if (!window.confirm("End this live quiz? Students will see the completion screen.")) return;
    setActionLoading(true);
    try {
      await endSession(sessionId);
      setCompletionQuote(getRandomQuote());
      setShowConfettiOnce(true);
      await fetchState();
    } catch (err) {
      setError(err.message || "Failed to end session");
      setState((prev) => (prev ? { ...prev, status: "ended" } : prev));
      setCompletionQuote(getRandomQuote());
      setShowConfettiOnce(true);
    } finally {
      setActionLoading(false);
    }
  };

  const openProjector = () => {
    window.open(`${window.location.origin}/live/${sessionId}/projector`, "_blank");
  };

  if (loading && !state) {
    return (
      <div ref={containerRef} className="fixed inset-0 flex items-center justify-center bg-gray-100">
        <Loader className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error && !state) {
    return (
      <div ref={containerRef} className="fixed inset-0 flex flex-col items-center justify-center bg-gray-100 p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <button
          onClick={() => navigate("/dashboard/quizzes")}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  const questions = state?.questions ?? [];
  const currentIndex = state?.currentQuestionIndex ?? 0;
  const currentQ = questions[currentIndex];
  const revealed = state?.revealedQuestionIndices ?? [];
  const isRevealed = currentQ && revealed.includes(currentIndex);
  const total = questions.length;

  if (state?.status === "ended") {
    const totalQuestions = state?.questions?.length ?? 0;
    const quote = completionQuote ?? (quoteWhenEndedRef.current ??= getRandomQuote());
    return (
      <div ref={containerRef}>
        <QuizCompleteScreen
          paperTitle={state?.paper_title ?? "Quiz"}
          totalQuestions={totalQuestions}
          quote={quote}
          onBackToQuizzes={() => navigate("/dashboard/quizzes")}
          showConfetti={showConfettiOnce}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 min-h-screen bg-gradient-to-br from-gray-100 via-amber-50/30 to-gray-100 flex flex-col overflow-auto"
    >
      <div className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <button
            onClick={() => navigate("/dashboard/quizzes")}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-1 font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            Quizzes
          </button>
          <div className="flex items-center gap-2">
            {state?.sessionCode && (
              <span className="text-sm text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                Code: <strong>{state.sessionCode}</strong>
              </span>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleFullscreen}
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openProjector}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Open projector
            </motion.button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
          style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
        >
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-4">
            <h1 className="text-xl font-bold truncate">{state?.paper_title ?? "Live Quiz"}</h1>
            <p className="text-amber-100 text-sm mt-1">
              Question {total ? currentIndex + 1 : 0} of {total}
            </p>
          </div>

          {error && (
            <div className="px-6 py-2 bg-red-50 text-red-700 text-sm">{error}</div>
          )}

          <div className="p-6">
            <AnimatePresence mode="wait">
              {currentQ ? (
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", damping: 25 }}
                  className="mb-6"
                >
                  <p className="text-lg text-gray-800 font-medium mb-4">{currentQ.question ?? "—"}</p>
                  <ul className="space-y-2 mb-4">
                    {getOptionsList(currentQ).map(({ key, label }) => (
                      <motion.li
                        key={key}
                        className={`px-4 py-3 rounded-xl border transition-colors ${
                          isRevealed && isCorrectOption(key, label, currentQ.answer)
                            ? "bg-green-100 border-green-400 text-green-800 font-medium shadow-md"
                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                        animate={isRevealed && currentQ.answer === key ? { scale: [1, 1.01, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <span className="font-medium">{key}.</span> {label}
                        {isRevealed && isCorrectOption(key, label, currentQ.answer) && (
                          <span className="ml-2 text-green-600 text-sm">(Correct)</span>
                        )}
                      </motion.li>
                    ))}
                  </ul>
                  {isRevealed && (
                    <p className="text-sm text-gray-500">
                      Answer: <strong>{currentQ.answer}</strong>
                    </p>
                  )}
                </motion.div>
              ) : (
                <p className="text-gray-500">No questions in this quiz.</p>
              )}
            </AnimatePresence>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              <motion.button
                onClick={handlePrevious}
                disabled={currentIndex <= 0 || actionLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </motion.button>
              <motion.button
                onClick={handleNext}
                disabled={actionLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  currentIndex >= total - 1 && total > 0
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {currentIndex >= total - 1 && total > 0 ? (
                  <>
                    <Square className="w-5 h-5" />
                    End session
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
              <motion.button
                onClick={handleReveal}
                disabled={isRevealed || actionLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                Reveal answer
              </motion.button>
              <motion.button
                onClick={handleEndSession}
                disabled={actionLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium disabled:opacity-50"
              >
                <Square className="w-5 h-5" />
                End session
              </motion.button>
            </div>
          </div>
        </motion.div>

        {state?.sessionCode && (
          <p className="mt-4 text-sm text-gray-500 text-center">
            Students: <strong>{window.location.origin}/live/join/{state.sessionCode}</strong>
          </p>
        )}
      </div>
    </div>
  );
};

export default LiveQuizControl;
