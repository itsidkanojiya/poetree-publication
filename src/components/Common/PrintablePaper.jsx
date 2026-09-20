import HeaderCard from "../Cards/HeaderCard";
import MathText from "./MathText";
import { QuestionText, QuestionImageBlock } from "./QuestionImageBlock";
import { OptionBody, MatchItemBody, renderRichHtml } from "./QuestionBody";
import { seededMatchOrder } from "../../utils/matchShuffle";
import { getType, getWordList, getWordAnswers, formatMarksLabel } from "../../utils/questionTypes";
import { getSectionTitle as resolveSectionTitle } from "../../utils/sectionTitles";

/**
 * Flowing (un-paginated) render of a whole exam paper, printed via the browser's
 * native pagination (window.print → Save as PDF). Every atomic block is marked
 * `break-inside: avoid`, so the BROWSER decides page breaks and content can never
 * be clipped — this replaces the fragile JS height-estimate + fixed-box screenshot
 * pipeline for the download. The on-screen preview (fixed A4 boxes) is unchanged.
 *
 * Props:
 *   header        — object for <HeaderCard>
 *   sections      — [{ type, selectedQuestions: [...] }]
 *   subjectName   — for language-aware section titles
 *   exportMode    — "paper" | "answers" | "solutions"
 *   sectionMarks  — (normalizedType) => number  (marks label per section)
 *   renderAnswer  — (question) => JSX | null    (answer-key block; answers/solutions modes)
 *   renderSolution— (question) => JSX | null    (solution block; solutions mode)
 */

const normalizeType = (t) => (t === "truefalse" ? "true_false" : t);

const TYPE_LABEL = {
  mcq: "Multiple Choice Questions",
  short: "Short Answer Questions",
  long: "Long Answer Questions",
  blank: "Fill in the Blanks",
  onetwo: "One or Two Sentence Questions",
  true_false: "True or False",
  passage: "Passage",
  match: "Match the Following",
};
const sectionTitle = (type, subjectName) =>
  resolveSectionTitle(type, subjectName) || TYPE_LABEL[type] || type;

const toOptionsArray = (options) => {
  if (Array.isArray(options)) return options;
  if (typeof options === "string") {
    try {
      const p = JSON.parse(options);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
};

const parseMatch = (options) => {
  let data = options;
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch { data = null; }
  }
  return data || {};
};

/** One passage sub-question row (kept together across page breaks). */
const PassageSub = ({ pq, letter }) => {
  const isMcq = pq && pq.type === "mcq";
  const isTf = pq && (pq.type === "truefalse" || pq.type === "true&false");
  const questionText =
    typeof pq === "object" && pq !== null && "question" in pq ? pq.question : String(pq);
  const options =
    isMcq && Array.isArray(pq.options)
      ? pq.options.filter((o) => o != null && String(o).trim() !== "")
      : [];
  return (
    <div className="print-avoid" style={{ marginTop: "6px" }}>
      {pq && pq.question_html ? (
        <div style={{ display: "flex", gap: "4px", fontSize: "14px", lineHeight: "1.7" }}>
          <span style={{ fontWeight: 600 }}>({letter})</span>
          <div className="rich-body" style={{ flex: 1 }}>
            {renderRichHtml(pq.question_html)}
          </div>
        </div>
      ) : (
        <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#374151" }}>
          <span style={{ fontWeight: 600 }}>({letter}) </span>
          <MathText text={questionText} />
        </p>
      )}
      {isMcq && options.length > 0 && (
        <div className="ml-4 mt-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px", fontSize: "13px" }}>
          {options.map((opt, oi) => (
            <div key={oi} style={{ display: "flex", gap: "6px" }}>
              <span style={{ fontWeight: 500 }}>({String.fromCharCode(97 + oi)})</span>
              <span><MathText text={typeof opt === "object" ? opt.text || opt.label || "" : opt} /></span>
            </div>
          ))}
        </div>
      )}
      {isTf && (
        <div className="ml-4 mt-1" style={{ display: "flex", gap: "16px", fontSize: "13px" }}>
          <span>(T)</span><span>(F)</span>
        </div>
      )}
    </div>
  );
};

