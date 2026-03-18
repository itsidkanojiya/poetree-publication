import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getPublicSessionState,
  getSessionState,
  setCurrentQuestion,
  revealAnswer,
  endSession,
} from "../../services/liveQuizService";
import { Loader, AlertCircle, Maximize2, Minimize2, ChevronLeft, ChevronRight, Eye, Loader2, Square } from "lucide-react";
import { useFullscreen } from "./useFullscreen";
import { getOptionsList, isCorrectOption, normalizeSessionState } from "./liveQuizUtils";
import { getRandomQuote } from "./studyQuotes";
import QuizCompleteScreen from "./QuizCompleteScreen";

const POLL_INTERVAL_MS = 2500;

const LiveQuizProjector = () => {
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
  const isTeacher = typeof window !== "undefined" && !!window.localStorage?.getItem("authToken");

  const fetchState = useCallback(async () => {
    if (!sessionId) return;
    try {
      const raw = isTeacher
        ? await getSessionState(sessionId)
        : await getPublicSessionState(sessionId);
      setState(normalizeSessionState(raw));
      setError(null);
    } catch (err) {
      setError(err.response?.status === 404 || err.status === 404 ? "Session not found" : err.message || "Failed to load session");
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId, isTeacher]);

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
    } finally {
      setActionLoading(false);
    }
  };

  const handleNext = async () => {
    if (!state || state.status === "ended" || actionLoading) return;
    const questions = state?.questions ?? [];
    const currentIndex = state.currentQuestionIndex ?? 0;
    const total = questions.length;
    const isLastQuestion = total > 0 && currentIndex >= total - 1;

    if (isLastQuestion) {
      setCompletionQuote(getRandomQuote());
      setShowConfettiOnce(true);
      setState((prev) => (prev ? { ...prev, status: "ended" } : prev));
      setActionLoading(true);
      try {
        await endSession(sessionId);
      } catch (err) {
        // Session ended locally; API may fail if already ended
      } finally {
        setActionLoading(false);
      }
      return;
    }

    const idx = Math.min(total - 1, currentIndex + 1);
    setActionLoading(true);
    try {
      await setCurrentQuestion(sessionId, idx);
      await fetchState();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReveal = async () => {
    if (!state || state.status === "ended" || actionLoading) return;
    setActionLoading(true);
    const idx = state.currentQuestionIndex ?? 0;
    try {
      await revealAnswer(sessionId, idx);
      // Optimistic update so answer shows even if next fetch is slow or API shape differs
      setState((prev) => ({
        ...prev,
        revealedQuestionIndices: [...(prev.revealedQuestionIndices ?? []), idx].filter(
          (v, i, a) => a.indexOf(v) === i
        ),
      }));
      await fetchState();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !state) {
    return (
      <div ref={containerRef} className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <Loader className="w-20 h-20 text-amber-400 animate-spin" />
          <p className="mt-4 text-amber-200/80">Loading session...</p>
        </motion.div>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div ref={containerRef} className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <AlertCircle className="w-20 h-20 text-amber-400 mb-4 mx-auto" />
          <h1 className="text-3xl font-bold mb-2">Session not found</h1>
          <p className="text-slate-300">{error}</p>
        </motion.div>
      </div>
    );
  }

  if (state?.status === "ended") {
    const totalQuestions = state?.questions?.length ?? 0;
    const quote = completionQuote ?? (quoteWhenEndedRef.current ??= getRandomQuote());
    return (
      <div ref={containerRef}>
        <QuizCompleteScreen
          paperTitle={state?.paper_title ?? "Quiz"}
          totalQuestions={totalQuestions}
          quote={quote}
          onBackToQuizzes={isTeacher ? () => navigate("/dashboard/quizzes") : null}
          showConfetti={showConfettiOnce}
        />
      </div>
    );
  }

  const questions = state?.questions ?? [];
  const currentIndex = state?.currentQuestionIndex ?? 0;
  const currentQ = questions[currentIndex];
  const revealed = state?.revealedQuestionIndices ?? [];
  const isRevealed = currentQ && revealed.includes(currentIndex);
  const total = questions.length;
  const optionsList = currentQ ? getOptionsList(currentQ) : [];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col overflow-hidden"
    >
      {/* Fullscreen toggle */}
      <button
        type="button"
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition"
        aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
      </button>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-10">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
          initial={{ width: 0 }}
          animate={{ width: `${total ? ((currentIndex + 1) / total) * 100 : 0}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div
        className={`flex-1 flex flex-col items-center justify-center p-8 md:p-12 ${isTeacher ? "pb-24" : ""}`}
        style={{ perspective: "1000px" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 80, rotateY: -15 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: -80, rotateY: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-4xl"
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
          >
            <motion.h1
              className="text-2xl md:text-3xl font-bold text-amber-400 mb-2 truncate"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {state?.paper_title ?? "Live Quiz"}
            </motion.h1>
            <motion.p
              className="text-slate-400 text-xl mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              Question {total ? currentIndex + 1 : 0} of {total}
            </motion.p>

            {currentQ ? (
              <>
                <motion.p
                  className="text-3xl md:text-5xl font-medium text-white mb-10 leading-snug"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {currentQ.question ?? "—"}
                </motion.p>
                <ul className="space-y-4" style={{ perspective: "800px" }}>
                  {optionsList.map(({ key, label }, i) => {
                    const correct = isRevealed && isCorrectOption(key, label, currentQ.answer);
                    return (
                      <motion.li
                        key={key}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 200 }}
                        className="relative"
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        <motion.div
                          className={`relative px-8 py-5 rounded-2xl text-2xl font-medium overflow-hidden ${
                            correct
                              ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-2xl shadow-green-500/30"
                              : "bg-slate-800/80 text-slate-200 border border-slate-700/80 backdrop-blur-sm"
                          }`}
                          animate={{
                            rotateY: correct ? 0 : 0,
                            scale: correct ? 1.02 : 1,
                            boxShadow: correct ? "0 25px 50px -12px rgba(34, 197, 94, 0.4)" : "0 4px 6px -1px rgba(0,0,0,0.2)",
                          }}
                          transition={{ type: "spring", damping: 20, stiffness: 300 }}
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          {correct && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 }}
                            />
                          )}
                          <span className="text-amber-400 font-bold mr-4 text-3xl">{key}.</span>
                          <span className="relative z-10">{label}</span>
                          {correct && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", delay: 0.3 }}
                              className="ml-3 text-green-100 text-xl font-semibold"
                            >
                              ✓ Correct
                            </motion.span>
                          )}
                        </motion.div>
                      </motion.li>
                    );
                  })}
                </ul>
                {/* Solution (when revealed and available) */}
                {isRevealed && (currentQ.solution || currentQ.explanation) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-6 rounded-2xl bg-slate-800/90 border border-amber-500/30"
                  >
                    <p className="text-amber-400 font-semibold text-lg mb-2">Solution</p>
                    <p className="text-white text-xl leading-relaxed">
                      {currentQ.solution || currentQ.explanation}
                    </p>
                  </motion.div>
                )}
              </>
            ) : (
              <p className="text-2xl text-slate-400">No question to display.</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Teacher controls: Previous, Reveal, Next (only when logged in) */}
      {isTeacher && state?.status !== "ended" && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-slate-900/95 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-3">
            <motion.button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex <= 0 || actionLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronLeft className="w-5 h-5" />}
              Previous
            </motion.button>
            <motion.button
              type="button"
              onClick={handleReveal}
              disabled={isRevealed || actionLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
              Reveal answer
            </motion.button>
            <motion.button
              type="button"
              onClick={handleNext}
              disabled={actionLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                currentIndex >= total - 1 && total > 0
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-slate-700 hover:bg-slate-600 text-white"
              }`}
            >
              {currentIndex >= total - 1 && total > 0 ? (
                <>
                  End session
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5" />}
                </>
              ) : (
                <>
                  Next
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                </>
              )}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveQuizProjector;
