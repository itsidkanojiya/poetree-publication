import React from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { Confetti } from "./Confetti";

/**
 * Completion screen matching the reference design: light background, white card,
 * green check icon, summary, motivational quote in yellow block, orange button.
 * Used by Projector, Control, and Student views when quiz has ended.
 */
export default function QuizCompleteScreen({
  paperTitle = "Quiz",
  totalQuestions = 0,
  quote,
  onBackToQuizzes,
  showConfetti = false,
  className = "",
}) {
  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center bg-stone-100/95 p-6 overflow-hidden ${className}`}
    >
      <Confetti fire={showConfetti} />
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 22, stiffness: 200 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500 text-white mb-6"
        >
          <CheckCircle className="w-10 h-10" strokeWidth={2.5} />
        </motion.div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Quiz Complete!</h1>
        <p className="text-gray-500 text-sm mb-0.5">Quiz</p>
        <p className="text-gray-400 text-sm mb-6">
          {totalQuestions} question{totalQuestions !== 1 ? "s" : ""} completed
        </p>
        <blockquote className="text-left bg-amber-50 border-l-4 border-amber-400 pl-4 py-3 pr-3 mb-6 rounded-r-lg">
          <p className="text-amber-900/90 text-base font-medium italic leading-snug">
            &ldquo;{quote}&rdquo;
          </p>
        </blockquote>
        {onBackToQuizzes && (
          <button
            type="button"
            onClick={onBackToQuizzes}
            className="w-full px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition"
          >
            Back to Quizzes
          </button>
        )}
      </motion.div>
    </div>
  );
}