const PrintablePaper = ({
  header,
  sections,
  subjectName,
  exportMode = "paper",
  sectionMarks = () => 0,
  renderAnswer,
  renderSolution,
}) => {
  const printedTypes = new Set();
  const counters = {};

  return (
    <div className="printable-paper">
      <div style={{ marginBottom: "16px" }}>
        <HeaderCard header={header || {}} disableHover disableStyles />
      </div>

      {sections.map((section, sIdx) => {
        const type = normalizeType(section.type);
        const printTitle = !printedTypes.has(type);
        const letter = printTitle ? String.fromCharCode(65 + printedTypes.size) : "";
        if (printTitle) printedTypes.add(type);
        if (!(type in counters)) counters[type] = 1;
        const isRow = getType(type)?.layout === "row";

        return (
          <section key={sIdx} style={{ marginTop: sIdx === 0 ? 0 : "18px" }}>
            {printTitle && (
              <div className="print-avoid" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", letterSpacing: "0.5px", color: "#2563eb" }}>
                  {letter}) {sectionTitle(type, subjectName)}
                </h3>
                <span style={{ fontSize: "13px", fontWeight: "bold", color: "#374151", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {formatMarksLabel(sectionMarks(type))}
                </span>
              </div>
            )}

            {/* Synonyms / antonyms: one question holds a list of words, numbered side by side */}
            {isRow ? (
              <div style={{ display: "flex", flexWrap: "wrap", columnGap: "40px", rowGap: "4px" }}>
                {(() => {
                  let n = 0;
                  return section.selectedQuestions.flatMap((q, qi) => {
                    const answers = getWordAnswers(q);
                    return getWordList(q).map((word, wi) => {
                      n += 1;
                      return (
                        <div key={`${qi}-${wi}`} className="print-avoid" style={{ fontSize: "14px", lineHeight: "1.9" }}>
                          <span style={{ fontWeight: "bold" }}>({n}) </span>
                          <MathText text={word} />
                          {exportMode !== "paper" && answers[wi] && (
                            <span style={{ marginLeft: "4px", color: "#065f46", fontWeight: 600 }}>
                              — <MathText text={answers[wi]} />
                            </span>
                          )}
                        </div>
                      );
                    });
                  });
                })()}
              </div>
            ) : (
              section.selectedQuestions.map((question, qi) => {
                const qNum = counters[type]++;
                const answerBlock = exportMode !== "paper" && renderAnswer ? renderAnswer(question) : null;
                const solutionBlock =
                  exportMode === "solutions" && renderSolution ? renderSolution(question) : null;

                // Passage: intro block + each sub-question its own break-avoid block,
                // so the browser breaks BETWEEN them (never clips, never orphans).
                if (type === "passage") {
                  const subs = toOptionsArray(question.options);
                  return (
                    <div key={qi} style={{ marginBottom: "12px" }}>
                      <div className="print-avoid">
                        <QuestionImageBlock question={question} slot="top" />
                        <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#374151" }}>
                          <span style={{ fontWeight: "bold" }}>({qNum}) </span>
                          <QuestionText question={question} />
                        </p>
                        <QuestionImageBlock question={question} slot="bottom" />
                      </div>
                      <div className="ml-6" style={{ marginTop: "6px" }}>
                        {subs.map((pq, i) => (
                          <PassageSub key={i} pq={pq} letter={String.fromCharCode(97 + i)} />
                        ))}
                      </div>
                      {answerBlock && <div className="print-avoid" style={answerStyle}>{answerBlock}</div>}
                      {solutionBlock && <div className="print-avoid" style={solStyle}>{solutionBlock}</div>}
                    </div>
                  );
                }

                // Match: a table; each row kept together across breaks.
                if (type === "match") {
                  const data = parseMatch(question.options);
                  const left = data.left || [];
                  const right = data.right || [];
                  const maxLen = Math.max(left.length, right.length);
                  const order = seededMatchOrder(right.length, question.question_id ?? right.join("|"));
                  return (
                    <div key={qi} style={{ marginBottom: "14px" }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>({qNum})</p>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", border: "1px solid #374151", lineHeight: "2.4" }}>
                        <thead>
                          <tr className="print-avoid">
                            {["A", "B", "Answer"].map((h) => (
                              <th key={h} style={{ border: "1px solid #374151", background: "#f3f4f6", textAlign: "left", padding: "4px 12px", fontWeight: 600, color: "#374151" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: maxLen }).map((_, i) => (
                            <tr key={i} className="print-avoid">
                              <td style={{ border: "1px solid #374151", padding: "4px 12px", verticalAlign: "middle" }}>
                                {i + 1}. <MatchItemBody question={question} side="left" index={i} value={left[i] || ""} />
                              </td>
                              <td style={{ border: "1px solid #374151", padding: "4px 12px", verticalAlign: "middle" }}>
                                {String.fromCharCode(97 + i)}. <MatchItemBody question={question} side="right" index={order[i]} value={right[order[i]] ?? ""} />
                              </td>
                              <td style={{ border: "1px solid #374151", padding: "4px 12px", fontFamily: "monospace" }}>
                                ({i + 1}) (_____)
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {answerBlock && <div className="print-avoid" style={answerStyle}>{answerBlock}</div>}
                    </div>
                  );
                }

                // MCQ / short / long / blank / onetwo / true_false
                const isMcq = type === "mcq";
                const isTf = type === "true_false";
                const mcqOptions = isMcq ? toOptionsArray(question.options) : [];
                return (
                  <div key={qi} className="print-avoid" style={{ marginBottom: "10px" }}>
                    <QuestionImageBlock question={question} slot="top" />
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", lineHeight: "1.7" }}>
                      <p style={{ flex: 1, minWidth: 0, fontSize: "14px", color: "#374151" }}>
                        <span style={{ fontSize: "14px", fontWeight: "bold" }}>({qNum}) </span>
                        <QuestionText question={question} />
                      </p>
                      {isMcq && <span style={boxStyle(28, 22)} />}
                      {isTf && <span style={boxStyle(52, 24)} />}
                    </div>
                    {isMcq && mcqOptions.length > 0 && (
                      <div className="ml-6 mt-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
                        {mcqOptions.map((opt, oi) => (
                          <div key={oi} style={{ display: "flex", gap: "6px", fontSize: "13px", color: "#374151" }}>
                            <span style={{ fontWeight: 500 }}>({String.fromCharCode(97 + oi)}) </span>
                            <span><OptionBody question={question} index={oi} option={typeof opt === "object" ? opt.text || opt.label || "" : opt} /></span>
                          </div>
                        ))}
                      </div>
                    )}
                    <QuestionImageBlock question={question} slot="bottom" />
                    {answerBlock && <div style={answerStyle}>{answerBlock}</div>}
                    {solutionBlock && <div style={solStyle}>{solutionBlock}</div>}
                  </div>
                );
              })
            )}
          </section>
        );
      })}
    </div>
  );
};

const boxStyle = (w, h) => ({
  flexShrink: 0,
  borderRadius: "6px",
  border: "2px solid #6b7280",
  background: "#fff",
  width: `${w}px`,
  height: `${h}px`,
});
const answerStyle = {
  marginLeft: "24px",
  marginTop: "6px",
  paddingLeft: "10px",
  borderLeft: "4px solid #34d399",
  background: "rgba(209,250,229,0.4)",
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#065f46",
};
const solStyle = { ...answerStyle, borderLeftColor: "#93c5fd", color: "#4b5563", background: "rgba(219,234,254,0.4)" };

export default PrintablePaper;
