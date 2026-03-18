import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getPublicSessionByCode } from "../../services/liveQuizService";
import { Loader, AlertCircle, Maximize2, Minimize2 } from "lucide-react";
import { useFullscreen } from "./useFullscreen";
import { getOptionsList, isCorrectOption, normalizeSessionState } from "./liveQuizUtils";
import { getRandomQuote } from "./studyQuotes";
import QuizCompleteScreen from "./QuizCompleteScreen";

const POLL_INTERVAL_MS = 2500;

/** Lightweight confetti-style burst when answer is revealed */
const RevealCelebration = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full bg-amber-400"
        initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
        animate={{
          scale: [0, 1.2, 0],
          x: Math.cos((i / 12) * Math.PI * 2) * 120,
          y: Math.sin((i / 12) * Math.PI * 2) * 120,
          opacity: [1, 0.8, 0],
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    ))}
  </div>
);

const LiveQuizStudent = () => {
  const { sessionCode } = useParams();
  const containerRef = useRef(null);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(containerRef);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const prevCurrentRevealedRef = useRef(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showConfettiOnce, setShowConfettiOnce] = useState(false);
  const quoteWhenEndedRef = useRef(null);

  const fetchState = useCallback(async () => {
    if (!sessionCode) return;
    try {
      const raw = await getPublicSessionByCode(sessionCode);
      setState(normalizeSessionState(raw));
      setError(null);
    } catch (err) {
      setError(err.status === 404 ? "Session not found" : err.message || "Failed to load session");
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [sessionCode]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    if (!sessionCode || state?.status === "ended") return;
    const interval = setInterval(fetchState, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [sessionCode, state?.status, fetchState]);

  useEffect(() => {
    if (state?.status === "ended") setShowConfettiOnce(true);
  }, [state?.status]);

  // Trigger celebration when current question gets revealed (not on first load)
  const questions = state?.questions ?? [];
  const currentIndex = state?.currentQuestionIndex ?? 0;
  const revealed = state?.revealedQuestionIndices ?? [];
  const currentRevealed = state && revealed.includes(currentIndex);
  useEffect(() => {
    if (currentRevealed && !prevCurrentRevealedRef.current) {
      setShowCelebration(true);
      const t = setTimeout(() => setShowCelebration(false), 1200);
      return () => clearTimeout(t);
    }
    prevCurrentRevealedRef.current = !!currentRevealed;
  }, [currentRevealed]);

  if (loading && !state) {
    return (
      <div ref={containerRef} className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <Loader className="w-20 h-20 text-amber-400 animate-spin" />
          <p className="mt-4 text-amber-200/80">Joining quiz...</p>
        </motion.div>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div ref={containerRef} className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white p-8">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <AlertCircle className="w-20 h-20 text-amber-400 mb-4 mx-auto" />
          <h1 className="text-3xl font-bold mb-2">Session not found</h1>
          <p className="text-slate-300">{error}</p>
          <p className="text-slate-400 text-sm mt-4">Check the code and try again.</p>
        </motion.div>
      </div>
    );
  }

  if (state?.status === "ended") {
    const totalQuestions = state?.questions?.length ?? 0;
    const quote = quoteWhenEndedRef.current ??= getRandomQuote();
    return (
      <div ref={containerRef}>
        <QuizCompleteScreen
          paperTitle={state?.paper_title ?? "Quiz"}
          totalQuestions={totalQuestions}
          quote={quote}
          onBackToQuizzes={null}
          showConfetti={showConfettiOnce}
        />
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isRevealed = currentQ && revealed.includes(currentIndex);
  const total = questions.length;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white flex flex-col overflow-hidden"
    >
      {showCelebration && <RevealCelebration />}

      {/* Hint: teacher controls the question */}
      <p className="absolute top-4 left-4 z-20 text-slate-400 text-sm">
        The teacher will move to the next question.
      </p>
      {/* Fullscreen toggle */}
      <button
        type="button"
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition"
        aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
      </button>

      {/* Progress dots - interactive feel */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {total > 0 && [...Array(total)].map((_, i) => (
          <motion.div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < currentIndex ? "bg-amber-500" : i === currentIndex ? "bg-amber-400 scale-125" : "bg-white/30"
            }`}
            animate={{ scale: i === currentIndex ? 1.25 : 1 }}
            transition={{ type: "spring", stiffness: 400 }}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10" style={{ perspective: "1000px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 40, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-4xl"
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.h1
              className="text-xl md:text-3xl font-bold text-amber-400 mb-2 truncate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {state?.paper_title ?? "Live Quiz"}
            </motion.h1>
            <motion.p
              className="text-slate-400 text-lg mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              Question {total ? currentIndex + 1 : 0} of {total}
            </motion.p>

            {currentQ ? (
              <>
                <motion.p
                  className="text-2xl md:text-4xl font-medium text-white mb-8 leading-snug"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {currentQ.question ?? "—"}
                </motion.p>
                <ul className="space-y-3" style={{ perspective: "800px" }}>
                  {getOptionsList(currentQ).map(({ key, label }, i) => {
                    const correct = isRevealed && isCorrectOption(key, label, currentQ.answer);
                    return (
                      <motion.li
                        key={key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.06, type: "spring", stiffness: 200 }}
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        <motion.div
                          className={`relative px-6 py-4 rounded-xl text-lg md:text-2xl font-medium cursor-default select-none overflow-hidden ${
                            correct
                              ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl shadow-green-500/25"
                              : "bg-slate-800/80 text-slate-200 border border-slate-700/80 backdrop-blur-sm hover:bg-slate-700/80 hover:border-slate-600 active:scale-[0.99]"
                          }`}
                          whileHover={!correct ? { scale: 1.01, y: -2 } : {}}
                          whileTap={!correct ? { scale: 0.99 } : {}}
                          animate={{
                            scale: correct ? 1.02 : 1,
                            boxShadow: correct ? "0 20px 40px -12px rgba(34, 197, 94, 0.35)" : "0 4px 6px -1px rgba(0,0,0,0.2)",
                          }}
                          transition={{ type: "spring", damping: 22, stiffness: 300 }}
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          {correct && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-white/25 to-transparent"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.15 }}
                            />
                          )}
                          <span className="text-amber-400 font-bold mr-3 text-xl">{key}.</span>
                          <span className="relative z-10">{label}</span>
                          {correct && (
                            <motion.span
                              initial={{ scale: 0, rotate: -10 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", delay: 0.25 }}
                              className="ml-2 inline-block text-green-100 font-semibold"
                            >
                              ✓ Correct
                            </motion.span>
                          )}
                        </motion.div>
                      </motion.li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <p className="text-xl text-slate-400">No question to display.</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LiveQuizStudent;
