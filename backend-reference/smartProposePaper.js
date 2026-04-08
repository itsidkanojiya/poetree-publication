/**
 * Reference implementation for POST /api/papers/smart-propose (Node.js).
 * Copy into your API layer; wire to your DB query that loads the question pool.
 *
 * Primary allocation mode: **section_question_counts** (questions per type).
 * Legacy mode: **section_weights** (percent of total marks per type, sum 100).
 *
 * @see docs/PROMPT_BACKEND_SMART_PAPER.md
 */

/** Canonical section keys (counts or weights). */
export const SECTION_WEIGHT_KEYS = [
  "mcq",
  "blank",
  "true_false",
  "onetwo",
  "short",
  "long",
  "passage",
  "match",
];

/** Alias — same keys as `section_question_counts`. */
export const SECTION_QUESTION_COUNT_KEYS = SECTION_WEIGHT_KEYS;

/**
 * Map DB/API type strings to canonical keys (align with frontend normalizeQuestionType).
 */
export function normalizeQuestionType(type) {
  if (!type) return null;
  const t = String(type).toLowerCase();
  if (t === "truefalse") return "true_false";
  return t;
}

/**
 * Validate section_question_counts: all keys present, integers ≥ 0, sum ≥ 1.
 * Unknown extra keys → error.
 */
