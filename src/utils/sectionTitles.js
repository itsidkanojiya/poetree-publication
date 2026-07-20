/**
 * Section (question-type) titles printed as the paper's section headings, per language.
 *
 * Single source of truth — these used to be duplicated in every paper renderer, which
 * let them drift. Import `getSectionTitle` instead of redefining them.
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

// Canonical title keys. NOTE: the question type is `blank` but the title key is
// `blanks` — normalizeTitleKey bridges that so callers can pass either.
const normalizeTitleKey = (type) => {
  if (!type) return type;
  if (type === "blank") return "blanks";
  if (type === "truefalse") return "true_false";
  return type;
};

export const englishTitles = {
  mcq: "Multiple Choice Questions (MCQs). Tick the correct options.",
  blanks: "Fill in the blanks in each sentence with an appropriate word.",
  true_false: "Write (T) for True and (F) for False.",
  onetwo: "Answer the following questions in one or two sentences.",
  short: "Short Answer Questions.",
  long: "Long Answer Questions.",
  passage: "Read the passage and answer the following questions.",
  match: "Match the following.",
};

export const hindiTitles = {
  mcq: "निम्नलिखित प्रश्नों के उत्तर दिए गए विकल्पों में से सही विकल्प चुनकर लिखिए ।",
  blanks: "रिक्तस्थानों की पूर्ति कीजिए ।",
  true_false:
    "निम्नलिखित कथनों में सही कथनों के सामने (✓) और गलत कथनों के सामने (✗) का निशान लगाइए ।",
  onetwo: "निम्नलिखित प्रश्नों के उत्तर एक - एक वाक्य में दीजिए ।",
  short: "निम्नलिखित प्रश्नों के उत्तर दो - तीन वाक्यों में लिखिए ।",
  long: "निम्नलिखित प्रश्नों के उत्तर चार - पाँच वाक्यों में लिखिए ।",
  passage: "दिए गए काव्य को पढ़कर नीचे लिखे प्रश्नों के उत्तर लिखिए ।",
  match: "निम्नलिखित का मिलान कीजिए ।",
};

export const gujaratiTitles = {
  mcq: "નીચેના દરેક પ્રશ્નોના ઉત્તર માટે આપેલા વિકલ્પોમાંથી સાચો વિકલ્પ શોધીને લખો.",
  blanks: "ખાલી જગ્યા પૂરો.",
  true_false:
    "નીચેના વિધાનોમાંથી ખરા વિધાનો સામે ü ની અને ખોટા વિધાનો સામે û ની નિશાની કરો.",
  onetwo: "નીચેના પ્રશ્નોના ઉત્તર એક - એક વાક્યમાં લખો.",
  short: "નીચેના પ્રશ્નોના ઉત્તર બે-ત્રણ વાક્યમાં લખો.",
  long: "નીચેના પ્રશ્નોના ઉત્તર સંક્ષેપમાં લખો.",
  passage: "નીચેનો ફકરો વાંચી પ્રશ્નોના જવાબ લખો.",
  match: "જોડકા જોડો.",
};

// Sanskrit papers use English instructions. Only the keys below differ from English;
// short / long / passage intentionally fall back to the English wording.
export const sanskritTitles = {
  mcq: "Choose the Correct Answer from the Options Given Below.",
  blanks: "Fill in the Blanks with Appropriate Words.",
  true_false: "Write ‘T’ for True and ‘F’ for False.",
  onetwo: "Answer the following questions in Sanskrit.",
  match: "Match the following.",
};

const TITLE_SETS = {
  english: englishTitles,
  hindi: hindiTitles,
  gujarati: gujaratiTitles,
  sanskrit: sanskritTitles,
};

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
 * @param {string} type question type ("mcq" | "blank" | "true_false" | ...)
 * @param {string} [subjectName] used to auto-detect the language
 * @param {string} [language] explicit language; skips detection when provided
 */
export const getSectionTitle = (type, subjectName, language) => {
  const key = normalizeTitleKey(type);
  const lang = language || detectPaperLanguage(subjectName);
  const set = TITLE_SETS[lang] || englishTitles;
  return set[key] || englishTitles[key] || type;
};

/** Default marks per question type. */
export const DEFAULT_MARKS_PER_TYPE = {
  mcq: 1,
  blank: 1,
  true_false: 1,
  onetwo: 1,
  short: 2,
  long: 5,
  passage: 3,
  match: 4,
};

export default getSectionTitle;
