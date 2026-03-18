/**
 * Normalize question options from API (object or array) to [{ key: "A", label: "..." }, ...].
 * Supports: { "A": "4", "B": "3" } or ["4", "3"] or [{ option: "4" }, { text: "3" }].
 */
export function getOptionsList(q) {
  if (!q?.options) return [];
  let opts = q.options;
  if (typeof opts === "string") {
    try {
      opts = JSON.parse(opts);
    } catch {
      return [];
    }
  }
  if (!opts || typeof opts !== "object") return [];
  if (Array.isArray(opts)) {
    return opts.map((item, i) => {
      const key = String.fromCharCode(65 + i);
      const label =
        typeof item === "object" && item !== null
          ? item.option ?? item.text ?? item.label ?? ""
          : String(item ?? "");
      return { key, label };
    });
  }
  return Object.entries(opts).map(([key, label]) => ({
    key: String(key),
    label: String(label ?? ""),
  }));
}

/**
 * Check if this option is the correct answer.
 * answer from API may be: "A", or 0 (index), or the option text.
 */
export function isCorrectOption(optionKey, optionLabel, answer) {
  if (answer == null || answer === "") return false;
  if (String(answer).toUpperCase() === String(optionKey).toUpperCase()) return true;
  if (Number(answer) === optionKey.charCodeAt(0) - 65) return true;
  if (String(answer).trim() === String(optionLabel).trim()) return true;
  return false;
}

/**
 * Normalize live session state from API (supports snake_case).
 */
export function normalizeSessionState(data) {
  if (!data) return data;
  return {
    ...data,
    currentQuestionIndex: data.currentQuestionIndex ?? data.current_question_index ?? 0,
    questions: data.questions ?? [],
    revealedQuestionIndices: data.revealedQuestionIndices ?? data.revealed_question_indices ?? [],
  };
}