export function validateSectionQuestionCounts(section_question_counts) {
  const errors = [];
  if (!section_question_counts || typeof section_question_counts !== "object") {
    return { ok: false, errors: ["section_question_counts must be an object"] };
  }
  const extra = Object.keys(section_question_counts).filter((k) => !SECTION_WEIGHT_KEYS.includes(k));
  if (extra.length) {
    errors.push(`Unknown section_question_counts keys: ${extra.join(", ")}`);
  }
  let sum = 0;
  for (const k of SECTION_WEIGHT_KEYS) {
    if (section_question_counts[k] == null) {
      errors.push(`Missing section_question_counts.${k}`);
      continue;
    }
    const v = Number(section_question_counts[k]);
    if (!Number.isInteger(v) || v < 0 || Number.isNaN(v)) {
      errors.push(`section_question_counts.${k} must be a non-negative integer`);
    } else {
      sum += v;
    }
  }
  if (sum < 1) {
    errors.push("section_question_counts must sum to at least 1");
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Validate section_weights: all keys present, sum === 100, non-negative.
 * Unknown extra keys → error (recommended contract).
 */
export function validateSectionWeights(section_weights) {
  const errors = [];
  if (!section_weights || typeof section_weights !== "object") {
    return { ok: false, errors: ["section_weights must be an object"] };
  }
  const extra = Object.keys(section_weights).filter((k) => !SECTION_WEIGHT_KEYS.includes(k));
  if (extra.length) {
    errors.push(`Unknown section_weights keys: ${extra.join(", ")}`);
  }
  let sum = 0;
  for (const k of SECTION_WEIGHT_KEYS) {
    if (section_weights[k] == null) {
      errors.push(`Missing section_weights.${k}`);
      continue;
    }
    const v = Number(section_weights[k]);
    if (Number.isNaN(v) || v < 0) {
      errors.push(`Invalid section_weights.${k}`);
    } else {
      sum += v;
    }
  }
  if (Math.abs(sum - 100) > 0.01) {
    errors.push(`section_weights must sum to 100 (got ${sum})`);
  }
  return { ok: errors.length === 0, errors };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function emptyFailure(message, errors) {
  return {
    success: false,
    questions: [],
    totals: null,
    warnings: errors || [],
    suggestions: [],
    message,
  };
}

/**
 * When `section_question_counts` is present, use it for per-type question budgets.
 * @param {object} params
 * @param {object[]} params.questions
 * @param {number} [params.total_marks] — optional; used to scale chapter target marks
 * @param {{ chapter_id: number, percent: number }[]} params.chapter_weights
 * @param {{ easy: number, medium: number, hard: number }} params.difficulty_weights
 * @param {Record<string, number>} params.section_question_counts
 * @param {number[]} [params.exclude_question_ids]
 */
function proposeSmartPaperByCounts({
  questions,
  total_marks,
  chapter_weights,
  difficulty_weights,
  section_question_counts,
  exclude_question_ids = [],
}) {
  const val = validateSectionQuestionCounts(section_question_counts);
  if (!val.ok) {
    return emptyFailure(val.errors[0], val.errors);
  }

  const exclude = new Set((exclude_question_ids || []).map(Number));
  const pool = (questions || [])
    .map((q) => {
      const id = q.question_id ?? q.id;
      const marks = Number(q.marks) || 1;
      const cid = q.chapter_id ?? q.chapter?.chapter_id ?? null;
      const diff = (q.difficulty || "medium").toLowerCase();
      const nt = normalizeQuestionType(q.type);
      return {
        ...q,
        _id: id,
        _marks: marks,
        _chapter: cid,
        _diff: diff === "easy" || diff === "hard" ? diff : "medium",
        _type: nt,
      };
    })
    .filter((q) => q._id != null && q._type && !exclude.has(Number(q._id)));

  const allocTotal =
    total_marks != null && !Number.isNaN(Number(total_marks)) && Number(total_marks) > 0
      ? Number(total_marks)
      : 80;

  const chapterTargetMarks = {};
  const cwSum = (chapter_weights || []).reduce((s, c) => s + (Number(c.percent) || 0), 0);
  for (const c of chapter_weights || []) {
    const cid = Number(c.chapter_id);
    const pct = (Number(c.percent) || 0) / (cwSum || 1);
    chapterTargetMarks[cid] = allocTotal * pct;
  }

  const warnings = [];
  const suggestions = [];
  const used = new Set();
  const selected = [];
  let order = 1;
  /** @type {Record<number, number>} */
  const chapterActualMarks = {};

  const chapterGap = (q) => {
    const cid = q._chapter != null ? Number(q._chapter) : NaN;
    const target = !Number.isNaN(cid) ? chapterTargetMarks[cid] ?? 0 : 0;
    const actual = !Number.isNaN(cid) ? chapterActualMarks[cid] ?? 0 : 0;
    return target - actual;
  };

  for (const type of SECTION_WEIGHT_KEYS) {
    const requested = Math.floor(Number(section_question_counts[type]) || 0);
    if (requested <= 0) continue;

    let candidates = pool.filter((q) => q._type === type && !used.has(q._id));
    if (candidates.length === 0) {
      warnings.push(`No questions in pool for type "${type}" (requested ${requested}).`);
      suggestions.push(`Add ${type} questions to the bank or lower the count for this type.`);
      continue;
    }

    const shuffled = shuffle(candidates);
    shuffled.sort((a, b) => chapterGap(b) - chapterGap(a));

    const take = Math.min(requested, shuffled.length);
    if (take < requested) {
      warnings.push(
        `Pool short for "${type}": requested ${requested}, only ${shuffled.length} available (taking ${take}).`
      );
    }

    for (let i = 0; i < take; i++) {
      const q = shuffled[i];
      const m = q._marks;
      const cid = q._chapter != null ? Number(q._chapter) : null;
      selected.push({
        question_id: q._id,
        type: q.type,
        marks: m,
        chapter_id: q._chapter,
        difficulty: q._diff,
        order: order++,
      });
      used.add(q._id);
      if (cid != null && !Number.isNaN(cid)) {
        chapterActualMarks[cid] = (chapterActualMarks[cid] || 0) + m;
      }
    }
  }

  const actualTotal = selected.reduce((s, r) => s + (Number(r.marks) || 0), 0);

  const by_section = {};
  for (const k of SECTION_WEIGHT_KEYS) {
    const requested = Math.floor(Number(section_question_counts[k]) || 0);
    const rows = selected.filter((r) => normalizeQuestionType(r.type) === k);
    const am = rows.reduce((s, r) => s + (Number(r.marks) || 0), 0);
    by_section[k] = {
      target_count: requested,
      actual_count: rows.length,
      actual_marks: am,
      actual_percent: actualTotal > 0 ? (am / actualTotal) * 100 : 0,
    };
  }

  const by_chapter = [];
  for (const c of chapter_weights || []) {
    const cid = Number(c.chapter_id);
    const tp = Number(c.percent) || 0;
    const actual_marks = selected
      .filter((r) => Number(r.chapter_id) === cid)
      .reduce((s, r) => s + (Number(r.marks) || 0), 0);
    by_chapter.push({
      chapter_id: cid,
      target_percent: tp,
      actual_marks,
      actual_percent: actualTotal > 0 ? (actual_marks / actualTotal) * 100 : 0,
    });
  }

  const totals = {
    total_marks: actualTotal,
    by_section,
    by_chapter,
    by_difficulty: {
      easy: { target_percent: difficulty_weights?.easy ?? 0, actual_percent: 0 },
      medium: { target_percent: difficulty_weights?.medium ?? 0, actual_percent: 0 },
      hard: { target_percent: difficulty_weights?.hard ?? 0, actual_percent: 0 },
    },
  };

  let dEasy = 0;
  let dMed = 0;
  let dHard = 0;
  for (const r of selected) {
    const d = (r.difficulty || "medium").toLowerCase();
    if (d === "easy") dEasy += r.marks;
    else if (d === "hard") dHard += r.marks;
    else dMed += r.marks;
  }
  const dm = dEasy + dMed + dHard;
  if (dm > 0) {
    totals.by_difficulty.easy.actual_percent = (dEasy / dm) * 100;
    totals.by_difficulty.medium.actual_percent = (dMed / dm) * 100;
    totals.by_difficulty.hard.actual_percent = (dHard / dm) * 100;
  }

  return {
    success: selected.length > 0,
    questions: selected,
    totals,
    warnings,
    suggestions,
  };
}

/**
 * Legacy: mark budgets from section_weights × total_marks / 100.
 */
function proposeSmartPaperByWeights({
  questions,
  total_marks,
  chapter_weights,
  difficulty_weights,
  section_weights,
  exclude_question_ids = [],
}) {
  const val = validateSectionWeights(section_weights);
  if (!val.ok) {
    return emptyFailure(val.errors[0], val.errors);
  }

  const exclude = new Set((exclude_question_ids || []).map(Number));
  const pool = (questions || [])
    .map((q) => {
      const id = q.question_id ?? q.id;
      const marks = Number(q.marks) || 1;
      const cid = q.chapter_id ?? q.chapter?.chapter_id ?? null;
      const diff = (q.difficulty || "medium").toLowerCase();
      const nt = normalizeQuestionType(q.type);
      return { ...q, _id: id, _marks: marks, _chapter: cid, _diff: diff === "easy" || diff === "hard" ? diff : "medium", _type: nt };
    })
    .filter((q) => q._id != null && q._type && !exclude.has(Number(q._id)));

  const tm = Number(total_marks) || 0;
  const targetMarksByType = {};
  for (const k of SECTION_WEIGHT_KEYS) {
    targetMarksByType[k] = (tm * (Number(section_weights[k]) || 0)) / 100;
  }

  const chapterTargetMarks = {};
  const cwSum = (chapter_weights || []).reduce((s, c) => s + (Number(c.percent) || 0), 0);
  for (const c of chapter_weights || []) {
    const cid = Number(c.chapter_id);
    const pct = (Number(c.percent) || 0) / (cwSum || 1);
    chapterTargetMarks[cid] = tm * pct;
  }

  const warnings = [];
  const suggestions = [];
  const used = new Set();
  const selected = [];
  let order = 1;

  for (const type of SECTION_WEIGHT_KEYS) {
    const budget = targetMarksByType[type];
    if (budget <= 0) continue;

    let candidates = pool.filter((q) => q._type === type && !used.has(q._id));
    if (candidates.length === 0) {
      if ((section_weights[type] || 0) > 0) {
        warnings.push(`No questions in pool for type "${type}" but section weight is ${section_weights[type]}%.`);
      }
      continue;
    }

    candidates = shuffle(candidates);

    let spent = 0;
    const softCap = budget * 1.15;

    for (const q of candidates) {
      if (spent >= budget * 0.85 && spent >= budget - 0.01) break;
      const m = q._marks;
      if (spent + m > softCap) continue;
      selected.push({
        question_id: q._id,
        type: q.type,
        marks: m,
        chapter_id: q._chapter,
        difficulty: q._diff,
        order: order++,
      });
      used.add(q._id);
      spent += m;
    }

    if (spent < budget * 0.5) {
      warnings.push(
        `Could not reach target marks for "${type}" (got ~${Math.round(spent)} vs target ~${Math.round(budget)}).`
      );
      suggestions.push(`Add more ${type} questions or lower the section percentage.`);
    }
  }

  const actualTotal = selected.reduce((s, r) => s + (Number(r.marks) || 0), 0);
  const by_section = {};
  for (const k of SECTION_WEIGHT_KEYS) {
    const rows = selected.filter((r) => normalizeQuestionType(r.type) === k);
    const am = rows.reduce((s, r) => s + (Number(r.marks) || 0), 0);
    const tp = Number(section_weights[k]) || 0;
    by_section[k] = {
      target_percent: tp,
      actual_marks: am,
      actual_percent: actualTotal > 0 ? (am / actualTotal) * 100 : 0,
    };
  }

  const by_chapter = [];
  for (const c of chapter_weights || []) {
    const cid = Number(c.chapter_id);
    const tp = Number(c.percent) || 0;
    const actual_marks = selected
      .filter((r) => Number(r.chapter_id) === cid)
      .reduce((s, r) => s + (Number(r.marks) || 0), 0);
    by_chapter.push({
      chapter_id: cid,
      target_percent: tp,
      actual_marks,
      actual_percent: actualTotal > 0 ? (actual_marks / actualTotal) * 100 : 0,
    });
  }

  const totals = {
    total_marks: actualTotal,
    by_section,
    by_chapter,
    by_difficulty: {
      easy: { target_percent: difficulty_weights?.easy ?? 0, actual_percent: 0 },
      medium: { target_percent: difficulty_weights?.medium ?? 0, actual_percent: 0 },
      hard: { target_percent: difficulty_weights?.hard ?? 0, actual_percent: 0 },
    },
  };

  let dEasy = 0;
  let dMed = 0;
  let dHard = 0;
  for (const r of selected) {
    const d = (r.difficulty || "medium").toLowerCase();
    if (d === "easy") dEasy += r.marks;
    else if (d === "hard") dHard += r.marks;
    else dMed += r.marks;
  }
  const dm = dEasy + dMed + dHard;
  if (dm > 0) {
    totals.by_difficulty.easy.actual_percent = (dEasy / dm) * 100;
    totals.by_difficulty.medium.actual_percent = (dMed / dm) * 100;
    totals.by_difficulty.hard.actual_percent = (dHard / dm) * 100;
  }

  return {
    success: selected.length > 0,
    questions: selected,
    totals,
    warnings,
    suggestions,
  };
}

/**
 * Smart paper proposal. Prefer **`section_question_counts`** when provided (validated).
 * Otherwise uses legacy **`section_weights`** (must sum to 100).
 *
 * @param {object} params
 * @param {object[]} params.questions — full pool (already filtered by subject_title_id, board_id, standard)
 * @param {number} [params.total_marks] — optional when using counts; required for meaningful legacy weights
 * @param {{ chapter_id: number, percent: number }[]} params.chapter_weights — sum 100
 * @param {{ easy: number, medium: number, hard: number }} params.difficulty_weights — sum 100
 * @param {Record<string, number>} [params.section_weights] — legacy; sum 100
 * @param {Record<string, number>} [params.section_question_counts] — preferred; integers ≥ 0, sum ≥ 1
 * @param {number[]} [params.exclude_question_ids]
 */
export function proposeSmartPaper({
  questions,
  total_marks,
  chapter_weights,
  difficulty_weights,
  section_weights,
  section_question_counts,
  exclude_question_ids = [],
}) {
  const hasCounts =
    section_question_counts != null &&
    typeof section_question_counts === "object" &&
    SECTION_WEIGHT_KEYS.every((k) => section_question_counts[k] != null);

  if (hasCounts) {
    return proposeSmartPaperByCounts({
      questions,
      total_marks,
      chapter_weights,
      difficulty_weights,
      section_question_counts,
      exclude_question_ids,
    });
  }

  return proposeSmartPaperByWeights({
    questions,
    total_marks,
    chapter_weights,
    difficulty_weights,
    section_weights,
    exclude_question_ids,
  });
}
