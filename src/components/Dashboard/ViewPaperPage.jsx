import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { FileDown } from "lucide-react";
import Button from "../Common/Buttons/Button";
import downloadPDF from "../../utils/downloadPdf";
import { getPaperById } from "../../services/paperService";
import { getQuestionsByIds } from "../../services/adminService";
import HeaderCard from "../Cards/HeaderCard";
import Loader from "../Common/loader/loader";
import MathText from "../Common/MathText";
import { QuestionText, QuestionImageBlock } from "../Common/QuestionImageBlock";
import { QuestionBody, OptionBody, renderRichHtml } from "../Common/QuestionBody";
import { seededMatchOrder } from "../../utils/matchShuffle";
import { getSectionTitle as resolveSectionTitle } from "../../utils/sectionTitles";
import { getType, getWordList, getWordAnswers, formatMarksLabel } from "../../utils/questionTypes";
import { estimateImageBlockHeight } from "../../utils/questionImage";

const QUESTION_TYPE_CONFIG = {
  mcq: { label: "Multiple Choice Questions" },
  short: { label: "Short Answer Questions" },
  long: { label: "Long Answer Questions" },
  blank: { label: "Fill in the Blanks" },
  onetwo: { label: "One or Two Sentence Questions" },
  true_false: { label: "True or False" },
  passage: { label: "Passage" },
  match: { label: "Match the Following" },
};

const normalizeQuestionType = (type) => {
  if (!type) return type;
  return type === "truefalse" ? "true_false" : type;
};

// Section title in the paper's language (resolved from the subject name).
// Previously this was English-only, so a Hindi/Gujarati paper printed English headings.
const getSectionTitle = (type, subjectName) =>
  resolveSectionTitle(type, subjectName) || QUESTION_TYPE_CONFIG[type]?.label || type;

// Fixed page size for PDF (no header cut, multi-page).
// These constants + the per-question pagination below are kept in sync with
// CustomPaper.jsx so the View and the downloaded PDF lay out identically.
const PAGE_HEIGHT = 1123;
const PAGE_WIDTH = 748;
const HEADER_HEIGHT = 230;
const CONTENT_PADDING = 64; // p-8 on the page container = 32px top + 32px bottom
const MARGIN = 24;
const SAFETY_BUFFER = 24;

// Tuned to the ACTUAL rendered heights so pages fill properly instead of
// breaking early. Kept in sync with CustomPaper.jsx.
const COMPONENT_HEIGHTS = {
  QUESTION: 24,
  OPTION: 26,
  IMAGE: 220,
  SECTION: 36,
  SPACING: 14,
  PASSAGE_LINE: 24,
  PASSAGE_SUB_Q: 30,
  MATCH_ROW: 40,
};

