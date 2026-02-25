import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { FileDown } from "lucide-react";
import Button from "../Common/Buttons/Button";
import downloadPDF from "../../utils/downloadPdf";
import { getPaperById } from "../../services/paperService";
import apiClient from "../../services/apiClient";
import HeaderCard from "../Cards/HeaderCard";
import Loader from "../Common/loader/loader";

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

const titles = {
  mcq: "Multiple Choice Questions (MCQs). Tick the correct options.",
  blanks: "Fill in the blanks in each sentence with an appropriate word.",
  true_false: "Write (T) for True and (F) for False.",
  onetwo: "Answer the following questions in one or two sentences.",
  short: "Short Answer Questions.",
  long: "Long Answer Questions.",
  passage: "Read the passage and answer the following questions.",
  match: "Match the following.",
};

const normalizeQuestionType = (type) => {
  if (!type) return type;
  return type === "truefalse" ? "true_false" : type;
};

const getSectionTitle = (type) => {
  const key = type === "blank" ? "blanks" : type;
  return titles[key] || QUESTION_TYPE_CONFIG[type]?.label || type;
};

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

const ViewPaperPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [paper, setPaper] = useState(null);
  const [sections, setSections] = useState([]);
  const [marksPerType, setMarksPerType] = useState({});

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

        const response = await apiClient.get("/question");
        if (cancelled) return;
        const allQuestions = response.data?.questions || response.data || [];
        const list = Array.isArray(allQuestions) ? allQuestions : [];

        const fetched = questionIds
          .map((qid) =>
            list.find(
              (q) =>
                q.question_id === qid ||
                q.id === qid ||
                q.question_id === parseInt(qid, 10) ||
                q.id === parseInt(qid, 10)
            )
          )
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
  let questionCounters = {};

  return (
    <div className="w-full flex flex-col items-center min-h-screen py-10 bg-gradient-to-b from-slate-50 to-gray-100/50">
      <div className="space-y-8 flex flex-col items-center">
        <div
          id="pdf-content-0"
          className="bg-white rounded-2xl shadow-2xl border-4 border-gray-200 overflow-hidden"
          style={{ width: "748px", minHeight: "1000px" }}
        >
          <div className="p-8 flex flex-col min-h-0">
            <div className="mb-6 pb-6 flex-shrink-0">
              <HeaderCard
                header={getHeader()}
                disableHover={true}
                disableStyles
              />
            </div>

            <div className="flex-1 min-h-0 space-y-6">
              {sections.map((section, sectionIndex) => {
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
                  section.selectedQuestions.length * (marksPerType[sectionType] || 0);

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
                            {sectionLetter}) {getSectionTitle(sectionType)}
                          </h3>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: "bold",
                              color: "#374151",
                            }}
                          >
                            {sectionMarks} marks
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {section.selectedQuestions.map((question, qIndex) => {
                        const qNum = questionCounters[sectionType]++;
                        return (
                          <div key={qIndex} className="mb-4">
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
                                {question.question}
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
                                      {typeof option === "object" ? option.text || option.label || JSON.stringify(option) : option}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Passage sub-questions */}
                            {question.type === "passage" && question.options && (() => {
                              try {
                                const pqs = typeof question.options === "string"
                                  ? JSON.parse(question.options)
                                  : question.options;
                                if (Array.isArray(pqs) && pqs.length > 0) {
                                  return (
                                    <div className="ml-6 mt-3 space-y-2" style={{ fontSize: "14px", color: "#374151" }}>
                                      {pqs.map((pq, pqIdx) => (
                                        <p key={pqIdx} className="text-gray-800" style={{ fontSize: "14px", lineHeight: "1.7" }}>
                                          <span style={{ fontWeight: "600" }}>
                                            ({String.fromCharCode(97 + pqIdx)}){" "}
                                          </span>
                                          {typeof pq === "object" && pq !== null && "question" in pq ? pq.question : String(pq)}
                                        </p>
                                      ))}
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
                                                {String.fromCharCode(97 + idx)}. {rightItems[idx] || ""}
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
                            {question.image_url && (
                              <div className="mt-3 ml-6">
                                <img
                                  src={question.image_url}
                                  alt={`Question ${qNum}`}
                                  className="border border-gray-200 max-h-[200px] w-auto"
                                  style={{ height: "200px" }}
                                />
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
      </div>

      <div className="mt-8">
        <Button
          text="Download PDF"
          icon={FileDown}
          onClick={() => {
            const pdfPages = document.querySelectorAll("[id^=pdf-content-]");
            downloadPDF(pdfPages);
          }}
          color="bg-blue-600"
        />
      </div>
    </div>
  );
};

export default ViewPaperPage;
