/**
 * QUESTION TYPE REGISTRY — the single source of truth for question types.
 *
 * These used to be spelled out in ~20 parallel lists across 12 files (section keys,
 * default counts, UI groups, labels, colours, per-language titles, default marks…),
 * which meant adding a type required 20 edits and most mistakes failed *silently*.
 * Everything is now derived from this one array.
 *
 * Adding a type = add one entry here (plus the backend allow-lists in
 * poetree-publication-backend/src/constants/questionTypes.js).
 *
 * Fields
 *   key          canonical snake_case id, stored in questions.type. NO aliases —
 *                deliberately avoiding the legacy true_false/truefalse/true&false mess.
 *   apiKey       what the API expects, when it differs from `key` (true_false -> truefalse)
 *   layout       'plain'  — question text only (short/long/onetwo and all 4 new types)
 *                'options'— MCQ-style options grid
 *                'row'    — questions printed side-by-side in a wrapping row (synonyms/antonyms)
 *                'passage'/'match' — their own bespoke rendering
 *   languages    null = every subject. Otherwise ONLY these paper languages.
 *   titles       section heading per language; `english` is the fallback for any gap.
 */

export const PAPER_LANGUAGES = ["english", "hindi", "gujarati", "sanskrit"];

/** Languages the 3 shared language-specific types are allowed in. */
const LANG_SUBJECTS = ["gujarati", "hindi", "sanskrit"];

