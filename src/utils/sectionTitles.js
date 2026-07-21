/**
 * Section (question-type) titles printed as the paper's section headings, per language.
 *
 * The title text now lives in the question-type registry (src/utils/questionTypes.js)
 * so a type's key, titles, marks and language scope are defined in ONE place. This
 * module keeps the public API (`getSectionTitle`, `detectPaperLanguage`) so every
 * existing caller is unchanged.
 *
 * Language is resolved from the SUBJECT NAME:
 *   1. by name — "Sanskrit"/"संस्कृत", "Hindi"/"हिंदी", "Gujarati"/"ગુજરાતી".
 *      Subjects are usually named in English ("Hindi"), so a script-only check would
 *      never match — name matching is what actually makes the translations appear.
 *   2. by script — Gujarati (U+0A80–U+0AFF) / Devanagari (U+0900–U+097F) as a fallback
 *      for subjects genuinely named in their own script. Devanagari → Hindi (Sanskrit
 *      shares the script, so it can only be identified by name).
 *
 * Any title missing for a language falls back to English.
 */
import { getType, normalizeTypeKey } from "./questionTypes";

/**
 * Resolve the paper language from the subject name.
 * @param {string} subjectName e.g. "Hindi", "ગુજરાતી", "Sanskrit", "Mathematics"
 * @returns {"english"|"hindi"|"gujarati"|"sanskrit"}
 */
export const detectPaperLanguage = (subjectName) => {
  if (!subjectName) return "english";
  const raw = String(subjectName);
  const name = raw.toLowerCase();

  // 1) By name first — subjects are usually named in English.
  if (name.includes("sanskrit") || raw.includes("संस्कृत")) return "sanskrit";
  if (name.includes("gujarati") || raw.includes("ગુજરાતી")) return "gujarati";
  if (name.includes("hindi") || raw.includes("हिंदी") || raw.includes("हिन्दी")) return "hindi";

  // 2) By script, for subjects genuinely named in their own script.
  if (/[઀-૿]/.test(raw)) return "gujarati";
  if (/[ऀ-ॿ]/.test(raw)) return "hindi"; // Sanskrit shares this script → name only

  return "english";
};

/**
 * The section heading for a question type, in the paper's language.
 * Falls back to the English title (then to the raw type) when a language is missing one.
 *
 * @param {string} type question type ("mcq" | "blank" | "synonyms" | ...)
 * @param {string} [subjectName] used to auto-detect the language
 * @param {string} [language] explicit language; skips detection when provided
 */
export const getSectionTitle = (type, subjectName, language) => {
  const entry = getType(type);
  if (!entry) return normalizeTypeKey(type);
  const lang = language || detectPaperLanguage(subjectName);
  return entry.titles[lang] || entry.titles.english || entry.label;
};

// Re-exported for callers that already import these from here.
export { DEFAULT_MARKS_PER_TYPE } from "./questionTypes";

export default getSectionTitle;