const toOptionsArray = (options) => {
  if (Array.isArray(options)) return options;
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// Options always render in a 2-column grid, so rows = ceil(count / 2).
const getMcqOptionsHeight = (options) => {
  const opts = toOptionsArray(options);
  if (opts.length === 0) return 0;
  const rows = Math.ceil(opts.length / 2);
  let height = rows * COMPONENT_HEIGHTS.OPTION;
  const maxLen = opts.reduce(
    (m, o) => Math.max(m, typeof o === "string" ? o.length : 0),
    0
  );
  if (maxLen > 40) height += rows * COMPONENT_HEIGHTS.OPTION; // wrapped long options
  return height;
};

const getPassageQuestionHeight = (question) => {
  let h = COMPONENT_HEIGHTS.QUESTION;
  const passageText = question.question || "";
  h += Math.max(1, Math.ceil(passageText.length / 55)) * COMPONENT_HEIGHTS.PASSAGE_LINE;
  const arr = toOptionsArray(question.options);
  arr.forEach((pq) => {
    h += COMPONENT_HEIGHTS.PASSAGE_SUB_Q;
    if (pq && pq.type === "mcq" && Array.isArray(pq.options)) {
      const opts = pq.options.filter((o) => o != null && String(o).trim() !== "");
      h += opts.length * COMPONENT_HEIGHTS.OPTION;
    }
  });
  return h;
};

const getMatchQuestionHeight = (question) => {
  let h = COMPONENT_HEIGHTS.QUESTION;
  if (question.options) {
    try {
      const data =
        typeof question.options === "string" ? JSON.parse(question.options) : question.options;
      const rows = Math.max((data?.left || []).length, (data?.right || []).length, 1);
      h += 40 + rows * COMPONENT_HEIGHTS.MATCH_ROW;
    } catch {}
  }
  return h;
};

// ---- Answer / solution rendering (used by the "Answer Key" + "Answer + Solution"
// export modes). The paper renders identically to the plain paper; these blocks are
// appended under each question and their height is reserved by the paginator. ----

const parseAnswerObject = (answer) => {
  if (answer && typeof answer === "object") return answer;
  if (typeof answer === "string" && answer.trim().startsWith("{")) {
    try { return JSON.parse(answer); } catch { return null; }
  }
  return null;
};

/** JSX for a question's correct answer, per type. Returns null when unavailable. */
const renderAnswerContent = (question) => {
  const type = normalizeQuestionType(question.type);
  const opts = toOptionsArray(question.options);

  if (type === "mcq") {
    const idx = parseInt(question.answer, 10);
    const valid = Number.isFinite(idx) && idx >= 1;
    const text = valid ? opts[idx - 1] : null;
    return (
      <span>
        <strong>Answer: </strong>
        {valid ? `(${String.fromCharCode(96 + idx)}) ` : ""}
        <MathText text={typeof text === "string" ? text : String(question.answer ?? "")} />
      </span>
    );
  }
  if (type === "truefalse" || type === "true_false") {
    const a = String(question.answer);
    return <span><strong>Answer: </strong>{a === "true" ? "True" : a === "false" ? "False" : String(question.answer ?? "")}</span>;
  }
  if (type === "passage") {
    const ansObj = parseAnswerObject(question.answer) || {};
    return (
      <div>
        <strong>Answers:</strong>
        {opts.map((sub, i) => {
          let val = ansObj[`q${i + 1}`];
          if (sub && sub.type === "mcq" && Array.isArray(sub.options)) {
            const si = parseInt(val, 10);
            if (Number.isFinite(si) && si >= 1) val = `(${String.fromCharCode(96 + si)}) ${sub.options[si - 1] ?? ""}`;
          } else if (sub && sub.type === "truefalse") {
            val = val === "true" ? "True" : val === "false" ? "False" : val;
          }
          return (
            <div key={i}>
              <span style={{ fontWeight: 600 }}>({String.fromCharCode(97 + i)}) </span>
              <MathText text={String(val ?? "")} />
            </div>
          );
        })}
      </div>
    );
  }
  if (type === "match") {
    let data = question.options;
    if (typeof data === "string") { try { data = JSON.parse(data); } catch { data = null; } }
    const left = (data && data.left) || [];
    const right = (data && data.right) || [];
    const order = seededMatchOrder(right.length, question.question_id ?? right.join("|"));
    // left row i (correct right = index i by construction) sits at display position order.indexOf(i)
    const pairs = left.map((_, i) => {
      const pos = order.indexOf(i);
      return `${i + 1} → ${pos >= 0 ? String.fromCharCode(97 + pos) : "?"}`;
    });
    return <span><strong>Answer: </strong>{pairs.join(",   ")}</span>;
  }
  // short / long / onetwo / blank / default
  return <span><strong>Answer: </strong><MathText text={String(question.answer ?? "")} /></span>;
};

/** JSX for a question's solution/explanation, or null when empty. */
const renderSolutionContent = (question) => {
  const sol = question.solution;
  if (!sol || !String(sol).trim()) return null;
  return <span><strong>Solution: </strong><MathText text={String(sol)} /></span>;
};

/** Reserved height (px) for the appended answer/solution block, by export mode.
 * Content-aware: long answers wrap to multiple lines, so height is estimated from
 * the answer/solution text length (else a long answer overflows and gets clipped
 * at the fixed page height). CHARS_PER_LINE is conservative (wide scripts like
 * Devanagari fit fewer chars), so we over- rather than under-reserve. */
function estimateAnswerBlockHeight(question, mode) {
  if (mode !== "answers" && mode !== "solutions") return 0;
  const CHARS_PER_LINE = 70;
  const LINE = 22;
  const linesFor = (s) => Math.max(1, Math.ceil((String(s ?? "").length + 8) / CHARS_PER_LINE));
  const type = normalizeQuestionType(question.type);
  let h = 16; // block padding + label baseline

  if (type === "passage") {
    const ansObj = parseAnswerObject(question.answer) || {};
    const subs = toOptionsArray(question.options);
    h += LINE; // "Answers:" label
    subs.forEach((_, i) => { h += linesFor(ansObj[`q${i + 1}`]) * LINE; });
  } else if (type === "match") {
    let data = question.options;
    if (typeof data === "string") { try { data = JSON.parse(data); } catch { data = null; } }
    const left = (data && data.left) || [];
    h += linesFor(left.map((_, i) => `${i + 1} -> x`).join(",   ")) * LINE;
  } else if (type === "mcq") {
    const opts = toOptionsArray(question.options);
    const idx = parseInt(question.answer, 10);
    const text = Number.isFinite(idx) && idx >= 1 ? opts[idx - 1] : question.answer;
    h += linesFor(text) * LINE;
  } else {
    h += linesFor(question.answer) * LINE;
  }

  if (mode === "solutions") {
    const sol = String(question.solution || "");
    if (sol.trim()) h += 26 + linesFor(`Solution: ${sol}`) * LINE;
  }
  return h + 10;
}

const estimateQuestionHeight = (
  question,
  { isFirstOfType, hasQuestionsOnPage, exportMode = "paper", measuredHeights }
) => {
  // Prefer the REAL measured height (see the measurement layer in the component);
  // the constant-based estimate is only a first-paint fallback before measurement
  // lands. Measured height already includes options, images and the answer block.
  const measured = measuredHeights && question.question_id != null
    ? measuredHeights[question.question_id]
    : undefined;

  let h;
  if (measured != null) {
    h = measured;
  } else {
    const type = normalizeQuestionType(question.type);
    if (type === "passage") h = getPassageQuestionHeight(question);
    else if (type === "match") h = getMatchQuestionHeight(question);
    else {
      h = COMPONENT_HEIGHTS.QUESTION;
      if (type === "mcq") h += getMcqOptionsHeight(question.options);
    }
    h += estimateImageBlockHeight(question);
    h += estimateAnswerBlockHeight(question, exportMode);
  }

  if (isFirstOfType) h += COMPONENT_HEIGHTS.SECTION;
  if (hasQuestionsOnPage) h += COMPONENT_HEIGHTS.SPACING;
  return h;
};

// Per-question pagination (mirrors CustomPaper.renderPages): a question that
// doesn't fit is pushed to the next page instead of being clipped, and a single
// section can span multiple pages (its title is printed once via printedTypes).
function buildPages(sections, exportMode = "paper", measuredHeights = null) {
  let pages = [];
  let currentHeight = PAGE_HEIGHT - HEADER_HEIGHT - CONTENT_PADDING;
  let currentPage = [];

  sections.forEach((section) => {
    section.selectedQuestions.forEach((question) => {
      const type = normalizeQuestionType(question.type);
      const isFirstOfType = !currentPage.some(
        (s) => normalizeQuestionType(s.type) === type
      );
      const hasQuestionsOnPage = currentPage.some((s) => s.selectedQuestions.length > 0);
      const questionHeight = estimateQuestionHeight(question, {
        isFirstOfType,
        hasQuestionsOnPage,
        exportMode,
        measuredHeights,
      });

      const availableHeight = currentHeight - MARGIN - SAFETY_BUFFER;

      if (questionHeight > availableHeight) {
        if (currentPage.length > 0) pages.push(currentPage);
        currentPage = [];
        // First question of its type on the fresh page, no inter-question spacing
        const newQuestionHeight = estimateQuestionHeight(question, {
          isFirstOfType: true,
          hasQuestionsOnPage: false,
          exportMode,
          measuredHeights,
        });
        currentPage.push({ type: question.type, selectedQuestions: [question] });
        currentHeight = PAGE_HEIGHT - CONTENT_PADDING - newQuestionHeight;
        if (currentHeight < 0) currentHeight = 0;
      } else {
        const existing = currentPage.find(
          (s) => normalizeQuestionType(s.type) === type
        );
        if (!existing) currentPage.push({ type: question.type, selectedQuestions: [question] });
        else existing.selectedQuestions.push(question);
        currentHeight -= questionHeight;
      }
    });
  });

  if (currentPage.length > 0) pages.push(currentPage);
  return pages.length > 0 ? pages : [[]];
}

function parseBodyToQuestionIds(body) {
  if (body == null || body === "") return null;
  const str = typeof body === "string" ? body.trim() : String(body);
  if (!str.startsWith("[")) return null;
  try {
    const arr = JSON.parse(str);
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

const EXPORT_MODE_META = {
  paper: { label: "Question Paper", suffix: "" },
  answers: { label: "Answer Key", suffix: " — Answer Key" },
  solutions: { label: "Answers & Solutions", suffix: " — Answers & Solutions" },
};

const ViewPaperPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [paper, setPaper] = useState(null);
  const [sections, setSections] = useState([]);
  const [marksPerType, setMarksPerType] = useState({});
  // Export mode: "paper" (plain), "answers" (answer key), "solutions" (answers + solutions).
  const exportMode = ["answers", "solutions"].includes(location.state?.exportMode)
    ? location.state.exportMode
    : "paper";
  const autoExport = !!location.state?.autoExport;
  const autoExportedRef = React.useRef(false);
  // Real per-question heights (question_id -> px), measured off the rendered DOM so
  // pagination packs pages tightly without clipping. Estimate is only a fallback.
  const [measuredHeights, setMeasuredHeights] = useState({});
  const [measurePassDone, setMeasurePassDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        let paperData = location.state?.paperData || null;

        if (id) {
          const fetched = await getPaperById(id);
          if (cancelled) return;
          paperData = fetched;
        }
        if (!paperData) {
          setLoading(false);
          return;
        }
        setPaper(paperData);

        const body = paperData.body ?? paperData.paper_body ?? "";
        const questionIds = parseBodyToQuestionIds(body);
        if (!questionIds || questionIds.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch ONLY this paper's questions instead of the whole bank.
        const list = await getQuestionsByIds(questionIds);
        if (cancelled) return;
        const byId = new Map(
          (Array.isArray(list) ? list : []).map((q) => [
            Number(q.question_id ?? q.id),
            q,
          ])
        );

        // Preserve the paper's stored order.
        const fetched = questionIds
          .map((qid) => byId.get(Number(qid)))
          .filter(Boolean);

        const grouped = {};
        const typeOrder = [];
        fetched.forEach((q) => {
          const t = normalizeQuestionType(q.type);
          if (!grouped[t]) {
            grouped[t] = [];
            typeOrder.push(t);
          }
          grouped[t].push(q);
        });

        const builtSections = typeOrder.map((t) => ({
          type: t,
          selectedQuestions: grouped[t],
        }));
        setSections(builtSections);

        const marks = {};
        const mData = {
          mcq: paperData.marks_mcq || 0,
          short: paperData.marks_short || 0,
          long: paperData.marks_long || 0,
          blank: paperData.marks_blank || 0,
          onetwo: paperData.marks_onetwo || 0,
          true_false: paperData.marks_truefalse || 0,
          passage: paperData.marks_passage || 0,
          match: paperData.marks_match || 0,
        };
        Object.keys(grouped).forEach((type) => {
          const count = grouped[type].length;
          if (count > 0 && mData[type]) {
            marks[type] = mData[type] / count;
          } else {
            marks[type] = 0;
          }
        });
        setMarksPerType(marks);
      } catch (err) {
        console.error("Error loading paper:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id]);

  // Build a mode-suffixed filename for downloads (e.g. "My Paper — Answer Key.pdf").
  const buildFileName = () => {
    const meta = EXPORT_MODE_META[exportMode] || EXPORT_MODE_META.paper;
    const base = String(paper?.paper_title || paper?.title || "paper").replace(/[\\/:*?"<>|]/g, "_");
    return `${base}${meta.suffix}.pdf`;
  };

  const runDownload = async () => {
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch { /* noop */ }
    }
    const pdfPages = document.querySelectorAll("[id^=pdf-content-]");
    if (pdfPages.length) await downloadPDF(pdfPages, buildFileName());
  };

  // Measure every rendered question's REAL height (after fonts + images settle) and
  // feed it back into pagination, so pages pack tightly with no clipping. Runs once
  // per load/mode; the setState guard stops it re-triggering.
  useEffect(() => {
    if (loading || !sections.length) return;
    let cancelled = false;
    const run = async () => {
      try { if (document.fonts?.ready) await document.fonts.ready; } catch { /* noop */ }
      const imgs = Array.from(document.querySelectorAll("[id^=pdf-content-] img"));
      await Promise.all(
        imgs.map((img) =>
          img.complete ? Promise.resolve() : new Promise((res) => { img.onload = res; img.onerror = res; })
        )
      );
      if (cancelled) return;
      const next = {};
      document.querySelectorAll("[data-measure-qid]").forEach((node) => {
        const qid = node.getAttribute("data-measure-qid");
        if (qid == null || qid === "undefined") return;
        next[qid] = Math.ceil(node.getBoundingClientRect().height);
      });
      if (cancelled) return;
      setMeasuredHeights((prev) => {
        const keys = Object.keys(next);
        const same = keys.length === Object.keys(prev).length && keys.every((k) => prev[k] === next[k]);
        return same ? prev : next;
      });
      setMeasurePassDone(true);
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, exportMode, sections]);

  // When opened from a card's Export menu, wait for the measurement pass (so pages are
  // final) then auto-download once.
  useEffect(() => {
    if (!autoExport || loading || !measurePassDone || autoExportedRef.current) return;
    autoExportedRef.current = true;
    const t = setTimeout(() => { runDownload(); }, 300); // let re-paginated pages settle
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoExport, loading, measurePassDone]);

  const getHeader = () => {
    if (!paper) return {};
    return {
      schoolName: paper.school_name || "",
      standard: paper.standard || "",
      timing: paper.timing || "",
      date: paper.date || "",
      division: paper.division || "",
      address: paper.address || "",
      subject: paper.subject || "",
      board: paper.board || "",
      logo: paper.logo || null,
      logoUrl: paper.logo_url || null,
      totalMarks: paper.total_marks || 0,
      marks: paper.total_marks || 0,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!paper || sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-500 text-lg">No content available for this paper.</p>
      </div>
    );
  }

  const printedTypes = new Set();
  const questionCounters = {};
  const pages = buildPages(sections, exportMode, measuredHeights);

  // Total questions per type across the whole paper (a section can span pages,
  // so a page chunk's length is not the section total). Used for section marks.
  const sectionTypeTotals = {};
  (sections || []).forEach((s) => {
    const t = normalizeQuestionType(s.type);
    sectionTypeTotals[t] = (sectionTypeTotals[t] || 0) + (s.selectedQuestions?.length || 0);
  });

  return (
    <div className="w-full flex flex-col items-center min-h-screen py-10 bg-gradient-to-b from-slate-50 to-gray-100/50">
      {exportMode !== "paper" && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-800 font-semibold text-sm shadow-sm">
          {EXPORT_MODE_META[exportMode].label} view{autoExport ? " — downloading…" : ""}
        </div>
      )}
      <div className="space-y-8 flex flex-col items-center">
        {pages.map((pageSections, pageIndex) => (
          <div
            key={pageIndex}
            id={`pdf-content-${pageIndex}`}
            className="bg-white rounded-2xl shadow-2xl border-4 border-gray-200 overflow-hidden"
            style={{ height: `${PAGE_HEIGHT}px`, width: `${PAGE_WIDTH}px` }}
          >
            <div className="p-8 h-full flex flex-col min-h-0">
              {pageIndex === 0 && (
                <div className="mb-6 pb-6 flex-shrink-0">
                  <HeaderCard
                    header={getHeader()}
                    disableHover={true}
                    disableStyles
                  />
                </div>
              )}
              <div className="flex-1 min-h-0 space-y-6">
                {pageSections.map((section, sectionIndex) => {
                const sectionType = normalizeQuestionType(section.type);
                const shouldPrintTitle = !printedTypes.has(sectionType);
                const sectionLetter = shouldPrintTitle
                  ? String.fromCharCode(65 + printedTypes.size)
                  : "";
                if (shouldPrintTitle) {
                  printedTypes.add(sectionType);
                }
                if (!(sectionType in questionCounters)) {
                  questionCounters[sectionType] = 1;
                }

                const sectionMarks =
                  (sectionTypeTotals[sectionType] ?? section.selectedQuestions.length) *
                  (marksPerType[sectionType] || 0);

                return (
                  <div key={sectionIndex}>
                    {shouldPrintTitle && (
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-1">
                          <h3
                            style={{
                              fontSize: "16px",
                              fontWeight: "bold",
                              letterSpacing: "0.5px",
                              color: "#2563eb",
                            }}
                          >
                            {sectionLetter}) {getSectionTitle(sectionType, paper?.subject)}
                          </h3>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: "bold",
                              color: "#374151",
                              // Keep "3 marks" on one line next to a long title, and
                              // aligned with that title's first line.
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                              marginLeft: "12px",
                              lineHeight: "1.5",
                            }}
                          >
                            {formatMarksLabel(sectionMarks)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div
                      className={
                        getType(sectionType)?.layout === "row"
                          ? "flex flex-wrap gap-x-10 gap-y-1"
                          : "space-y-3"
                      }
                    >
                      {/* Synonyms / antonyms: ONE question holds a list of words. Print
                          them numbered side-by-side, numbering continuing across the
                          section's questions. In answer-key mode show word → answer. */}
                      {getType(sectionType)?.layout === "row" &&
                        (() => {
                          let n = 0;
                          return section.selectedQuestions.flatMap((q, qIdx) => {
                            const answers = getWordAnswers(q);
                            return getWordList(q).map((word, wIdx) => {
                              n += 1;
                              return (
                                <div
                                  key={`${qIdx}-${wIdx}`}
                                  data-measure-qid={wIdx === 0 ? q.question_id : undefined}
                                  style={{ fontSize: "14px", lineHeight: "1.9" }}
                                >
                                  <span style={{ fontWeight: "bold" }}>({n}) </span>
                                  <MathText text={word} />
                                  {exportMode !== "paper" && answers[wIdx] && (
                                    <span className="ml-1 text-emerald-800 font-semibold">
                                      — <MathText text={answers[wIdx]} />
                                    </span>
                                  )}
                                </div>
                              );
                            });
                          });
                        })()}

                      {getType(sectionType)?.layout !== "row" &&
                        section.selectedQuestions.map((question, qIndex) => {
                        const qNum = questionCounters[sectionType]++;
                        return (
                          <div key={qIndex} className="mb-4" data-measure-qid={question.question_id}>
                            <QuestionImageBlock question={question} slot="top" />
                            <div
                              className={`flex items-start justify-between gap-4 ${
                                question.type === "mcq" ||
                                question.type === "true_false" ||
                                question.type === "truefalse"
                                  ? "flex-row"
                                  : ""
                              }`}
                              style={{ lineHeight: "1.7" }}
                            >
                              <p
                                className="text-gray-800 flex-1 min-w-0"
                                style={{ fontSize: "14px", fontWeight: "normal" }}
                              >
                                <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                                  ({qNum}){" "}
                                </span>
                                <QuestionBody question={question} inline={question.type === "passage" ? "lead" : "flow"} />
                              </p>
                              {question.type === "mcq" && (
                                <div
                                  className="flex-shrink-0 rounded border-2 border-gray-500 bg-white"
                                  style={{ width: "28px", height: "22px", minWidth: "28px", minHeight: "22px" }}
                                />
                              )}
                              {(question.type === "true_false" || question.type === "truefalse") && (
                                <div
                                  className="flex-shrink-0 rounded border-2 border-gray-500 bg-white"
                                  style={{ width: "52px", height: "24px", minWidth: "52px", minHeight: "24px" }}
                                />
                              )}
                            </div>

                            {/* MCQ options */}
                            {question.type === "mcq" && question.options && (
                              <div
                                className="ml-6 mt-2 grid grid-cols-2 gap-x-6 gap-y-2"
                                style={{ gridAutoRows: "minmax(1.2em, auto)" }}
                              >
                                {(Array.isArray(question.options)
                                  ? question.options
                                  : (() => { try { return JSON.parse(question.options); } catch { return []; } })()
                                ).map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className="flex gap-1.5 min-w-0 break-words"
                                    style={{ fontSize: "13px", fontWeight: "normal", color: "#374151" }}
                                  >
                                    <span className="flex-shrink-0" style={{ fontSize: "13px", fontWeight: "500" }}>
                                      ({String.fromCharCode(97 + optIndex)}){" "}
                                    </span>
                                    <span className="min-w-0 break-words" style={{ fontSize: "13px" }}>
                                      <OptionBody
                                        question={question}
                                        index={optIndex}
                                        option={typeof option === "object" ? option.text || option.label || JSON.stringify(option) : option}
                                      />
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Passage sub-questions (short answer or MCQ) */}
                            {question.type === "passage" && question.options && (() => {
                              try {
                                const pqs = typeof question.options === "string"
                                  ? JSON.parse(question.options)
                                  : question.options;
                                if (Array.isArray(pqs) && pqs.length > 0) {
                                  return (
                                    <div className="ml-6 mt-3 space-y-3" style={{ fontSize: "14px", color: "#374151" }}>
                                      {pqs.map((pq, pqIdx) => {
                                        const isMcq = pq && pq.type === "mcq";
                                        const isBlank = pq && pq.type === "blank";
                                        const isTf = pq && (pq.type === "truefalse" || pq.type === "true&false");
                                        const questionText = typeof pq === "object" && pq !== null && "question" in pq ? pq.question : String(pq);
                                        const options = isMcq && Array.isArray(pq.options) ? pq.options.filter((o) => o != null && String(o).trim() !== "") : [];
                                        return (
                                          <div key={pqIdx}>
                                            {pq && pq.question_html ? (
                                              <div className="text-gray-800" style={{ display: "flex", gap: "4px", fontSize: "14px", lineHeight: "1.7" }}>
                                                <span style={{ fontWeight: "600" }}>({String.fromCharCode(97 + pqIdx)})</span>
                                                <div className="rich-body" style={{ flex: 1 }}>
                                                  {renderRichHtml(pq.question_html)}
                                                </div>
                                              </div>
                                            ) : (
                                            <p className="text-gray-800" style={{ fontSize: "14px", lineHeight: "1.7" }}>
                                              <span style={{ fontWeight: "600" }}>
                                                ({String.fromCharCode(97 + pqIdx)}){" "}
                                              </span>
                                              <MathText text={questionText} />
                                            </p>
                                            )}
                                            {isMcq && options.length > 0 && (
                                              <div className="ml-4 mt-1 space-y-1" style={{ fontSize: "13px" }}>
                                                {options.map((opt, optIdx) => (
                                                  <div key={optIdx} className="flex gap-2">
                                                    <span style={{ fontWeight: "500" }}>({String.fromCharCode(65 + optIdx)})</span>
                                                    <span><MathText text={typeof opt === "object" ? (opt.text || opt.label || JSON.stringify(opt)) : opt} /></span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                            {isTf && (
                                              <div className="ml-4 mt-1 flex gap-4" style={{ fontSize: "13px" }}>
                                                <span>(T)</span>
                                                <span>(F)</span>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                }
                              } catch {}
                              return null;
                            })()}

                            {/* Match the following table */}
                            {question.type === "match" && question.options && (() => {
                              try {
                                const matchData = typeof question.options === "string"
                                  ? JSON.parse(question.options)
                                  : question.options;
                                const leftItems = matchData.left || [];
                                const rightItems = matchData.right || [];
                                const maxLength = Math.max(leftItems.length, rightItems.length);
                                const rightOrder = seededMatchOrder(rightItems.length, question.question_id ?? rightItems.join("|"));
                                if (leftItems.length > 0 || rightItems.length > 0) {
                                  return (
                                    <div className="ml-6 mt-3 overflow-x-auto">
                                      <table className="w-full border-collapse" style={{ fontSize: "14px", border: "1px solid #374151" }}>
                                        <thead>
                                          <tr>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-700" style={{ border: "1px solid #374151", backgroundColor: "#f3f4f6" }}>A</th>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-700" style={{ border: "1px solid #374151", backgroundColor: "#f3f4f6" }}>B</th>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-700" style={{ border: "1px solid #374151", backgroundColor: "#f3f4f6" }}>Answer</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {Array.from({ length: maxLength }).map((_, idx) => (
                                            <tr key={idx}>
                                              <td className="px-3 py-2 text-gray-800" style={{ border: "1px solid #374151" }}>
                                                {idx + 1}. {leftItems[idx] || ""}
                                              </td>
                                              <td className="px-3 py-2 text-gray-800" style={{ border: "1px solid #374151" }}>
                                                {String.fromCharCode(97 + idx)}. {rightItems[rightOrder[idx]] ?? ""}
                                              </td>
                                              <td className="px-3 py-2 text-gray-800 font-mono" style={{ border: "1px solid #374151" }}>
                                                ({idx + 1}) (_____)
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  );
                                }
                              } catch {}
                              return null;
                            })()}

                            {/* Question image */}
                            <QuestionImageBlock question={question} slot="bottom" />

                            {/* Answer / solution block (only in the answer-key / solution export modes) */}
                            {exportMode !== "paper" && (
                              <div
                                className="ml-6 mt-2 pl-3 py-1 border-l-4 border-emerald-400 bg-emerald-50/60 rounded-r text-gray-800"
                                style={{ fontSize: "13px", lineHeight: "1.6" }}
                              >
                                <div className="text-emerald-800">{renderAnswerContent(question)}</div>
                                {exportMode === "solutions" && renderSolutionContent(question) && (
                                  <div className="mt-1 text-gray-600">{renderSolutionContent(question)}</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Button
          text={exportMode === "paper" ? "Download PDF" : `Download ${EXPORT_MODE_META[exportMode].label}`}
          icon={FileDown}
          onClick={runDownload}
          color="bg-blue-600"
        />
      </div>
    </div>
  );
};

export default ViewPaperPage;