export const QUESTION_TYPES = [
  {
    key: "mcq",
    label: "Multiple Choice Questions",
    short: "MCQ",
    layout: "options",
    group: "objective",
    defaultMarks: 1,
    defaultCount: 8,
    color: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
    languages: null,
    titles: {
      english: "Multiple Choice Questions (MCQs). Tick the correct options.",
      hindi:
        "निम्नलिखित प्रश्नों के उत्तर दिए गए विकल्पों में से सही विकल्प चुनकर लिखिए ।",
      gujarati:
        "નીચેના દરેક પ્રશ્નોના ઉત્તર માટે આપેલા વિકલ્પોમાંથી સાચો વિકલ્પ શોધીને લખો.",
      sanskrit: "Choose the Correct Answer from the Options Given Below.",
    },
  },
  {
    key: "blank",
    label: "Fill in the Blanks",
    short: "Fill in the Blanks",
    layout: "plain",
    group: "objective",
    defaultMarks: 1,
    defaultCount: 2,
    color: "bg-orange-500",
    badge: "bg-orange-100 text-orange-700",
    languages: null,
    titles: {
      english: "Fill in the blanks in each sentence with an appropriate word.",
      hindi: "रिक्तस्थानों की पूर्ति कीजिए ।",
      gujarati: "ખાલી જગ્યા પૂરો.",
      sanskrit: "Fill in the Blanks with Appropriate Words.",
    },
  },
  {
    key: "true_false",
    apiKey: "truefalse",
    label: "True or False",
    short: "True/False",
    layout: "plain",
    group: "objective",
    defaultMarks: 1,
    defaultCount: 2,
    color: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700",
    languages: null,
    titles: {
      english: "Write (T) for True and (F) for False.",
      hindi:
        "निम्नलिखित कथनों में सही कथनों के सामने (✓) और गलत कथनों के सामने (✗) का निशान लगाइए ।",
      gujarati:
        "નીચેના વિધાનોમાંથી ખરા વિધાનો સામે ü ની અને ખોટા વિધાનો સામે û ની નિશાની કરો.",
      sanskrit: "Write ‘T’ for True and ‘F’ for False.",
    },
  },
  {
    key: "onetwo",
    label: "One or Two Sentence Questions",
    short: "One–two sentence",
    layout: "plain",
    group: "written",
    defaultMarks: 1,
    defaultCount: 2,
    color: "bg-teal-500",
    badge: "bg-teal-100 text-teal-700",
    languages: null,
    titles: {
      english: "Answer the following questions in one or two sentences.",
      hindi: "निम्नलिखित प्रश्नों के उत्तर एक - एक वाक्य में दीजिए ।",
      gujarati: "નીચેના પ્રશ્નોના ઉત્તર એક - એક વાક્યમાં લખો.",
      sanskrit: "Answer the following questions in Sanskrit.",
    },
  },
  {
    key: "short",
    label: "Short Answer Questions",
    short: "Short answer",
    layout: "plain",
    group: "written",
    defaultMarks: 2,
    defaultCount: 4,
    color: "bg-green-500",
    badge: "bg-green-100 text-green-700",
    languages: null,
    titles: {
      english: "Short Answer Questions.",
      hindi: "निम्नलिखित प्रश्नों के उत्तर दो - तीन वाक्यों में लिखिए ।",
      gujarati: "નીચેના પ્રશ્નોના ઉત્તર બે-ત્રણ વાક્યમાં લખો.",
      // sanskrit intentionally omitted -> falls back to english
    },
  },
  {
    key: "long",
    label: "Long Answer Questions",
    short: "Long answer",
    layout: "plain",
    group: "written",
    defaultMarks: 5,
    defaultCount: 6,
    color: "bg-purple-500",
    badge: "bg-purple-100 text-purple-700",
    languages: null,
    titles: {
      english: "Long Answer Questions.",
      hindi: "निम्नलिखित प्रश्नों के उत्तर चार - पाँच वाक्यों में लिखिए ।",
      gujarati: "નીચેના પ્રશ્નોના ઉત્તર સંક્ષેપમાં લખો.",
    },
  },
  {
    key: "passage",
    label: "Passage",
    short: "Passage",
    layout: "passage",
    group: "context",
    defaultMarks: 3,
    defaultCount: 0,
    color: "bg-indigo-500",
    badge: "bg-indigo-100 text-indigo-700",
    languages: null,
    titles: {
      english: "Read the passage and answer the following questions.",
      hindi: "दिए गए काव्य को पढ़कर नीचे लिखे प्रश्नों के उत्तर लिखिए ।",
      gujarati: "નીચેનો ફકરો વાંચી પ્રશ્નોના જવાબ લખો.",
    },
  },
  {
    key: "match",
    label: "Match the Following",
    short: "Match",
    layout: "match",
    group: "context",
    defaultMarks: 4,
    defaultCount: 1,
    color: "bg-rose-500",
    badge: "bg-rose-100 text-rose-700",
    languages: null,
    titles: {
      english: "Match the following.",
      hindi: "निम्नलिखित का मिलान कीजिए ।",
      gujarati: "જોડકા જોડો.",
      sanskrit: "Match the following.",
    },
  },

  /* ---- Language-specific types: Gujarati / Hindi / Sanskrit ONLY ---- */
  {
    key: "complete_lines",
    label: "Complete the Lines",
    short: "Complete lines",
    layout: "plain",
    group: "language",
    // 1 mark each x 2 questions => the section prints "2 marks".
    defaultMarks: 1,
    defaultCount: 2,
    color: "bg-cyan-500",
    badge: "bg-cyan-100 text-cyan-700",
    languages: LANG_SUBJECTS,
    titles: {
      english: "Complete the following lines.",
      hindi: "कविता की पंक्तिया पूर्ण कीजिए ।",
      gujarati: "કાવ્યપંક્તિઓ પૂર્ણ કરીને લખો.",
      sanskrit: "Complete the following shlok.",
    },
  },
  {
    key: "synonyms",
    label: "Synonyms",
    short: "Synonyms",
    // Words print side-by-side in a wrapping row: (1) સુંદર  (2) નદી  (3) મિત્ર
    layout: "row",
    group: "language",
    // 1 mark each x 3 words => the section prints "3 marks". Marks may be
    // fractional (e.g. 0.5) — the DB columns are DECIMAL for this reason.
    defaultMarks: 1,
    defaultCount: 3,
    color: "bg-lime-500",
    badge: "bg-lime-100 text-lime-700",
    languages: LANG_SUBJECTS,
    titles: {
      english: "Write the synonyms of the words given below.",
      hindi: "निम्नलिखित शब्दों के समानार्थी शब्द लिखिए ।",
      gujarati: "નીચે આપેલા શબ્દોના સમાનાર્થી શબ્દ લખો.",
      sanskrit:
        "Write the true synonyms of the Sanskrit word given below from option.",
    },
  },
  {
    key: "antonyms",
    label: "Antonyms",
    short: "Antonyms",
    layout: "row",
    group: "language",
    defaultMarks: 0.5,
    defaultCount: 3,
    color: "bg-pink-500",
    badge: "bg-pink-100 text-pink-700",
    languages: LANG_SUBJECTS,
    titles: {
      english: "Write the opposites of the words given below.",
      hindi: "निम्नलिखित शब्दों के विरोधी शब्द लिखिए ।",
      gujarati: "નીચે આપેલા શબ્દોના વિરોધી શબ્દ લખો.",
      sanskrit:
        "Write the true opposite of the Sanskrit word given below from option.",
    },
  },
  {
    key: "translate",
    label: "Translation",
    short: "Translate",
    layout: "plain",
    group: "language",
    defaultMarks: 3,
    defaultCount: 0,
    color: "bg-violet-500",
    badge: "bg-violet-100 text-violet-700",
    languages: ["sanskrit"], // Sanskrit only
    titles: {
      english: "Translate the following Shlokas/passage in English.",
      sanskrit: "Translate the following Shlokas/passage in English.",
    },
  },
];

/** UI groupings for the AI-paper count inputs. */
export const QUESTION_TYPE_GROUPS = [
  { id: "objective", title: "Objective and quick" },
  { id: "written", title: "Written answers" },
  { id: "context", title: "Context and matching" },
  { id: "language", title: "Language specific" },
];

const BY_KEY = QUESTION_TYPES.reduce((acc, t) => {
  acc[t.key] = t;
  return acc;
}, {});

/** Canonical key for any legacy spelling (truefalse / true&false / true-false / blanks). */
export const normalizeTypeKey = (type) => {
  if (!type) return type;
  const t = String(type).trim();
  if (t === "truefalse" || t === "true&false" || t === "true-false") return "true_false";
  if (t === "blanks") return "blank";
  return t;
};

export const getType = (key) => BY_KEY[normalizeTypeKey(key)] || null;

/** The key the API expects (true_false -> truefalse). */
export const toApiTypeKey = (key) => {
  const t = getType(key);
  return t ? t.apiKey || t.key : normalizeTypeKey(key);
};

export const ALL_TYPE_KEYS = QUESTION_TYPES.map((t) => t.key);

/**
 * Types allowed for a paper language. THIS IS THE LANGUAGE GATE — the 4 language
 * types must never be offered for Maths/English/Science, and `translate` is
 * Sanskrit-only. Used by the paper builder, the AI paper and the admin form.
 */
export const typesForLanguage = (language) =>
  QUESTION_TYPES.filter((t) => !t.languages || t.languages.includes(language));

export const typeKeysForLanguage = (language) =>
  typesForLanguage(language).map((t) => t.key);

/** True when a type may be used with a given paper language. */
export const isTypeAllowedForLanguage = (key, language) => {
  const t = getType(key);
  if (!t) return false;
  return !t.languages || t.languages.includes(language);
};

/** Derived maps, replacing the old hand-maintained copies. */
export const DEFAULT_MARKS_PER_TYPE = QUESTION_TYPES.reduce((acc, t) => {
  acc[t.key] = t.defaultMarks;
  return acc;
}, {});

export const DEFAULT_SECTION_COUNTS = QUESTION_TYPES.reduce((acc, t) => {
  acc[t.key] = t.defaultCount;
  return acc;
}, {});

export const TYPE_CONFIG = QUESTION_TYPES.reduce((acc, t) => {
  acc[t.key] = { label: t.label, color: t.color, badge: t.badge };
  return acc;
}, {});

export const TYPE_SHORT_LABELS = QUESTION_TYPES.reduce((acc, t) => {
  acc[t.key] = t.short;
  return acc;
}, {});

/** Marks helper — marks can be fractional (e.g. 0.5), so trim trailing zeros. */
export const formatMarks = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return String(Math.round(n * 100) / 100);
};

export default QUESTION_TYPES;
