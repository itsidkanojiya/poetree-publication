import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  FileDown,
  X,
  FileText,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
  Plus,
  ChevronDown,
  Award,
  AlertTriangle,
} from "lucide-react";
import Button from "../Common/Buttons/Button";
import { savePaper } from "../../utils/savePaper";
import { useAuth } from "../../context/AuthContext";
import usePdfContent from "../../hooks/usePdfContent";
import HeaderCard from "../Cards/HeaderCard";
import apiClient from "../../services/apiClient";
import { getPaperById, updatePaper } from "../../services/paperService";
import {
  getChaptersBySubjectTitle,
  smartProposePaper,
  getQuestionsByType,
  getQuestionsByIds,
  getMarksBreakdown,
} from "../../services/adminService";
import Toast from "../Common/Toast";
import MathText from "../Common/MathText";
import { QuestionText, QuestionImageBlock } from "../Common/QuestionImageBlock";
import { QuestionBody, OptionBody, MatchItemBody, renderRichHtml } from "../Common/QuestionBody";
import { seededMatchOrder } from "../../utils/matchShuffle";
import { getSectionTitle, detectPaperLanguage } from "../../utils/sectionTitles";
import QUESTION_TYPES, {
  ALL_TYPE_KEYS,
  QUESTION_TYPE_GROUPS,
  DEFAULT_SECTION_COUNTS,
  DEFAULT_MARKS_PER_TYPE,
  TYPE_CONFIG,
  TYPE_SHORT_LABELS,
  typeKeysForLanguage,
  getType,
  getWordList,
  formatMarksLabel,
  normalizeTypeKey as normalizeTypeKeyLocal,
} from "../../utils/questionTypes";
import { estimateImageBlockHeight } from "../../utils/questionImage";
import Loader from "../Common/loader/loader";
import SmartPaperStepper from "./SmartPaperStepper";
import { useUserTeaching } from "../../context/UserTeachingContext";

// Constants
const PAGE_DIMENSIONS = {
  HEIGHT: 1123,
  WIDTH: 748,
  MARGIN: 24,
  SAFETY_BUFFER: 24, // Small safety margin; real container padding is handled by CONTENT_PADDING
  CONTENT_PADDING: 64, // p-8 on the page container = 32px top + 32px bottom
};

// Tuned to the ACTUAL rendered heights (14px question line, 13px options in a
// 2-col grid) so pages fill properly instead of breaking early.
const COMPONENT_HEIGHTS = {
  HEADER: 230,
  QUESTION: 24,
  OPTION: 26,
  IMAGE: 220,
  SECTION: 36,
  SPACING: 14, // gap between consecutive questions
  PASSAGE_LINE: 24,
  PASSAGE_SUB_Q: 30,
  MATCH_ROW: 40,
};

/* These all derive from the shared registry (src/utils/questionTypes.js) so adding a
   question type is a one-file change instead of editing six parallel lists here. */

const INITIAL_QUESTION_SECTIONS = ALL_TYPE_KEYS.map((type) => ({
  type,
  selectedQuestions: [],
}));

/** Canonical keys for POST /papers/smart-propose `section_question_counts` (non‑negative integers; sum ≥ 1). */
const SMART_SECTION_KEYS = ALL_TYPE_KEYS;

/** Default counts per type. */
const DEFAULT_SMART_SECTION_COUNTS = DEFAULT_SECTION_COUNTS;

const SMART_SECTION_GROUPS = QUESTION_TYPE_GROUPS.map((g) => ({
  ...g,
  keys: QUESTION_TYPES.filter((t) => t.group === g.id).map((t) => t.key),
})).filter((g) => g.keys.length > 0);

/** Collect unique chapter IDs from all selected questions (for chapter_ids when saving paper). */
/** Gap between sections on a page (the content area uses space-y-6 = 24px). */
const SECTION_GAP = 24;

const getChapterIdsFromSections = (sections) => {
  const ids = new Set();
  (sections || []).forEach((section) => {
    (section.selectedQuestions || []).forEach((q) => {
      const cid = q.chapter_id ?? q.chapter?.chapter_id;
      if (cid != null && cid !== "") ids.add(Number(cid));
    });
  });
  return Array.from(ids);
};

// Section letters are assigned SEQUENTIALLY by appearance (A, B, C...) in the paper
// renderer, so there is no fixed type->letter map. Labels/colours and the short labels
// used by humanizeSmartWarning both come from the shared registry.
const QUESTION_TYPE_CONFIG = TYPE_CONFIG;

const SMART_SECTION_SHORT_LABELS = TYPE_SHORT_LABELS;

// Turn machine warning codes from /papers/smart-propose into friendly sentences.
const humanizeSmartWarning = (w) => {
  if (typeof w !== "string") return String(w);
  let m = w.match(/^section:(\w+):insufficient_count:asked_(\d+)_have_(\d+)$/);
  if (m) {
    const label = SMART_SECTION_SHORT_LABELS[m[1]] || m[1];
    return `Only ${m[3]} ${label} question(s) available — you asked for ${m[2]}.`;
  }
  m = w.match(/^section:(\w+):insufficient_pool:need_(\d+)_marks$/);
  if (m) {
    const label = SMART_SECTION_SHORT_LABELS[m[1]] || m[1];
    return `Not enough ${label} questions in the bank for this section.`;
  }
  m = w.match(/^section:(\w+):underfilled:remaining_(\d+)_marks$/);
  if (m) {
    const label = SMART_SECTION_SHORT_LABELS[m[1]] || m[1];
    return `${label} section couldn't be fully filled from the question bank.`;
  }
  m = w.match(/^total_marks:(?:underfilled|overshoot):got_(\d+)_target_(\d+)$/);
  if (m) {
    return `Paper total came to ${m[1]} marks (target was ${m[2]}).`;
  }
  return w;
};

// Section titles + language detection are shared across every paper renderer:
// see src/utils/sectionTitles.js (imported as getSectionTitle above).

// Shuffle array (mixed order) for "all questions" view
const shuffleArray = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Function to determine MCQ option layout based on option lengths
const getMcqLayout = (options) => {
  if (!options || options.length === 0) return "grid-cols-4";

  // Calculate average option length
  const avgLength =
    options.reduce((sum, opt) => sum + (opt?.length || 0), 0) / options.length;

  // Determine layout based on average length
  if (avgLength < 20) {
    // Short options: 4 in 1 row
    return "grid-cols-4";
  } else if (avgLength < 50) {
    // Medium options: 2x2 grid
    return "grid-cols-2";
  } else {
    // Long options: 1 by 4 (vertical)
    return "grid-cols-1";
  }
};

// Function to calculate MCQ options height.
// Options are always rendered in a 2-column grid (see grid-cols-2 in the page
// render), so rows = ceil(count / 2). Long options that wrap to a second line
// add an extra line so tall questions aren't under-counted.
const getMcqOptionsHeight = (options) => {
  if (!options || options.length === 0) return 0;

  const rows = Math.ceil(options.length / 2);
  let height = rows * COMPONENT_HEIGHTS.OPTION;

  // Each column is ~half the content width; options longer than ~40 chars wrap
  // to a second line. Add one extra option-line per wrapped row (worst case).
  const maxLen = options.reduce((m, opt) => Math.max(m, opt?.length || 0), 0);
  if (maxLen > 40) {
    height += rows * COMPONENT_HEIGHTS.OPTION;
  }

  return height;
};

// Estimate height for passage question (passage text + sub-questions; MCQ sub-questions add option lines)
const getPassageQuestionHeight = (question) => {
  let h = COMPONENT_HEIGHTS.QUESTION;
  const passageText = question.question || "";
  const passageLines = Math.max(1, Math.ceil(passageText.length / 55));
  h += passageLines * COMPONENT_HEIGHTS.PASSAGE_LINE;
  if (question.options) {
    try {
      const arr = typeof question.options === "string" ? JSON.parse(question.options) : question.options;
      if (Array.isArray(arr) && arr.length > 0) {
        arr.forEach((pq) => {
          h += COMPONENT_HEIGHTS.PASSAGE_SUB_Q;
          if (pq && pq.type === "mcq" && Array.isArray(pq.options)) {
            const opts = pq.options.filter((o) => o != null && String(o).trim() !== "");
            h += Math.max(0, opts.length * COMPONENT_HEIGHTS.OPTION);
          }
        });
      }
    } catch (_) {}
  }
  return h;
};

// Estimate height for match question (table with left/right items)
const getMatchQuestionHeight = (question) => {
  let h = COMPONENT_HEIGHTS.QUESTION;
  if (question.options) {
    try {
      const data = typeof question.options === "string" ? JSON.parse(question.options) : question.options;
      const left = data?.left || [];
      const right = data?.right || [];
      const rows = Math.max(left.length, right.length, 1);
      h += 40 + rows * COMPONENT_HEIGHTS.MATCH_ROW; // header + rows
    } catch (_) {}
  }
  return h;
};

// Normalize question type so API "truefalse" and UI "true_false" both work
const normalizeQuestionType = (type) => {
  if (!type) return type;
  return type === "truefalse" ? "true_false" : type;
};

// Section title for a question type, in the paper's language (shared resolver).
const getQuestionTypeTitle = (questionType, language, subjectName) =>
  getSectionTitle(questionType, subjectName, language) ||
  QUESTION_TYPE_CONFIG[questionType]?.label;

const CustomPaper = () => {
  const { user } = useAuth();
  const { contextSelection } = useUserTeaching();
  const navigate = useNavigate();
  const location = useLocation();
  const { header, paperId, editMode, paperData: initialPaperData } = location.state || {};
  const divContents = usePdfContent();
  const pagesRef = useRef(null);
  const previewPanelRef = useRef(null);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(editMode || false);
  const [paperIdState, setPaperIdState] = useState(paperId || null);
  const [loadingPaper, setLoadingPaper] = useState(isEditMode);
  const [toast, setToast] = useState(null);
  
  // Header state for edit mode
  const [paperHeader, setPaperHeader] = useState(header || null);
  
  // Store paper marks for calculating marks per question
  const [paperMarks, setPaperMarks] = useState(null);
  
  // Prevent duplicate saves
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [questionTypeDropdownOpen, setQuestionTypeDropdownOpen] = useState(false);
  const questionTypeDropdownRef = useRef(null);

  const [paperChapterId, setPaperChapterId] = useState(() => {
    const h = location.state?.header;
    const cid = h?.chapterId ?? h?.chapter_id;
    return (cid != null && cid !== "") ? String(cid) : "";
  });
  const [chapters, setChapters] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(false);

  const [smartWizardActive, setSmartWizardActive] = useState(false);
  /** header → chapters → targets → generating → preview */
  const [smartWizardStep, setSmartWizardStep] = useState("header");
  // total_marks is informational only in count mode; kept for API compatibility.
  const [smartTotalMarks] = useState(80);
  const [smartDifficulty, setSmartDifficulty] = useState({
    easy: 30,
    medium: 40,
    hard: 30,
  });
  const [smartSectionCounts, setSmartSectionCounts] = useState(() => ({
    ...DEFAULT_SMART_SECTION_COUNTS,
  }));
  const [smartChapterPercents, setSmartChapterPercents] = useState([]);
  const [smartMeta, setSmartMeta] = useState(null);
  // Per-type marks info for live estimated total (from GET /papers/marks-breakdown).
  const [smartMarksByType, setSmartMarksByType] = useState(null);
  // Optional exact-marks target the teacher wants to hit (0 = no target).
  const [smartTargetMarks, setSmartTargetMarks] = useState(0);
  const [previewHighlight, setPreviewHighlight] = useState(false);

  const [approvedSubjectIds, setApprovedSubjectIds] = useState([]);
  const [approvedSubjectsMap, setApprovedSubjectsMap] = useState(new Map()); // Store subject_id -> subject_name mapping
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [currentType, setCurrentType] = useState("");
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [isMarksPanelExpanded, setIsMarksPanelExpanded] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionSections, setQuestionSections] = useState(() => {
    const storedData = localStorage.getItem("questionSections");
    let parsed = null;
    try {
      parsed = storedData ? JSON.parse(storedData) : null;
    } catch {
      parsed = null;
    }
    if (!Array.isArray(parsed)) return INITIAL_QUESTION_SECTIONS;
    // MERGE with the registry. The cache was written before newer question types
    // existed, so without this a new type has no bucket and "Select" silently does
    // nothing. Keeps any in-progress selections.
    const byType = new Map(parsed.map((s) => [s.type, s]));
    return ALL_TYPE_KEYS.map(
      (type) => byType.get(type) || { type, selectedQuestions: [] }
    );
  });
  // v3 key: synonyms/antonyms moved from 0.5-per-word to 3 marks for the whole word
  // list, so the v2 cache would keep printing "0.5 marks" for those sections.
  // Also merged with the defaults, so a NEWLY added type gets its proper marks
  // instead of falling through to 0.
  const [marksPerType, setMarksPerType] = useState(() => {
    const storedMarks = localStorage.getItem("marksPerType_v3");
    let parsed = null;
    try {
      parsed = storedMarks ? JSON.parse(storedMarks) : null;
    } catch {
      parsed = null;
    }
    return { ...DEFAULT_MARKS_PER_TYPE, ...(parsed || {}) };
  });

  // Save to localStorage whenever sections change
  useEffect(() => {
    localStorage.setItem("questionSections", JSON.stringify(questionSections));
  }, [questionSections]);

  // Save marks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("marksPerType_v3", JSON.stringify(marksPerType));
  }, [marksPerType]);

  // Load paper data in edit mode
  useEffect(() => {
    const loadPaperData = async () => {
      if (isEditMode && paperIdState) {
        try {
          setLoadingPaper(true);
          const response = await getPaperById(paperIdState);
          const paper = response.data || response;
          
          // Load header data if available
          if (paper) {
            // Set header data from paper
            if (paper.school_name || paper.subject || paper.board) {
              setPaperHeader({
                schoolName: paper.school_name || "",
                standard: paper.standard || "",
                timing: paper.timing || "",
                date: paper.date ? paper.date.split('T')[0] : "", // Format date to YYYY-MM-DD
                division: paper.division || "",
                address: paper.address || "",
                subject: paper.subject || "",
                board: paper.board || "",
                logo: paper.logo || null,
                logoUrl: paper.logo_url || null,
                subjectTitle: paper.subject_title_id || null,
                documentTitle: paper.paper_title || "",
                class: paper.standard ? `Standard ${paper.standard}` : "",
              });
              if (paper.chapter_id != null && paper.chapter_id !== "") {
                setPaperChapterId(String(paper.chapter_id));
              } else if (paper.chapterId != null && paper.chapterId !== "") {
                setPaperChapterId(String(paper.chapterId));
              }
            }
            
            // Load marks from paper response first (needed for calculating marks per question)
            const marksData = {
              mcq: paper.marks_mcq || 0,
              short: paper.marks_short || 0,
              long: paper.marks_long || 0,
              blank: paper.marks_blank || 0,
              onetwo: paper.marks_onetwo || 0,
              true_false: paper.marks_truefalse || 0,
              passage: paper.marks_passage || 0,
              match: paper.marks_match || 0,
            };
            setPaperMarks(marksData);
            
            // Parse body to get question IDs
            if (paper.body) {
              try {
                // Parse body - it should be a JSON string like "[1,2,3,4,5]"
                let questionIds;
                if (typeof paper.body === 'string') {
                  if (paper.body.trim().startsWith("[")) {
                    // It's a JSON array string
                    questionIds = JSON.parse(paper.body);
                  } else {
                    // Try to parse as JSON anyway
                    questionIds = JSON.parse(paper.body);
                  }
                } else if (Array.isArray(paper.body)) {
                  // Already an array
                  questionIds = paper.body;
                } else {
                  console.warn("Unexpected body format:", paper.body);
                  return;
                }
                
                // Load questions by IDs with marks data
                if (Array.isArray(questionIds) && questionIds.length > 0) {
                  await loadQuestionsByIds(questionIds, marksData);
                }
              } catch (e) {
                console.error("Error parsing body:", e);
                setToast({
                  message: "Failed to parse question IDs from paper",
                  type: "error",
                });
              }
            }
          }
        } catch (error) {
          console.error("Error loading paper:", error);
          setToast({
            message: "Failed to load paper data",
            type: "error",
          });
        } finally {
          setLoadingPaper(false);
        }
      }
    };
    
    loadPaperData();
  }, [isEditMode, paperIdState]);

  // Function to load questions by IDs
  const loadQuestionsByIds = async (questionIds, marksData = null) => {
    try {
      // Fetch ONLY this paper's questions (not the whole bank).
      const allQuestions = await getQuestionsByIds(questionIds);
      const byId = new Map(
        (Array.isArray(allQuestions) ? allQuestions : []).map((q) => [
          Number(q.question_id ?? q.id),
          q,
        ])
      );

      // Filter questions by IDs and maintain order
      const fetchedQuestions = questionIds
        .map((id) => byId.get(Number(id)))
        .filter((q) => q !== undefined); // Remove any undefined (questions not found)
      
      // Group questions by type and populate questionSections
      const groupedQuestions = {
        mcq: [],
        blank: [],
        short: [],
        long: [],
        onetwo: [],
        true_false: [],
        passage: [],
        match: [],
      };
      
      fetchedQuestions.forEach((question) => {
        const normalizedType = normalizeQuestionType(question.type);
        if (groupedQuestions[normalizedType]) {
          groupedQuestions[normalizedType].push(question);
        }
      });
      
      // Update questionSections with loaded questions (pre-selected)
      setQuestionSections((prev) =>
        prev.map((section) => ({
          ...section,
          selectedQuestions: groupedQuestions[section.type] || [],
        }))
      );
      
      // Calculate marks per question type based on paper marks
      if (marksData) {
        const calculatedMarks = { ...marksPerType };
        
        Object.keys(groupedQuestions).forEach((type) => {
          const questionCount = groupedQuestions[type].length;
          if (questionCount > 0) {
            switch (type) {
              case "mcq":
                calculatedMarks.mcq = marksData.mcq / questionCount || 1;
                break;
              case "short":
                calculatedMarks.short = marksData.short / questionCount || 3;
                break;
              case "long":
                calculatedMarks.long = marksData.long / questionCount || 5;
                break;
              case "blank":
                calculatedMarks.blank = marksData.blank / questionCount || 1;
                break;
              case "onetwo":
                calculatedMarks.onetwo = marksData.onetwo / questionCount || 2;
                break;
              case "true_false":
                calculatedMarks.true_false = marksData.true_false / questionCount || 1;
                break;
              case "passage":
                calculatedMarks.passage = (marksData.passage || marksData.marks_passage) / questionCount || 2;
                break;
              case "match":
                calculatedMarks.match = (marksData.match || marksData.marks_match) / questionCount || 2;
                break;
            }
          }
        });
        
        setMarksPerType(calculatedMarks);
      }
    } catch (error) {
      console.error("Error loading questions:", error);
      setToast({
        message: "Failed to load questions",
        type: "error",
      });
    }
  };

  // Fetch approved subjects on component mount
  useEffect(() => {
    const fetchApprovedSubjects = async () => {
      try {
        const response = await apiClient.get("/auth/my-selections/approved");
        const responseData = response.data;

        // Extract unique subject IDs and names from approved selections
        const subjectIds = new Set();
        const subjectsMap = new Map();

        // Handle new response structure: { approved_selections: { subjects: [], subject_titles: [] } }
        if (responseData?.approved_selections) {
          const { subjects, subject_titles } = responseData.approved_selections;

          // Extract subject IDs and names from subjects array
          if (Array.isArray(subjects)) {
            subjects.forEach((item) => {
              const subjectId = item.subject_id || item.subject?.subject_id;
              const subjectName =
                item.subject?.subject_name || item.subject_name;

              if (subjectId) {
                subjectIds.add(subjectId);
                if (subjectName) {
                  subjectsMap.set(subjectId, subjectName);
                }
              }
            });
          }

          // Extract subject IDs, names, and subject titles from subject_titles array
          if (Array.isArray(subject_titles)) {
            subject_titles.forEach((item) => {
              const subjectId = item.subject_id || item.subject?.subject_id;
              const subjectName =
                item.subject?.subject_name || item.subject_name;

              if (subjectId) {
                subjectIds.add(subjectId);
                if (subjectName) {
                  subjectsMap.set(subjectId, subjectName);
                }
              }

              // Note: Subject titles are handled in EditHeaderCard component
            });
          }
        }
        // Handle old response structure: { data: [...] } or direct array
        else if (responseData?.data && Array.isArray(responseData.data)) {
          responseData.data.forEach((request) => {
            if (request.subjects && Array.isArray(request.subjects)) {
              request.subjects.forEach((subject) => {
                const subjectId = subject.subject_id;
                const subjectName = subject.subject_name;

                if (subjectId) {
                  subjectIds.add(subjectId);
                  if (subjectName) {
                    subjectsMap.set(subjectId, subjectName);
                  }
                }
              });
            }
          });
        }
        // Handle direct array response
        else if (Array.isArray(responseData)) {
          responseData.forEach((request) => {
            if (request.subjects && Array.isArray(request.subjects)) {
              request.subjects.forEach((subject) => {
                const subjectId = subject.subject_id;
                const subjectName = subject.subject_name;

                if (subjectId) {
                  subjectIds.add(subjectId);
                  if (subjectName) {
                    subjectsMap.set(subjectId, subjectName);
                  }
                }
              });
            }
          });
        }

        setApprovedSubjectIds(Array.from(subjectIds));
        setApprovedSubjectsMap(subjectsMap);
      } catch (error) {
        console.error("Error fetching approved subjects:", error);
        // If error, set empty array so no questions are shown
        setApprovedSubjectIds([]);
        setApprovedSubjectsMap(new Map());
      }
    };

    fetchApprovedSubjects();
  }, []);

  const effectiveHeaderForChapter = paperHeader || header;

  // LANGUAGE GATE — the language-specific types (complete_lines / synonyms / antonyms /
  // translate) may only be used on Gujarati, Hindi and Sanskrit papers; every other
  // subject sees only the base 8. translate is Sanskrit-only. Applied to the type
  // picker, the marks panel and the AI-paper counters.
  const paperLanguage = detectPaperLanguage(effectiveHeaderForChapter?.subject);
  const allowedTypeKeys = typeKeysForLanguage(paperLanguage);
  const isTypeAllowed = (type) => allowedTypeKeys.includes(normalizeTypeKeyLocal(type));

  /**
   * Height a section heading actually takes: a 16px title (which WRAPS for the long
   * Gujarati/Hindi wordings) plus its mb-1/mb-4 margins. The paginator used a flat
   * 36px, which under-counted every wrapped title until the page overflowed and the
   * content area scrolled — and a scrolled page loses content in the PDF.
   */
  const sectionHeaderHeight = (type) => {
    const title = getSectionTitle(type, effectiveHeaderForChapter?.subject) || "";
    // ~610px of title width (page minus padding minus the marks label) at 16px.
    const lines = Math.max(1, Math.ceil(String(title).length / 58));
    return lines * 26 + 20;
  };
  const rawSubjectTitleId =
    effectiveHeaderForChapter?.subjectTitle ??
    effectiveHeaderForChapter?.subject_title_id ??
    null;
  const subjectTitleIdForChapters =
    rawSubjectTitleId != null && rawSubjectTitleId !== ""
      ? rawSubjectTitleId
      : null;
  // The standard chosen in the teaching context (a standard_id). Used to show
  // only chapters assigned to that standard in the Chapter mix.
  const standardForChapters =
    effectiveHeaderForChapter?.standard != null && effectiveHeaderForChapter?.standard !== ""
      ? effectiveHeaderForChapter.standard
      : null;

  useEffect(() => {
    if (!subjectTitleIdForChapters) {
      setChapters([]);
      return;
    }
    let cancelled = false;
    setLoadingChapters(true);
    getChaptersBySubjectTitle(subjectTitleIdForChapters)
      .then((list) => {
        if (cancelled) return;
        let chapterList = Array.isArray(list) ? list : [];
        // Filter to chapters assigned to the selected standard (standard_id match).
        if (standardForChapters != null) {
          chapterList = chapterList.filter(
            (ch) => ch.standard != null && Number(ch.standard) === Number(standardForChapters)
          );
        }
        setChapters(chapterList);
      })
      .catch(() => {
        if (!cancelled) setChapters([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingChapters(false);
      });
    return () => { cancelled = true; };
  }, [subjectTitleIdForChapters, standardForChapters]);

  // Board id from the teaching context (needed for the marks breakdown).
  const boardForChapters =
    effectiveHeaderForChapter?.board != null && effectiveHeaderForChapter?.board !== ""
      ? effectiveHeaderForChapter.board
      : null;

  // Chapters the teacher actually allocated (percent > 0). The "N available" counts
  // are scoped to these so they reflect the chosen chapters, not the whole subject
  // title. Keyed by the id SET, so editing a percentage doesn't refetch.
  const smartSelectedChapterIds = useMemo(
    () =>
      smartChapterPercents
        .filter((c) => (Number(c.percent) || 0) > 0)
        .map((c) => Number(c.chapter_id))
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b),
    [smartChapterPercents]
  );
  const smartSelectedChapterKey = smartSelectedChapterIds.join(",");

  // Fetch per-type marks so we can show a live estimated total before generating.
  useEffect(() => {
    if (!subjectTitleIdForChapters || !boardForChapters || standardForChapters == null) {
      setSmartMarksByType(null);
      return;
    }
    let cancelled = false;
    const chapterIds = smartSelectedChapterKey
      ? smartSelectedChapterKey.split(",").map((s) => Number(s))
      : [];
    getMarksBreakdown({
      subject_title_id: subjectTitleIdForChapters,
      board_id: boardForChapters,
      standard: standardForChapters,
      chapter_ids: chapterIds,
    })
      .then((res) => {
        if (!cancelled) setSmartMarksByType(res?.by_type || null);
      })
      .catch(() => {
        if (!cancelled) setSmartMarksByType(null);
      });
    return () => { cancelled = true; };
  }, [subjectTitleIdForChapters, boardForChapters, standardForChapters, smartSelectedChapterKey]);

  useEffect(() => {
    if (!chapters.length) {
      setSmartChapterPercents([]);
      return;
    }
    // Default every chapter to 0 — the admin sets the mix (or uses "Normalize to 100%").
    setSmartChapterPercents(
      chapters.map((ch) => ({
        chapter_id: ch.chapter_id,
        percent: 0,
      }))
    );
  }, [chapters]);

  // Fetch questions filtered by approved subjects, board, subject title, and chapter from API
  useEffect(() => {
    // Don't fetch if approvedSubjectIds is empty (still loading or no approved subjects)
    if (approvedSubjectIds.length === 0) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    const fetchFilteredQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const effectiveHeader = paperHeader || header;
        // Build query parameters for API (subject_id, board_id, subject_title_id, standard)
        const params = new URLSearchParams();
        params.append("subject_id", approvedSubjectIds.join(","));

        if (effectiveHeader?.board) {
          params.append("board_id", effectiveHeader.board);
        }
        if (effectiveHeader?.subjectTitle) {
          params.append("subject_title_id", effectiveHeader.subjectTitle);
        }
        if (effectiveHeader?.standard != null && effectiveHeader?.standard !== "") {
          const standardVal = typeof effectiveHeader.standard === "string"
            ? (parseInt(effectiveHeader.standard, 10) || effectiveHeader.standard)
            : effectiveHeader.standard;
          params.append("standard", String(standardVal));
        }
        const chapterId = paperChapterId != null && paperChapterId !== "" ? paperChapterId : (effectiveHeader?.chapterId ?? effectiveHeader?.chapter_id);
        if (chapterId != null && chapterId !== "") {
          params.append("chapter_id", String(chapterId));
        }

        const response = await apiClient.get(`/question?${params.toString()}`);

        // Handle response format (could be array or object with questions property)
        const fetchedQuestions =
          response.data?.questions || response.data || [];
        setQuestions(fetchedQuestions);
      } catch (err) {
        console.error("Error fetching filtered questions:", err);
        setError("Failed to fetch questions");
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredQuestions();
  }, [approvedSubjectIds, paperChapterId, header?.board, header?.subjectTitle, header?.standard, header?.chapterId, header?.chapter_id, paperHeader?.board, paperHeader?.subjectTitle, paperHeader?.standard, paperHeader?.chapterId, paperHeader?.chapter_id]);

  // When no question type is selected, show all questions in mixed order
  useEffect(() => {
    if (!currentType && questions.length > 0) {
      setFilteredQuestions(shuffleArray(questions));
    }
  }, [currentType, questions]);

  // Close question type dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (questionTypeDropdownRef.current && !questionTypeDropdownRef.current.contains(e.target)) {
        setQuestionTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sidebar "Smart paper" opens multi-step wizard (header → subject → targets → animation → preview)
  useEffect(() => {
    if (isEditMode) return;
    const st = location.state;
    if (!st?.smartPaperWizard) return;
    setSmartWizardActive(true);
    setSmartWizardStep("header");
    const { smartPaperWizard: _w, header: incomingHeader, ...rest } = st;
    navigate(location.pathname, {
      replace: true,
      state: Object.keys(rest).length ? rest : undefined,
    });
    if (incomingHeader) {
      setPaperHeader(incomingHeader);
    } else {
      try {
        const u = JSON.parse(localStorage.getItem("user") || "null");
        setPaperHeader({
          schoolName: u?.school_name || "",
          address: u?.address || "",
          documentTitle: "",
          date: new Date().toISOString().slice(0, 10),
          timing: "",
          division: "",
          section: "",
          subject: "",
          board: "",
          subjectTitle: "",
          standard: "",
          class: "",
        });
      } catch {
        setPaperHeader({
          documentTitle: "",
          date: new Date().toISOString().slice(0, 10),
          timing: "",
          division: "",
          section: "",
        });
      }
    }
  }, []);

  // Seed the paper's subject/standard/board/subject-title from the already-chosen
  // teaching context so the Smart paper wizard can skip the redundant Subject step.
  // contextSelection loads asynchronously, so this runs whenever it becomes available.
  useEffect(() => {
    if (!smartWizardActive || !contextSelection) return;
    setPaperHeader((prev) => {
      if (!prev) return prev;
      // Don't override a header that already carries a subject context
      // (e.g. editing an existing paper or one passed via route state).
      if (prev.subjectTitle && prev.board && prev.standard) return prev;
      return {
        ...prev,
        subject: prev.subject || contextSelection.subject_name || "",
        board: prev.board || contextSelection.board_id || "",
        subjectTitle: prev.subjectTitle || contextSelection.subject_title_id || "",
        standard:
          prev.standard != null && prev.standard !== ""
            ? prev.standard
            : contextSelection.standard ?? "",
        class: prev.class || contextSelection.standard_name || "",
      };
    });
  }, [smartWizardActive, contextSelection]);

  // Ensure the header's standard/class reflect the chosen teaching context (e.g. Std 6)
  // for EVERY paper flow (not just the smart wizard), so the printed "Class:" isn't a
  // stale default. Only fills gaps; never overrides a standard/class already set.
  useEffect(() => {
    if (!contextSelection) return;
    setPaperHeader((prev) => {
      if (!prev) return prev;
      const hasStd = prev.standard != null && prev.standard !== "";
      const hasClass = prev.class != null && prev.class !== "";
      if (hasStd && hasClass) return prev;
      const ctxClass =
        contextSelection.standard_name ||
        (contextSelection.standard != null && contextSelection.standard !== ""
          ? `Standard ${contextSelection.standard}`
          : "");
      return {
        ...prev,
        standard: hasStd ? prev.standard : contextSelection.standard ?? "",
        class: hasClass ? prev.class : ctxClass,
      };
    });
  }, [contextSelection]);

  const sumSmartPercents = (obj) =>
    Object.values(obj).reduce((a, b) => a + (Number(b) || 0), 0);

  const getTeachingContext = () => {
    const h = paperHeader || header;
    const rawSt =
      h?.subjectTitle ?? h?.subject_title_id ?? null;
    const subject_title_id =
      rawSt != null && rawSt !== "" ? Number(rawSt) : null;
    const board_id =
      h?.board != null && h?.board !== "" ? Number(h.board) : null;
    let std = h?.standard;
    if (std != null && std !== "") {
      if (typeof std === "string") {
        const m = std.match(/\d+/);
        std = m ? parseInt(m[0], 10) : parseInt(std, 10);
      } else {
        std = Number(std);
      }
      if (Number.isNaN(std)) std = null;
    } else {
      std = null;
    }
    return { subject_title_id, board_id, standard: std };
  };

  const normalizeSmartChapterPercents = () => {
    if (!chapters.length) return;
    const n = chapters.length;
    const base = Math.floor(100 / n);
    let rem = 100 - base * n;
    setSmartChapterPercents(
      chapters.map((ch, i) => ({
        chapter_id: ch.chapter_id,
        percent: base + (i < rem ? 1 : 0),
      }))
    );
  };

  const resetSmartChapterPercents = () => {
    if (!chapters.length) return;
    setSmartChapterPercents(
      chapters.map((ch) => ({
        chapter_id: ch.chapter_id,
        percent: 0,
      }))
    );
  };

  const getSmartSectionQuestionTotal = () =>
    SMART_SECTION_KEYS.reduce((s, k) => s + (Number(smartSectionCounts[k]) || 0), 0);

  const resetSmartSectionCountsDefaults = () => {
    setSmartSectionCounts({ ...DEFAULT_SMART_SECTION_COUNTS });
  };

  const clearSmartSectionCounts = () => {
    setSmartSectionCounts(
      SMART_SECTION_KEYS.reduce((acc, k) => {
        acc[k] = 0;
        return acc;
      }, {})
    );
  };

  const updateSmartChapterPercent = (chapterId, value) => {
    const v = Math.max(0, Math.min(100, Number(value) || 0));
    setSmartChapterPercents((prev) =>
      prev.map((row) =>
        row.chapter_id === chapterId ? { ...row, percent: v } : row
      )
    );
  };

  const SMART_WIZARD_MIN_MS = 2800;

  const handleSmartPaperGenerate = async () => {
    const ctx = getTeachingContext();
    if (
      ctx.subject_title_id == null ||
      Number.isNaN(ctx.subject_title_id) ||
      ctx.board_id == null ||
      Number.isNaN(ctx.board_id) ||
      ctx.standard == null ||
      Number.isNaN(ctx.standard)
    ) {
      setToast({
        message:
          "Set subject title, board, and standard in the paper header first.",
        type: "error",
      });
      return;
    }
    if (!smartChapterPercents.length) {
      setToast({
        message:
          "No chapters for this subject title. Add chapters in admin or pick another title.",
        type: "error",
      });
      return;
    }
    const chSum = smartChapterPercents.reduce(
      (s, c) => s + (Number(c.percent) || 0),
      0
    );
    if (Math.abs(chSum - 100) > 0.01) {
      setToast({
        message: `Chapter % must sum to 100 (currently ${chSum}).`,
        type: "error",
      });
      return;
    }
    const dSum = sumSmartPercents(smartDifficulty);
    if (Math.abs(dSum - 100) > 0.01) {
      setToast({
        message: `Difficulty % must sum to 100 (currently ${dSum}).`,
        type: "error",
      });
      return;
    }
    const sSum = getSmartSectionQuestionTotal();
    if (sSum < 1) {
      setToast({
        message:
          "Set at least one question in the section mix (total questions must be at least 1).",
        type: "error",
      });
      return;
    }

    const inWizard = smartWizardActive && smartWizardStep === "targets";
    if (inWizard) {
      setSmartWizardStep("generating");
    }
    setSmartMeta(null);
    const startedAt = Date.now();

    try {
      const payload = {
        subject_title_id: ctx.subject_title_id,
        board_id: ctx.board_id,
        standard: ctx.standard,
        total_marks: Number(smartTotalMarks) || 80,
        chapter_weights: smartChapterPercents.map((c) => ({
          chapter_id: Number(c.chapter_id),
          percent: Number(c.percent),
        })),
        difficulty_weights: {
          easy: Number(smartDifficulty.easy),
          medium: Number(smartDifficulty.medium),
          hard: Number(smartDifficulty.hard),
        },
        section_question_counts: SMART_SECTION_KEYS.reduce((acc, k) => {
          // Types not allowed for this paper language must never be requested.
          if (!isTypeAllowed(k)) { acc[k] = 0; return acc; }
          acc[k] = Math.max(0, Math.floor(Number(smartSectionCounts[k]) || 0));
          return acc;
        }, {}),
        exclude_question_ids: [],
      };

      const raw = await smartProposePaper(payload);
      const data = raw?.data ?? raw;
      const list = data?.questions || [];
      if (!Array.isArray(list) || list.length === 0) {
        setSmartMeta({
          warnings: data?.warnings || [],
          suggestions: data?.suggestions || [],
          totals: data?.totals || null,
        });
        setToast({
          message:
            data?.message ||
            "No questions returned. Add more questions or adjust targets.",
          type: "error",
        });
        if (inWizard) setSmartWizardStep("targets");
        return;
      }

      const byId = {};
      const order = [];
      for (const row of list) {
        const id = row.question_id ?? row.id;
        if (id == null) continue;
        order.push(id);
        byId[id] = { ...row };
      }

      const typesNeeded = [
        ...new Set(order.map((id) => byId[id]?.type).filter(Boolean)),
      ];
      const filters = {
        subject_title_id: ctx.subject_title_id,
        board_id: ctx.board_id,
        standard: ctx.standard,
      };
      await Promise.all(
        typesNeeded.map(async (t) => {
          const qs = await getQuestionsByType(t, filters);
          const arr = Array.isArray(qs) ? qs : qs?.questions || qs?.data || [];
          arr.forEach((full) => {
            const fid = full.question_id ?? full.id;
            if (fid != null && byId[fid]) {
              byId[fid] = { ...full, ...byId[fid] };
            }
          });
        })
      );

      const groupedQuestions = {
        mcq: [],
        blank: [],
        short: [],
        long: [],
        onetwo: [],
        true_false: [],
        passage: [],
        match: [],
      };

      order.forEach((id) => {
        const q = byId[id];
        if (!q) return;
        const nt = normalizeQuestionType(q.type);
        if (groupedQuestions[nt]) {
          groupedQuestions[nt].push(q);
        }
      });

      setQuestionSections((prev) =>
        prev.map((section) => ({
          ...section,
          selectedQuestions: groupedQuestions[section.type] || [],
        }))
      );

      setSmartMeta({
        warnings: data?.warnings || [],
        suggestions: data?.suggestions || [],
        totals: data?.totals || null,
      });

      if (inWizard) {
        const elapsed = Date.now() - startedAt;
        if (elapsed < SMART_WIZARD_MIN_MS) {
          await new Promise((r) =>
            setTimeout(r, SMART_WIZARD_MIN_MS - elapsed)
          );
        }
        setSmartWizardStep("preview");
      }

      setToast({
        message: inWizard
          ? `Your paper is ready: ${order.length} question(s).`
          : `Smart paper applied: ${order.length} question(s). Showing preview.`,
        type: "success",
      });

      if (!inWizard) {
        setPreviewHighlight(true);
        setTimeout(() => setPreviewHighlight(false), 2600);
        setTimeout(() => {
          previewPanelRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
          const inner = previewPanelRef.current;
          if (inner && typeof inner.scrollTo === "function") {
            inner.scrollTo({ top: 0, behavior: "smooth" });
          }
        }, 120);
      } else {
        setPreviewHighlight(true);
        setTimeout(() => setPreviewHighlight(false), 2600);
        setTimeout(() => {
          previewPanelRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
          const inner = previewPanelRef.current;
          if (inner && typeof inner.scrollTo === "function") {
            inner.scrollTo({ top: 0, behavior: "smooth" });
          }
        }, 120);
      }
    } catch (err) {
      console.error(err);
      if (inWizard) setSmartWizardStep("targets");
      setToast({
        message:
          err.response?.data?.message ||
          err.message ||
          "Smart paper failed. Is the backend ready?",
        type: "error",
      });
    }
  };

  const handleMarksChange = (type, value) => {
    const numValue = parseFloat(value) || 0;
    if (numValue >= 0) {
      setMarksPerType((prev) => ({
        ...prev,
        [type]: numValue,
      }));
    }
  };

  /**
   * Marks for a single question: the value saved ON the question wins, falling back to
   * the per-type marks from "Configure Marks" when a question has none. The paper used
   * to be count x per-type marks, which ignored what the admin actually entered — a
   * 1-mark word still printed as 3 because the type default was 3.
   */
  const questionMarks = (question, sectionType) => {
    const own = Number(question?.marks);
    if (Number.isFinite(own) && own > 0) return own;
    return Number(marksPerType[normalizeTypeKeyLocal(sectionType)]) || 0;
  };

  /** Total marks of every question of a type across the WHOLE paper. */
  const sectionMarksFor = (sectionType) =>
    questionSections
      .filter((s) => normalizeTypeKeyLocal(s.type) === normalizeTypeKeyLocal(sectionType))
      .reduce(
        (sum, s) =>
          sum +
          (s.selectedQuestions || []).reduce(
            (t, q) => t + questionMarks(q, sectionType),
            0
          ),
        0
      );

  const getTotalMarks = () => {
    return questionSections.reduce(
      (total, section) =>
        total +
        (section.selectedQuestions || []).reduce(
          (t, q) => t + questionMarks(q, section.type),
          0
        ),
      0
    );
  };

  const handleTypeSelection = (type) => {
    setCurrentType(type);
    if (!type) {
      setFilteredQuestions(shuffleArray(questions));
    } else {
      setFilteredQuestions(
        questions.filter((q) => normalizeQuestionType(q.type) === type)
      );
    }
  };

  const toggleQuestionSelection = (question) => {
    setQuestionSections((prev) => {
      return prev.map((section) => {
        if (section.type === normalizeQuestionType(question.type)) {
          const questionExists = section.selectedQuestions.some(
            (q) => q.question_id === question.question_id
          );

          return {
            ...section,
            selectedQuestions: questionExists
              ? section.selectedQuestions.filter(
                  (q) => q.question_id !== question.question_id
                )
              : [...section.selectedQuestions, question],
          };
        }
        return section;
      });
    });
  };

  const handleDone = () => {
    setFilteredQuestions([]);
    setCurrentType("");
  };

  const handleClearSelection = () => {
    setQuestionSections((prevPages) =>
      prevPages.map((page) =>
        page.type === currentType ? { ...page, selectedQuestions: [] } : page
      )
    );
  };

  const handleReset = () => {
    setQuestionSections(INITIAL_QUESTION_SECTIONS);
    setMarksPerType({
      mcq: 1,
      blank: 1,
      true_false: 1,
      onetwo: 2,
      short: 3,
      long: 5,
      passage: 2,
      match: 2,
    });
    localStorage.removeItem("questionSections");
    localStorage.removeItem("marksPerType");
    if (smartWizardActive) {
      setSmartWizardStep("header");
      setSmartMeta(null);
      setSmartSectionCounts({ ...DEFAULT_SMART_SECTION_COUNTS });
    }
  };

  const downloadPDF = async () => {
    // Check if paper needs to be saved first
    if (!isSaved && !isEditMode) {
      // Save paper first before downloading
      const logoFile = document.getElementById("logo-upload");
      
      // Check if there are any questions selected
      const totalQuestions = questionSections.reduce(
        (total, section) => total + section.selectedQuestions.length,
        0
      );
      
      if (totalQuestions === 0) {
        setToast({
          message: "Please select at least one question before downloading",
          type: "warning",
        });
        return;
      }
      
      try {
        setIsSaving(true);
        // Get all selected question IDs and chapter IDs from selected questions
        const allQuestionIds = [];
        questionSections.forEach((section) => {
          section.selectedQuestions.forEach((question) => {
            allQuestionIds.push(question.question_id);
          });
        });
        const chapterIds = getChapterIdsFromSections(questionSections);
        
        const headerToSave = { ...(paperHeader || header), chapterId: paperChapterId || (paperHeader || header)?.chapterId || (paperHeader || header)?.chapter_id || "" };
        if (headerToSave.chapterId === "") delete headerToSave.chapterId;
        await savePaper(
          user, 
          allQuestionIds, 
          logoFile, 
          "custom", 
          headerToSave,
          marksPerType,
          questionSections,
          headerToSave?.documentTitle || null,
          chapterIds
        );
        setIsSaved(true);
        setToast({
          message: "Paper saved successfully!",
          type: "success",
        });
        
        // Don't clear questions yet — PDF generation below needs them
      } catch (error) {
        setIsSaving(false);
        setToast({
          message: "Failed to save paper. " + (error.response?.data?.message || error.message),
          type: "error",
        });
        return; // Don't download if save fails
      } finally {
        setIsSaving(false);
      }
    }
    
    // Generate and download PDF (sequential so page order is correct)
    try {
      // Ensure KaTeX (and other) web fonts are fully loaded before screenshotting,
      // otherwise the first export can capture fallback glyphs for math.
      if (document.fonts && document.fonts.ready) {
        try { await document.fonts.ready; } catch { /* noop */ }
      }
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
      const pages = pagesRef.current.children;

      for (let index = 0; index < pages.length; index++) {
        const page = pages[index];
        const images = Array.from(page.querySelectorAll("img"));
        await Promise.all(
          images.map(
            (img) =>
              new Promise((resolve) => {
                if (img.complete) resolve();
                else img.onload = () => resolve();
              })
          )
        );
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: "#ffffff",
          ignoreElements: (element) => element.classList.contains("no-print"),
        });
        // JPEG (compressed) keeps text crisp while shrinking the PDF ~50-100x
        // versus full-quality PNG screenshots.
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const maxHeight = 297;
        const finalHeight = imgHeight > maxHeight ? maxHeight : imgHeight;

        if (index > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, finalHeight, undefined, "FAST");
      }

      pdf.save("exam-paper.pdf");
      
      // Clear questions now that PDF is downloaded
      setQuestionSections(INITIAL_QUESTION_SECTIONS);
      localStorage.removeItem("questionSections");
      localStorage.removeItem("marksPerType");
      
      // Show success message and redirect to history
      setToast({
        message: "PDF downloaded successfully!",
        type: "success",
      });
      
      // Redirect to history after 1.5 seconds
      setTimeout(() => {
        navigate("/dashboard/history", { state: { refresh: true } });
      }, 1500);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setToast({
        message: "Failed to generate PDF",
        type: "error",
      });
    }
  };

  const handleSavePaper = async (allowDraft = false) => {
    // Prevent duplicate saves
    if (isSaving || isSaved) {
      return;
    }
    
    const totalQuestions = questionSections.reduce(
      (total, section) => total + section.selectedQuestions.length,
      0
    );
    
    if (totalQuestions === 0 && !allowDraft) {
      setToast({
        message: "Please select at least one question before saving",
        type: "warning",
      });
      return;
    }
    
    setIsSaving(true);
    const logoFile = document.getElementById("logo-upload");
    
    if (isEditMode && paperIdState) {
      // Update existing paper
      try {
        const formData = new FormData();
        
        // Get all selected question IDs and chapter IDs from selected questions
        const allQuestionIds = [];
        questionSections.forEach((section) => {
          section.selectedQuestions.forEach((question) => {
            allQuestionIds.push(question.question_id);
          });
        });
        const chapterIds = getChapterIdsFromSections(questionSections);
        
        // Add body as JSON string of question IDs (required)
        formData.append("body", JSON.stringify(allQuestionIds));
        if (chapterIds.length > 0) {
          formData.append("chapter_ids", JSON.stringify(chapterIds));
        }
        
        // Add header data if available
        // Note: school_name, address, logo are now fetched from user table via user_id
        if (header) {
          // Standard should be integer
          if (header.standard) {
            const standardValue = typeof header.standard === 'string' 
              ? parseInt(header.standard) || 0 
              : header.standard;
            formData.append("standard", standardValue);
          }
          if (header.date) formData.append("date", header.date);
          if (header.subject) formData.append("subject", header.subject);
          if (header.board) formData.append("board", header.board);
          if (header.timing) formData.append("timing", header.timing);
          if (header.division) formData.append("division", header.division);
          if (header.subjectTitle) formData.append("subject_title_id", header.subjectTitle);
          formData.append("paper_title", header.documentTitle || "");
        }
        
        // Calculate and add marks for each question type
        let marksMcq = 0;
        let marksShort = 0;
        let marksLong = 0;
        let marksBlank = 0;
        let marksOnetwo = 0;
        let marksTruefalse = 0;
        let marksPassage = 0;
        let marksMatch = 0;

        questionSections.forEach((section) => {
          const count = section.selectedQuestions.length;
          const marks = marksPerType[section.type] || 0;
          const totalMarks = count * marks;

          switch (section.type) {
            case "mcq":
              marksMcq = totalMarks;
              break;
            case "short":
              marksShort = totalMarks;
              break;
            case "long":
              marksLong = totalMarks;
              break;
            case "blank":
              marksBlank = totalMarks;
              break;
            case "onetwo":
              marksOnetwo = totalMarks;
              break;
            case "true_false":
              marksTruefalse = totalMarks;
              break;
            case "passage":
              marksPassage = totalMarks;
              break;
            case "match":
              marksMatch = totalMarks;
              break;
          }
        });

        formData.append("marks_mcq", marksMcq);
        formData.append("marks_short", marksShort);
        formData.append("marks_long", marksLong);
        formData.append("marks_blank", marksBlank);
        formData.append("marks_onetwo", marksOnetwo);
        formData.append("marks_truefalse", marksTruefalse);
        formData.append("marks_passage", marksPassage);
        formData.append("marks_match", marksMatch);
        
        // Note: logo is now fetched from user table via user_id, no need to send it here
        
        await updatePaper(paperIdState, formData);
        setIsSaved(true);
        setToast({
          message: "Paper updated successfully!",
          type: "success",
        });
        setTimeout(() => {
          navigate("/dashboard/history", { state: { refresh: true } });
        }, 1500);
      } catch (error) {
        console.error("Error updating paper:", error);
        setIsSaving(false);
        setToast({
          message: "Failed to update paper. " + (error.response?.data?.message || error.message),
          type: "error",
        });
      }
    } else {
      // Create new paper
      try {
        // Get all selected question IDs and chapter IDs from selected questions
        const allQuestionIds = [];
        questionSections.forEach((section) => {
          section.selectedQuestions.forEach((question) => {
            allQuestionIds.push(question.question_id);
          });
        });
        const chapterIds = getChapterIdsFromSections(questionSections);
        
        const headerToSave = { ...(paperHeader || header), chapterId: paperChapterId || (paperHeader || header)?.chapterId || (paperHeader || header)?.chapter_id || "" };
        if (headerToSave.chapterId === "") delete headerToSave.chapterId;
        await savePaper(
          user, 
          allQuestionIds, 
          logoFile, 
          "custom", 
          headerToSave,
          marksPerType,
          questionSections,
          headerToSave?.documentTitle || null,
          chapterIds
        );
        setIsSaved(true);
        setToast({
          message: "Paper saved successfully!",
          type: "success",
        });
        
        // Redirect to history after 1.5 seconds with refresh flag
        // Clear questions only right before navigating so preview stays visible
        setTimeout(() => {
          setQuestionSections(INITIAL_QUESTION_SECTIONS);
          localStorage.removeItem("questionSections");
          localStorage.removeItem("marksPerType");
          navigate("/dashboard/history", { state: { refresh: true } });
        }, 1500);
      } catch (error) {
        setIsSaving(false);
        setToast({
          message: "Failed to save paper. " + (error.response?.data?.message || error.message),
          type: "error",
        });
      }
    }
  };

  const handleDiscardAndGo = () => {
    setQuestionSections(INITIAL_QUESTION_SECTIONS);
    localStorage.removeItem("questionSections");
    localStorage.removeItem("marksPerType");
    setShowBackConfirm(false);
    navigate("/dashboard");
  };

  const handleSaveDraftAndGo = () => {
    setShowBackConfirm(false);
    handleSavePaper(true);
  };

  /**
   * Height of a question's body.
   *
   * Prefers the REAL height measured off-screen (see the measurement layer below).
   * Rich-text questions (tables, inline images) have unpredictable height, and the
   * old constant-based estimate — a flat 24px per question regardless of its text —
   * caused html2canvas to silently crop content. The estimate is kept only as a
   * fallback for the first render, before measurement lands.
   */
  const questionBodyHeight = (question) => {
    const measured = measuredHeights[question.question_id];
    if (measured != null) return measured; // already includes options + image block

    let h;
    if (question.type === "passage") {
      h = getPassageQuestionHeight(question);
    } else if (question.type === "match") {
      h = getMatchQuestionHeight(question);
    } else {
      h = COMPONENT_HEIGHTS.QUESTION;
      if (question.type === "mcq" && Array.isArray(question.options)) {
        h += getMcqOptionsHeight(question.options);
      }
    }
    return h + estimateImageBlockHeight(question);
  };

  const renderPages = () => {
    let pages = [];
    let currentHeight =
      PAGE_DIMENSIONS.HEIGHT - COMPONENT_HEIGHTS.HEADER - PAGE_DIMENSIONS.CONTENT_PADDING;
    let currentPage = [];
    const questionCounters = {};
    let isFirstPage = true;

    questionSections.forEach((section) => {
      // Initialize counter for this section type
      if (!(section.type in questionCounters)) {
        questionCounters[section.type] = 1;
      }

      section.selectedQuestions.forEach((question) => {
        // Check if this question type already exists on current page
        const isFirstQuestionOfType = !currentPage.some(
          (s) => s.type === question.type
        );

        // Calculate question height including spacing
        let questionHeight = questionBodyHeight(question);
        if (isFirstQuestionOfType) {
          // Real header height, not a flat constant: the title is 16px and long
          // Gujarati/Hindi titles wrap, and sections are separated by space-y-6.
          // Under-counting here is what made a page overflow and scroll.
          questionHeight += sectionHeaderHeight(question.type);
          if (currentPage.length > 0) questionHeight += SECTION_GAP;
        }
        // Add spacing between questions (except for first question on page)
        const hasQuestionsOnPage = currentPage.some(
          (s) => s.selectedQuestions.length > 0
        );
        if (hasQuestionsOnPage) {
          questionHeight += COMPONENT_HEIGHTS.SPACING;
        }

        // Check if question fits on current page (with margin + safety buffer to avoid clipping)
        const availableHeight = currentHeight - PAGE_DIMENSIONS.MARGIN - (PAGE_DIMENSIONS.SAFETY_BUFFER || 0);

        if (questionHeight > availableHeight) {
          // Save current page if it has content
          if (currentPage.length > 0) {
            pages.push([...currentPage]);
          }

          // Start new page
          isFirstPage = false;
          currentPage = [];
          // Full page height for subsequent pages (no header), minus container padding
          currentHeight = PAGE_DIMENSIONS.HEIGHT - PAGE_DIMENSIONS.CONTENT_PADDING;

          // Recalculate question height for new page (it's now first of its type on this page)
          // No spacing needed for first question on new page.
          const newQuestionHeight =
            questionBodyHeight(question) + sectionHeaderHeight(question.type);

          // Add question to new page
          currentPage.push({
            type: question.type,
            selectedQuestions: [question],
          });
          currentHeight =
            PAGE_DIMENSIONS.HEIGHT - PAGE_DIMENSIONS.CONTENT_PADDING - newQuestionHeight;

          // Safety check: if question is too large for a single page, still add it
          if (currentHeight < 0) {
            currentHeight = 0; // Prevent negative height
          }
        } else {
          // Question fits on current page
          let existingSection = currentPage.find(
            (s) => s.type === question.type
          );
          if (!existingSection) {
            currentPage.push({
              type: question.type,
              selectedQuestions: [question],
            });
          } else {
            existingSection.selectedQuestions.push(question);
          }
          currentHeight -= questionHeight;
        }

        // Number questions within each section (1, 2, 3...) — use normalized type so "truefalse" matches "true_false"
        const typeKey = normalizeQuestionType(question.type);
        if (!(typeKey in questionCounters)) questionCounters[typeKey] = 1;
        question.questionNumber = questionCounters[typeKey]++;
      });
    });

    // Always add the last page if it has content
    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    return pages.length > 0 ? pages : [[]];
  };

  const getTotalSelectedQuestions = () => {
    return questionSections.reduce(
      (total, section) => total + section.selectedQuestions.length,
      0
    );
  };

  const printedTypes = new Set();

  // Total questions per type across the WHOLE paper (a section can span multiple
  // pages, so a page chunk's length is not the section total). Used for the
  // section-header marks so it reflects every question of that type, not just
  // the ones on the page where the title prints.
  const sectionTypeTotals = {};
  (questionSections || []).forEach((s) => {
    const t = normalizeQuestionType(s.type);
    sectionTypeTotals[t] = (sectionTypeTotals[t] || 0) + (s.selectedQuestions?.length || 0);
  });

  // ---------------------------------------------------------------------------
  // Pagination measurement layer.
  //
  // Question heights used to be guessed from constants (a flat 24px per question,
  // regardless of its text), and anything that overflowed was silently CROPPED by
  // the html2canvas export. Rich-text questions (tables, inline images) have
  // unknowable height under that scheme, so we now render every question off-screen
  // at the exact page content width and measure its true height.
  // ---------------------------------------------------------------------------
  const measureRef = useRef(null);
  const [measuredHeights, setMeasuredHeights] = useState({});

  const allSelectedQuestions = useMemo(
    () => questionSections.flatMap((s) => s.selectedQuestions || []),
    [questionSections]
  );

  useEffect(() => {
    const root = measureRef.current;
    if (!root || allSelectedQuestions.length === 0) {
      setMeasuredHeights((prev) => (Object.keys(prev).length ? {} : prev));
      return;
    }
    let cancelled = false;

    const measure = async () => {
      // Fonts and images change layout — measuring before they settle gives wrong
      // heights (the export path already waits for these before screenshotting).
      try {
        if (document.fonts?.ready) await document.fonts.ready;
      } catch {
        /* not supported — measure anyway */
      }
      const imgs = Array.from(root.querySelectorAll("img"));
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((res) => {
                img.onload = res;
                img.onerror = res;
              })
        )
      );
      if (cancelled) return;

      const next = {};
      root.querySelectorAll("[data-measure-qid]").forEach((node) => {
        const id = node.getAttribute("data-measure-qid");
        next[id] = Math.ceil(node.getBoundingClientRect().height);
      });

      setMeasuredHeights((prev) => {
        const keys = Object.keys(next);
        const same =
          keys.length === Object.keys(prev).length &&
          keys.every((k) => prev[k] === next[k]);
        return same ? prev : next; // guard against a re-render loop
      });
    };

    measure();
    return () => {
      cancelled = true;
    };
  }, [allSelectedQuestions]);

  const smartSectionQuestionTotal = getSmartSectionQuestionTotal();
  // Plain-language parts for the "This paper" summary, e.g. ["15 MCQ", "10 True/False"].
  const smartSelectedParts = SMART_SECTION_KEYS.filter(
    (k) => (Number(smartSectionCounts[k]) || 0) > 0
  ).map((k) => `${Number(smartSectionCounts[k])} ${SMART_SECTION_SHORT_LABELS[k] || k}`);

  // How many of each type can actually be pulled = min(requested, available in bank).
  const smartAchievableCount = (k) => {
    const req = Number(smartSectionCounts[k]) || 0;
    if (!smartMarksByType || !smartMarksByType[k]) return req;
    const avail = smartMarksByType[k].available ?? req;
    return Math.min(req, avail);
  };
  // Total questions the bank can actually supply for the chosen counts.
  const smartAchievableTotal = smartMarksByType
    ? SMART_SECTION_KEYS.reduce((s, k) => s + smartAchievableCount(k), 0)
    : smartSectionQuestionTotal;
  // Types where the teacher asked for more than the bank has.
  const smartShortfallTypes = smartMarksByType
    ? SMART_SECTION_KEYS.filter(
        (k) =>
          (Number(smartSectionCounts[k]) || 0) >
          (smartMarksByType[k]?.available ?? Infinity)
      )
    : [];
  // Total marks use the SAME per-type config the paper prints with (marksPerType),
  // NOT each question's stored marks — so this exactly matches the generated paper.
  const smartEstimatedMarks = SMART_SECTION_KEYS.reduce(
    (s, k) => s + smartAchievableCount(k) * (Number(marksPerType[k]) || 0),
    0
  );
  // What the "Total marks (auto)" box shows.
  const smartTotalMarksDisplay =
    smartEstimatedMarks > 0 ? `${smartEstimatedMarks} marks` : "Auto (from questions)";
  // Difference from an optional target the teacher entered.
  const smartTargetDiff =
    Number(smartTargetMarks) > 0 ? smartEstimatedMarks - Number(smartTargetMarks) : null;

  // Show loading state while loading paper data
  if (loadingPaper) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading paper data...</p>
        </div>
      </div>
    );
  }

  const proceedWizardHeader = () => {
    if (!paperHeader?.documentTitle?.trim()) {
      setToast({
        message: "Please enter a paper title.",
        type: "error",
      });
      return;
    }
    // Subject context comes from the chosen teaching context, so the next step is
    // the chapter mix (%), then questions & difficulty.
    setSmartWizardStep("chapters");
  };

  if (smartWizardActive && smartWizardStep === "header") {
    if (!paperHeader) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center">
          <Loader className="mx-auto mb-4" />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
        <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 px-6 py-4 sticky top-0 z-50 shadow-lg shadow-gray-200/50">
          <div className="flex flex-wrap items-center justify-between gap-3 w-full max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowBackConfirm(true)}
                className="group flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                <ChevronLeft
                  size={20}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                <span>Back to Dashboard</span>
              </button>
              <div className="flex items-center gap-2 flex-wrap">
                <Sparkles size={22} className="text-indigo-600" />
                <span className="font-bold text-gray-800">Smart paper</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-8 pb-16">
          <SmartPaperStepper activeIndex={0} />
          <p className="text-gray-600 text-sm mb-6">
            Start with your paper header. School name and address come from your profile; next you will choose subject, board, and standard.
          </p>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white flex items-center gap-3">
              <Sparkles size={22} />
              <div>
                <div className="font-bold text-base">Paper header</div>
                <div className="text-xs text-indigo-100">Title, date, and exam details</div>
              </div>
            </div>
            <div className="p-6 space-y-4 border-t border-gray-100 bg-gradient-to-b from-white to-slate-50/80">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                <strong>School on the paper:</strong>{" "}
                {paperHeader.schoolName || "—"} (from your profile). Update in Profile if needed.
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Paper title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paperHeader.documentTitle || ""}
                  onChange={(e) =>
                    setPaperHeader((p) => ({ ...p, documentTitle: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm"
                  placeholder="e.g. Unit Test – Term 1"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={paperHeader.date || ""}
                    onChange={(e) =>
                      setPaperHeader((p) => ({ ...p, date: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Time / duration</label>
                  <input
                    type="text"
                    value={paperHeader.timing || ""}
                    onChange={(e) =>
                      setPaperHeader((p) => ({ ...p, timing: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm"
                    placeholder="e.g. 3 hours"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Section</label>
                  <input
                    type="text"
                    value={paperHeader.section || ""}
                    onChange={(e) =>
                      setPaperHeader((p) => ({ ...p, section: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Division</label>
                  <input
                    type="text"
                    value={paperHeader.division || ""}
                    onChange={(e) =>
                      setPaperHeader((p) => ({ ...p, division: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={proceedWizardHeader}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg"
              >
                Continue to smart settings
              </button>
            </div>
          </div>
        </div>

        {showBackConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Leave this page?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure? You can save as draft and continue later, or discard and start fresh next time.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowBackConfirm(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDiscardAndGo}
                  className="px-4 py-2.5 rounded-xl font-semibold bg-rose-500 text-white hover:bg-rose-600 transition"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraftAndGo}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl font-semibold bg-violet-500 text-white hover:bg-violet-600 transition disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save as draft"}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            duration={3000}
          />
        )}
      </div>
    );
  }

  // Step 2 — Chapter mix. The percentages must add up to 100 before continuing;
  // Submit only advances (the paper is generated on the next step).
  if (smartWizardActive && smartWizardStep === "chapters") {
    const chapterPercentTotal = smartChapterPercents.reduce(
      (s, c) => s + (Number(c.percent) || 0),
      0
    );
    const chapterTotalRounded = Math.round(chapterPercentTotal * 100) / 100;
    const chapterTotalOk = Math.abs(chapterPercentTotal - 100) <= 0.01;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
        <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 px-6 py-4 sticky top-0 z-50 shadow-lg shadow-gray-200/50">
          <div className="flex flex-wrap items-center justify-between gap-3 w-full max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowBackConfirm(true)}
                className="group flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                <ChevronLeft
                  size={20}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                <span>Back to Dashboard</span>
              </button>
              <div className="flex items-center gap-2 flex-wrap">
                <Sparkles size={22} className="text-indigo-600" />
                <span className="font-bold text-gray-800">Smart paper</span>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  Step 2 — Chapters
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-8 pb-16">
          <SmartPaperStepper activeIndex={1} />
          <p className="text-gray-600 text-sm mb-6">
            Choose how much of the paper comes from each chapter. The percentages must add up to 100%.
          </p>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white flex items-center gap-3">
              <Sparkles size={22} />
              <div>
                <div className="font-bold text-base">Chapter mix</div>
                <div className="text-xs text-indigo-100">
                  Share of the paper taken from each chapter
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5 border-t border-gray-100 bg-gradient-to-b from-white to-slate-50/80">
              {!subjectTitleIdForChapters && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                  <p className="font-bold mb-1">Header required</p>
                  <p className="mb-2">
                    Your <strong>paper header</strong> must include <strong>Subject title, Board, and Standard</strong>.
                  </p>
                  <p>
                    Go to <strong>Generate → Edit header</strong>, fill those fields, then open <strong>Smart paper</strong> again from the sidebar.
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-800">Chapter mix (%)</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={resetSmartChapterPercents}
                      className="text-xs font-semibold text-gray-500 hover:underline"
                    >
                      Set all to 0
                    </button>
                    <button
                      type="button"
                      onClick={normalizeSmartChapterPercents}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      Normalize to 100%
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">
                  Sets how your chosen questions are spread across chapters (best effort). Use “Normalize to 100%” to balance.
                </p>
                {smartChapterPercents.length === 0 ? (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    No chapters assigned to this standard for this subject title. Assign a
                    standard to chapters under Subject Titles → Manage Chapters.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {smartChapterPercents.map((row) => {
                        const ch = chapters.find((c) => c.chapter_id === row.chapter_id);
                        const chapterLabel = `${
                          ch?.chapter_number != null ? `${ch.chapter_number}. ` : ""
                        }${ch?.chapter_name || `Chapter ${row.chapter_id}`}`;
                        return (
                          <div key={row.chapter_id} className="flex items-center gap-2">
                            <span className="text-sm text-gray-700 flex-1 truncate" title={chapterLabel}>
                              {chapterLabel}
                            </span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={row.percent}
                              onChange={(e) =>
                                updateSmartChapterPercent(row.chapter_id, e.target.value)
                              }
                              className="w-16 px-2 py-1.5 border-2 border-gray-200 rounded-lg text-sm"
                            />
                          </div>
                        );
                      })}
                    </div>
                    {/* Live total — Submit stays disabled until this is exactly 100% */}
                    <div
                      className={`mt-4 flex items-center justify-between rounded-xl border-2 px-4 py-3 ${
                        chapterTotalOk
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-amber-300 bg-amber-50"
                      }`}
                    >
                      <span className="text-sm font-bold text-gray-800">Total</span>
                      <span
                        className={`text-sm font-bold ${
                          chapterTotalOk ? "text-emerald-700" : "text-amber-800"
                        }`}
                      >
                        {chapterTotalRounded}%{chapterTotalOk ? "" : " — must be 100%"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSmartWizardStep("header")}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <ChevronLeft size={18} />
                  Back to paper header
                </button>
                <button
                  type="button"
                  disabled={!chapterTotalOk || smartChapterPercents.length === 0}
                  onClick={() => setSmartWizardStep("targets")}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 shadow-lg"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (smartWizardActive && smartWizardStep === "targets") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
        <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 px-6 py-4 sticky top-0 z-50 shadow-lg shadow-gray-200/50">
          <div className="flex flex-wrap items-center justify-between gap-3 w-full max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowBackConfirm(true)}
                className="group flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                <ChevronLeft
                  size={20}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                <span>Back to Dashboard</span>
              </button>
              <div className="flex items-center gap-2 flex-wrap">
                <Sparkles size={22} className="text-indigo-600" />
                <span className="font-bold text-gray-800">Smart paper</span>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  Step 3 — Questions &amp; difficulty
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-8 pb-16">
          <SmartPaperStepper activeIndex={2} />
          <p className="text-gray-600 text-sm mb-6">
            Choose how many questions of each type, and the easy/medium/hard mix. After you generate, you will see a brief generating screen, then the full preview with download and save.
          </p>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white flex items-center gap-3">
              <Sparkles size={22} />
              <div>
                <div className="font-bold text-base">Questions &amp; difficulty</div>
                <div className="text-xs text-indigo-100">
                  Number of questions per type and the easy/medium/hard mix
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5 border-t border-gray-100 bg-gradient-to-b from-white to-slate-50/80">
              {!subjectTitleIdForChapters && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                  <p className="font-bold mb-1">Header required</p>
                  <p className="mb-2">
                    Your <strong>paper header</strong> must include <strong>Subject title, Board, and Standard</strong>.
                  </p>
                  <p>
                    Go to <strong>Generate → Edit header</strong>, fill those fields, then open <strong>Smart paper</strong> again from the sidebar (or use Add Questions to return here with the same header).
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-600">
                Uses your header (subject title, board, standard) and chapter list. Requires backend{" "}
                <code className="text-xs bg-gray-100 px-1 rounded">POST /papers/smart-propose</code> and questions with difficulty set.
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Easy %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={smartDifficulty.easy}
                      onChange={(e) =>
                        setSmartDifficulty((p) => ({ ...p, easy: Number(e.target.value) || 0 }))
                      }
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Medium %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={smartDifficulty.medium}
                      onChange={(e) =>
                        setSmartDifficulty((p) => ({ ...p, medium: Number(e.target.value) || 0 }))
                      }
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Hard %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={smartDifficulty.hard}
                      onChange={(e) =>
                        setSmartDifficulty((p) => ({ ...p, hard: Number(e.target.value) || 0 }))
                      }
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 -mt-1">
                Easy / Medium / Hard set how questions are spread across difficulty levels (best effort, should total 100%).
              </p>

              <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-4 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Number of questions per type</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Set how many questions to pull from each type. Types at 0 are skipped. Marks for each type come
                      from “Configure Marks”, so total marks = count × marks-per-type.
                    </p>
                  </div>
                  <div
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold ${
                      smartSectionQuestionTotal >= 1
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    Total questions: {smartSectionQuestionTotal}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={resetSmartSectionCountsDefaults}
                    className="text-xs font-semibold text-indigo-600 hover:underline px-1"
                  >
                    Reset defaults
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={clearSmartSectionCounts}
                    className="text-xs font-semibold text-gray-600 hover:underline px-1"
                  >
                    Clear all
                  </button>
                </div>
                <div className="space-y-3">
                  {SMART_SECTION_GROUPS.map((group) => ({ ...group, keys: group.keys.filter(isTypeAllowed) }))
                    .filter((group) => group.keys.length > 0)
                    .map((group) => (
                    <details
                      key={group.id}
                      className="group border border-gray-200 rounded-xl bg-white overflow-hidden open:shadow-sm"
                      {...(group.id === "objective" ? { open: true } : {})}
                    >
                      <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-gray-800 text-sm flex items-center justify-between bg-gray-50/80 hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                        <span>{group.title}</span>
                        <ChevronDown className="h-4 w-4 text-gray-500 shrink-0 opacity-70" />
                      </summary>
                      <div className="px-4 pb-4 pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-gray-100">
                        {group.keys.map((key) => (
                          <div key={key}>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              {QUESTION_TYPE_CONFIG[key]?.label || key}{" "}
                              <span className="text-gray-400 font-normal">(count)</span>
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={500}
                              step={1}
                              value={smartSectionCounts[key] ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                setSmartSectionCounts((p) => ({
                                  ...p,
                                  // Allow the field to be empty while typing/backspacing;
                                  // consumers coerce empty → 0 on submit.
                                  [key]:
                                    raw === ""
                                      ? ""
                                      : Math.max(0, Math.min(500, Math.floor(Number(raw) || 0))),
                                }));
                              }}
                              onBlur={(e) => {
                                // Normalize a left-empty field back to 0 on blur.
                                if (e.target.value === "") {
                                  setSmartSectionCounts((p) => ({ ...p, [key]: 0 }));
                                }
                              }}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm"
                            />
                            <div className="mt-1 text-[11px] text-gray-500">
                              {(Number(marksPerType[key]) || 0) > 0 && (
                                <>
                                  {marksPerType[key]} mark
                                  {Number(marksPerType[key]) !== 1 ? "s" : ""} each
                                  {smartMarksByType?.[key] && " · "}
                                </>
                              )}
                              {smartMarksByType?.[key] && (
                                <>
                                  {smartMarksByType[key].available} available
                                  {smartSelectedChapterIds.length > 0 && " in selected chapters"}
                                  {(Number(smartSectionCounts[key]) || 0) >
                                    smartMarksByType[key].available && (
                                    <span className="text-amber-700 font-semibold">
                                      {" "}
                                      (only {smartMarksByType[key].available} can be added)
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            {(() => {
                              const s = smartMeta?.totals?.by_section?.[key];
                              if (!s || (s.requested_count ?? 0) === 0) return null;
                              const ok = (s.actual_count ?? 0) >= (s.requested_count ?? 0);
                              return (
                                <div
                                  className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${
                                    ok ? "text-emerald-700" : "text-amber-700"
                                  }`}
                                >
                                  {ok ? (
                                    <CheckCircle2 size={12} />
                                  ) : (
                                    <AlertTriangle size={12} />
                                  )}
                                  {s.actual_count}/{s.requested_count} added
                                </div>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-emerald-900">
                    {smartSectionQuestionTotal > 0 ? (
                      <>
                        {smartMarksByType && smartShortfallTypes.length > 0 ? (
                          <>
                            Your paper will have{" "}
                            <span className="font-bold">
                              up to {smartAchievableTotal} question
                              {smartAchievableTotal !== 1 ? "s" : ""}
                            </span>{" "}
                            — some types have fewer questions in your bank than you asked for
                            (see the notes below each box).
                          </>
                        ) : (
                          <>
                            Your paper will have{" "}
                            <span className="font-bold">
                              exactly {smartSectionQuestionTotal} question
                              {smartSectionQuestionTotal !== 1 ? "s" : ""}
                            </span>
                            {smartSelectedParts.length > 0 && (
                              <> ({smartSelectedParts.join(", ")})</>
                            )}
                            .
                          </>
                        )}
                        {smartEstimatedMarks > 0 && (
                          <>
                            {" "}
                            Total marks:{" "}
                            <span className="font-bold">{smartEstimatedMarks}</span>.
                          </>
                        )}
                      </>
                    ) : (
                      <>Set at least one question count above to build your paper.</>
                    )}
                  </div>
                </div>

                {/* Optional: aim for an exact marks total */}
                <div className="flex flex-wrap items-center gap-2 border-t border-emerald-200 pt-3">
                  <label className="text-xs font-semibold text-emerald-900">
                    Target marks (optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={smartTargetMarks || ""}
                    onChange={(e) =>
                      setSmartTargetMarks(Math.max(0, Math.floor(Number(e.target.value) || 0)))
                    }
                    placeholder="e.g. 50"
                    className="w-24 px-2 py-1 border-2 border-emerald-200 rounded-lg text-sm bg-white"
                  />
                  {smartTargetDiff != null && (
                    <span
                      className={`text-xs font-semibold ${
                        smartTargetDiff === 0 ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {smartTargetDiff === 0
                        ? "On target ✓"
                        : smartTargetDiff < 0
                        ? `Add ~${Math.abs(smartTargetDiff)} more mark${
                            Math.abs(smartTargetDiff) !== 1 ? "s" : ""
                          } (adjust counts above)`
                        : `${smartTargetDiff} mark${
                            smartTargetDiff !== 1 ? "s" : ""
                          } over target`}
                    </span>
                  )}
                  <span className="text-[11px] text-emerald-700/80">
                    Marks per type come from “Configure Marks”.
                  </span>
                </div>
              </div>

              <div className="sm:max-w-xs">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Total marks <span className="text-gray-400 font-normal">(auto)</span>
                </label>
                <p className="text-[11px] text-gray-500 mb-1">
                  Calculated automatically from the question counts you set above.
                </p>
                <div className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700 font-semibold">
                  {smartTotalMarksDisplay}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSmartWizardStep("chapters")}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <ChevronLeft size={18} />
                  Back to chapters
                </button>
                <button
                  type="button"
                  disabled={
                    approvedSubjectIds.length === 0 ||
                    !subjectTitleIdForChapters ||
                    smartSectionQuestionTotal < 1 ||
                    // Safety net — the chapter step already enforces this.
                    Math.abs(
                      smartChapterPercents.reduce((s, c) => s + (Number(c.percent) || 0), 0) - 100
                    ) > 0.01
                  }
                  onClick={handleSmartPaperGenerate}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 shadow-lg"
                >
                  <Sparkles size={18} />
                  Generate smart paper
                </button>
              </div>
              {smartMeta &&
                (smartMeta.warnings?.length > 0 || smartMeta.suggestions?.length > 0) && (
                  <div className="space-y-2 pt-2">
                    {smartMeta.warnings?.length > 0 && (
                      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
                        <div className="flex items-center gap-2 font-bold text-amber-900 text-sm mb-1">
                          <AlertTriangle size={16} />
                          Warnings
                        </div>
                        <ul className="text-sm text-amber-900 list-disc list-inside">
                          {smartMeta.warnings.map((w, i) => (
                            <li key={i}>{humanizeSmartWarning(w)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {smartMeta.suggestions?.length > 0 && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                        <div className="font-bold text-blue-900 text-sm mb-1">Suggestions</div>
                        <ul className="text-sm text-blue-900 list-disc list-inside">
                          {smartMeta.suggestions.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>

        {showBackConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Leave this page?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure? You can save as draft and continue later, or discard and start fresh next time.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowBackConfirm(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDiscardAndGo}
                  className="px-4 py-2.5 rounded-xl font-semibold bg-rose-500 text-white hover:bg-rose-600 transition"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraftAndGo}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl font-semibold bg-violet-500 text-white hover:bg-violet-600 transition disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save as draft"}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            duration={3000}
          />
        )}
      </div>
    );
  }

  if (smartWizardActive && smartWizardStep === "generating") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
        <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 px-6 py-4 sticky top-0 z-50 shadow-lg shadow-gray-200/50">
          <div className="flex flex-wrap items-center justify-between gap-3 w-full max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowBackConfirm(true)}
                className="group flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                <ChevronLeft
                  size={20}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                <span>Back to Dashboard</span>
              </button>
              <div className="flex items-center gap-2 flex-wrap">
                <Sparkles size={22} className="text-indigo-600 animate-pulse" />
                <span className="font-bold text-gray-800">Smart paper</span>
                <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                  Generating
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center px-6 py-16 min-h-[calc(100vh-88px)]">
          <div className="w-full max-w-md rounded-2xl bg-white/90 border border-gray-200/80 shadow-xl shadow-indigo-100/50 p-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100">
              <Sparkles className="h-10 w-10 text-indigo-600 animate-pulse" />
            </div>
            <Loader className="mx-auto mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Crafting your paper with AI
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
              Balancing chapters, difficulty, and sections. Please wait — this will only take a moment.
            </p>
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 animate-pulse" />
            </div>
            <p className="text-xs text-gray-400 mt-4">You can stay on this page — the preview will appear here next.</p>
          </div>
        </div>

        {showBackConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Leave this page?</h3>
              <p className="text-gray-600 mb-6">
                Generation is in progress. If you leave, you may lose this run. Are you sure?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowBackConfirm(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Stay
                </button>
                <button
                  type="button"
                  onClick={handleDiscardAndGo}
                  className="px-4 py-2.5 rounded-xl font-semibold bg-rose-500 text-white hover:bg-rose-600 transition"
                >
                  Leave anyway
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            duration={3000}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Top Navigation Bar - Modern Glassmorphism */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 px-6 py-4 sticky top-0 z-50 shadow-lg shadow-gray-200/50">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowBackConfirm(true)}
              className="group flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
            >
              <ChevronLeft
                size={20}
                className="group-hover:-translate-x-1 transition-transform"
              />
              <span>Back to Dashboard</span>
            </button>
            {isEditMode && (
              <div className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-semibold text-sm">
                ✏️ Edit Mode
              </div>
            )}
            {smartWizardActive && smartWizardStep === "preview" && (
              <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                <Sparkles size={16} />
                Preview and download
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-2.5 rounded-xl border border-blue-100 shadow-sm">
              <Sparkles size={18} className="text-blue-600 animate-pulse" />
              <span className="text-sm font-semibold text-gray-800">
                {getTotalSelectedQuestions()} Questions Selected
              </span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-2.5 rounded-xl border border-emerald-100 shadow-sm">
              <span className="text-lg font-bold text-emerald-600">📊</span>
              <span className="text-sm font-semibold text-gray-800">
                Total Marks:{" "}
                <span className="text-emerald-600 font-bold">
                  {getTotalMarks()}
                </span>
              </span>
            </div>
            <button
              onClick={downloadPDF}
              disabled={isSaving}
              className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown size={18} className="group-hover:animate-bounce" />
              <span>{isSaving ? "Saving..." : "Download PDF"}</span>
            </button>
            <button
              onClick={handleSavePaper}
              disabled={loadingPaper || isSaving || isSaved}
              className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold hover:from-violet-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText
                size={18}
                className="group-hover:rotate-12 transition-transform"
              />
              <span>
                {isSaving 
                  ? "Saving..." 
                  : isSaved 
                    ? "Saved!" 
                    : isEditMode 
                      ? "Update Paper" 
                      : "Save Paper"}
              </span>
            </button>
            <button
              onClick={handleReset}
              className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl font-semibold hover:from-rose-600 hover:to-red-700 transition-all duration-200 shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 hover:scale-105 active:scale-95"
            >
              <XCircle
                size={18}
                className="group-hover:rotate-90 transition-transform duration-300"
              />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Back to Dashboard confirmation */}
      {showBackConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Leave this page?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure? You can save as draft and continue later, or discard and start fresh next time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowBackConfirm(false)}
                className="px-4 py-2.5 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDiscardAndGo}
                className="px-4 py-2.5 rounded-xl font-semibold bg-rose-500 text-white hover:bg-rose-600 transition"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSaveDraftAndGo}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl font-semibold bg-violet-500 text-white hover:bg-violet-600 transition disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save as draft"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Logo Upload Input */}
      <input 
        type="file" 
        id="logo-upload" 
        accept="image/*" 
        className="hidden"
        onChange={(e) => {
          // Handle logo file change if needed
          if (e.target.files && e.target.files[0]) {
            // File is available for upload
          }
        }}
      />

      {/* Split Screen Layout — wizard preview uses full width (no question list beside preview) */}
      <div className="flex h-[calc(100vh-73px)] overflow-hidden">
        {/* Left Half - Question Selection */}
        {!(smartWizardActive && smartWizardStep === "preview") && (
        <div className="w-1/2 border-r border-gray-200/60 overflow-y-auto bg-gradient-to-b from-white to-gray-50/50 p-6 scroll-smooth">
          <div className="mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Sparkles size={24} className="text-white" />
              </div>
              Select Questions
            </h2>
            <p className="text-gray-600 text-sm ml-14">
              Choose questions to add to your exam paper
            </p>
          </div>

          {/* No Approved Subjects Message */}
          {approvedSubjectIds.length === 0 && !loading && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg border-2 border-amber-300 p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-full">
                  <XCircle size={24} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-800 mb-2">
                    No Approved Subjects
                  </h3>
                  <p className="text-sm text-amber-700 mb-3">
                    You don't have any approved subjects yet. Please request
                    subjects from the admin through the Subject Requests page.
                  </p>
                  <button
                    onClick={() => navigate("/dashboard/subject-requests")}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all font-semibold text-sm shadow-md"
                  >
                    Go to Subject Requests
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chapter filter - filter questions by chapter for current subject title */}
          {subjectTitleIdForChapters && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6 hover:shadow-xl transition-all duration-300">
              <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></span>
                Chapter
              </label>
              <p className="text-xs text-gray-500 mb-2">Filter questions by chapter for your subject title</p>
              {loadingChapters ? (
                <p className="text-sm text-gray-500 py-2">Loading chapters...</p>
              ) : (
                <select
                  value={paperChapterId}
                  onChange={(e) => setPaperChapterId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                >
                  <option value="">All chapters (no filter)</option>
                  {chapters.map((ch) => (
                    <option key={ch.chapter_id} value={ch.chapter_id}>
                      {ch.chapter_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Question Type Selector - Modern custom dropdown */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6 hover:shadow-xl transition-all duration-300" ref={questionTypeDropdownRef}>
            <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></span>
              Select Question Type
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => approvedSubjectIds.length > 0 && setQuestionTypeDropdownOpen((o) => !o)}
                disabled={approvedSubjectIds.length === 0}
                className="w-full px-4 py-3.5 flex items-center justify-between gap-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-left bg-white hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <span className="font-semibold text-gray-800 truncate">
                  {currentType ? (
                    <span className={`inline-flex items-center gap-2 ${QUESTION_TYPE_CONFIG[currentType]?.badge} px-3 py-1 rounded-lg`}>
                      <span className={`w-2 h-2 rounded-full ${QUESTION_TYPE_CONFIG[currentType]?.color}`} />
                      {QUESTION_TYPE_CONFIG[currentType]?.label}
                    </span>
                  ) : (
                    <span className="text-gray-500">Choose a question type or view all (mixed)</span>
                  )}
                </span>
                <ChevronDown
                  size={20}
                  className={`flex-shrink-0 text-gray-500 transition-transform duration-200 ${questionTypeDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {questionTypeDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      handleTypeSelection("");
                      setQuestionTypeDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors ${!currentType ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="font-medium text-gray-700">All types (mixed)</span>
                  </button>
                  {Object.entries(QUESTION_TYPE_CONFIG).filter(([type]) => isTypeAllowed(type)).map(([type, config]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        handleTypeSelection(type);
                        setQuestionTypeDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors ${currentType === type ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${config.color}`} />
                      <span className="font-medium text-gray-800">{config.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Marks Configuration Toggle Button */}
          <button
            onClick={() => setIsMarksPanelExpanded(!isMarksPanelExpanded)}
            className="w-full mb-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                <Award size={20} className="text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-base">Configure Marks</div>
                <div className="text-xs text-amber-100 font-medium">
                  Set marks per question type
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-lg">
                Total: {getTotalMarks()} marks
              </span>
              <ChevronDown
                size={20}
                className={`text-white transition-transform duration-300 ${
                  isMarksPanelExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {/* Marks Configuration - Modern Design (Collapsible) */}
          {isMarksPanelExpanded && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg border-2 border-amber-200 p-6 mb-6 animate-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full"></span>
                <span className="text-base">Marks per Question Type</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(QUESTION_TYPE_CONFIG).filter(([type]) => isTypeAllowed(type)).map(([type, config]) => (
                  <div
                    key={type}
                    className="bg-white rounded-xl p-4 border-2 border-amber-200 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${config.color}`}
                        ></span>
                        {config.label.split(" ")[0]}
                      </label>
                      <span className="text-xs text-gray-500 font-medium">
                        {questionSections.find((s) => s.type === type)
                          ?.selectedQuestions.length || 0}{" "}
                        selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={marksPerType[type] || 0}
                        onChange={(e) =>
                          handleMarksChange(type, e.target.value)
                        }
                        className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-gray-800 font-bold text-sm bg-white"
                        placeholder="Marks"
                      />
                      <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                        marks
                      </span>
                    </div>
                    {questionSections.find((s) => s.type === type)
                      ?.selectedQuestions.length > 0 && (
                      <div className="mt-2 text-xs font-semibold text-amber-700">
                        Subtotal:{" "}
                        {(questionSections.find((s) => s.type === type)
                          ?.selectedQuestions.length || 0) *
                          (marksPerType[type] || 0)}{" "}
                        marks
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t-2 border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-800">
                    Total Paper Marks:
                  </span>
                  <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    {getTotalMarks()} marks
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-4">
            {filteredQuestions.length > 0 ? (
              <>
                {filteredQuestions.map((q) => {
                  const sectionType = currentType || normalizeQuestionType(q.type);
                  const isSelected = questionSections
                    .find((p) => p.type === sectionType)
                    ?.selectedQuestions.some(
                      (qItem) => qItem.question_id === q.question_id
                    );
                  const isExpanded = expandedQuestionId === q.question_id;

                  return (
                    <div
                      key={q.question_id}
                      className={`group relative rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                        isSelected
                          ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 shadow-xl shadow-blue-200/50"
                          : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50"
                      }`}
                    >
                      {/* Select button fixed at top-right so it's always visible for long questions */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleQuestionSelection(q);
                        }}
                        className={`absolute top-4 right-4 z-10 px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 flex-shrink-0 ${
                          isSelected
                            ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700"
                            : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                        }`}
                      >
                        {isSelected ? "✓ Selected" : "Select"}
                      </button>
                      <div
                        className="p-5 pr-28 cursor-pointer"
                        onClick={() =>
                          setExpandedQuestionId(
                            isExpanded ? null : q.question_id
                          )
                        }
                      >
                        <div className="flex items-start gap-4">
                          <div className="mt-1 flex-shrink-0">
                            {isSelected ? (
                              <div className="relative">
                                <CheckCircle2
                                  size={24}
                                  className="text-emerald-500 animate-in zoom-in duration-200"
                                />
                                <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-75"></div>
                              </div>
                            ) : (
                              <div className="w-6 h-6 border-2 border-gray-300 rounded-full group-hover:border-blue-400 transition-colors flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-blue-400 transition-colors"></div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="max-h-28 overflow-y-auto overflow-x-hidden pr-2 rounded">
                              <p className="text-gray-800 font-semibold leading-relaxed text-base break-words">
                                {q.question}
                              </p>
                            </div>
                            {(q.answer || q.solution || q.image_url) && (
                              <button className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 group/expand">
                                <span>View details</span>
                                <span
                                  className={`inline-block transition-transform duration-300 ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                >
                                  ▼
                                </span>
                              </button>
                            )}
                            {q.type === "mcq" && q.options && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1.5">
                                {q.options.slice(0, 2).map((option, idx) => (
                                  <p
                                    key={idx}
                                    className="text-sm text-gray-700 font-medium"
                                  >
                                    <span className="font-bold text-blue-600">
                                      {String.fromCharCode(65 + idx)}.
                                    </span>{" "}
                                    {option}
                                  </p>
                                ))}
                                {q.options.length > 2 && (
                                  <p className="text-xs text-gray-500 font-medium pt-1 border-t border-gray-200">
                                    +{q.options.length - 2} more options
                                  </p>
                                )}
                              </div>
                            )}
                            {q.image_url && (
                              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
                                <span className="text-sm">🖼️</span>
                                <span className="text-xs font-semibold">
                                  Has image
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details - Answer, Solution, Images */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-3 border-t-2 border-gray-200/60 bg-gradient-to-br from-gray-50 to-white space-y-4 animate-in slide-in-from-top-2 duration-300">
                          {/* Answer */}
                          {q.answer && (
                            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border-2 border-emerald-200 shadow-sm">
                              <h4 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
                                <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                                Answer
                              </h4>
                              <p className="text-sm text-gray-800 bg-white p-3 rounded-lg border border-emerald-200 font-medium">
                                {q.answer}
                              </p>
                            </div>
                          )}

                          {/* Solution */}
                          {q.solution && (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 shadow-sm">
                              <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                                  <span className="text-white text-xs">💡</span>
                                </div>
                                Solution
                              </h4>
                              <p className="text-sm text-gray-800 bg-white p-3 rounded-lg border border-blue-200 font-medium">
                                {q.solution}
                              </p>
                            </div>
                          )}

                          {/* Image */}
                          {q.image_url && (
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200 shadow-sm">
                              <h4 className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2">
                                <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                                  <span className="text-white text-xs">🖼️</span>
                                </div>
                                Image
                              </h4>
                              <div className="bg-white p-3 rounded-xl border-2 border-purple-200 shadow-inner">
                                <img
                                  src={q.image_url}
                                  alt="Question image"
                                  className="max-w-full h-auto max-h-64 object-contain mx-auto"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* All MCQ Options if expanded */}
                          {q.type === "mcq" && q.options && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-200 shadow-sm">
                              <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                                <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center">
                                  <span className="text-white text-xs">📋</span>
                                </div>
                                All Options
                              </h4>
                              <div className="bg-white p-4 rounded-lg border-2 border-amber-200 space-y-2">
                                {q.options.map((option, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-start gap-2 p-2 hover:bg-amber-50 rounded-lg transition-colors"
                                  >
                                    <span className="font-bold text-amber-600 min-w-[24px]">
                                      {String.fromCharCode(65 + idx)}.
                                    </span>
                                    <p className="text-sm text-gray-700 font-medium flex-1">
                                      {option}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {!q.answer && !q.solution && !q.image_url && (
                            <div className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                              <p className="text-sm text-gray-500 font-medium">
                                No additional details available
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Action Buttons - Modern Design */}
                <div className="mt-6 p-5 bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg shadow-md">
                      <CheckCircle2 size={20} className="text-white" />
                    </div>
                    <div>
                      <span className="text-lg font-bold text-gray-800">
                        {questionSections.find((p) => p.type === currentType)
                          ?.selectedQuestions.length || 0}
                      </span>
                      <span className="text-sm text-gray-600 font-medium ml-1">
                        questions selected
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleClearSelection}
                      className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl text-sm font-bold hover:from-rose-600 hover:to-red-700 transition-all duration-200 shadow-lg shadow-rose-500/30 hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={handleDone}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                      ✓ Done
                    </button>
                  </div>
                </div>
              </>
            ) : approvedSubjectIds.length === 0 ? (
              <div className="text-center py-20 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-dashed border-amber-300">
                <div className="p-4 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <XCircle size={40} className="text-amber-500" />
                </div>
                <p className="text-amber-800 font-semibold text-lg mb-1">
                  No Approved Subjects
                </p>
                <p className="text-amber-700 text-sm mb-4">
                  You need approved subjects to view questions
                </p>
                <button
                  onClick={() => navigate("/dashboard/subject-requests")}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all font-semibold text-sm shadow-md"
                >
                  Request Subjects
                </button>
              </div>
            ) : (
              <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-300">
                <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <Sparkles size={40} className="text-blue-500 animate-pulse" />
                </div>
                <p className="text-gray-600 font-semibold text-lg mb-1">
                  No questions available
                </p>
                <p className="text-gray-500 text-sm">
                  {currentType
                    ? `No ${QUESTION_TYPE_CONFIG[
                        currentType
                      ]?.label.toLowerCase()} found for your approved subjects`
                    : "Select a question type to see available questions"}
                </p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Right Half - Paper Preview */}
        <div
          ref={previewPanelRef}
          className={`${
            smartWizardActive && smartWizardStep === "preview" ? "w-full" : "w-1/2"
          } overflow-y-auto bg-gradient-to-b from-slate-50 to-gray-100/50 p-6 scroll-smooth transition-shadow duration-500 ${
            previewHighlight
              ? "ring-4 ring-indigo-400/80 ring-inset shadow-[inset_0_0_0_2px_rgba(129,140,248,0.5)]"
              : ""
          }`}
        >
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Paper Preview
              </h1>
              <div className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg">
                <span className="text-sm font-semibold">Total: </span>
                <span className="text-lg font-bold">{getTotalMarks()}</span>
                <span className="text-sm font-semibold"> marks</span>
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium">
              Live preview of your exam paper
            </p>
          </div>

          {/*
            Off-screen measurement layer. Renders every selected question at the exact
            page content width so we can read its REAL height (see measuredHeights).
            This is what lets rich-text questions — tables, inline images — paginate
            without being silently cropped by the html2canvas export.
            Not visible, not printed, and excluded from the PDF (it lives outside pagesRef).
          */}
          <div
            ref={measureRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "-99999px",
              top: 0,
              width: `${PAGE_DIMENSIONS.WIDTH - PAGE_DIMENSIONS.CONTENT_PADDING}px`,
              visibility: "hidden",
              pointerEvents: "none",
              zIndex: -1,
            }}
          >
            {allSelectedQuestions.map((q) => (
              <div key={q.question_id} data-measure-qid={q.question_id}>
                <QuestionImageBlock question={q} slot="top" />
                <div className="text-[14px] leading-relaxed">
                  <span style={{ fontSize: "14px", fontWeight: "bold" }}>(1) </span>
                  <QuestionBody question={q} inline={q.type === "passage" ? "lead" : "flow"} />
                </div>
                {q.type === "mcq" && Array.isArray(q.options) && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 ml-6 text-[13px]">
                    {q.options.map((opt, i) => (
                      <div key={i}>
                        <OptionBody question={q} index={i} option={opt} />
                      </div>
                    ))}
                  </div>
                )}
                <QuestionImageBlock question={q} slot="bottom" />
              </div>
            ))}
          </div>

          <div ref={pagesRef} className="space-y-8 flex flex-col items-center">
            {renderPages().map((page, pageIndex) => (
              <div
                id={`pdf-content-${pageIndex}`}
                key={pageIndex}
                className="bg-white rounded-2xl shadow-2xl border-4 border-gray-200 overflow-hidden transform hover:scale-[1.01] transition-transform duration-300"
                style={{ height: "1123px", width: "748px" }}
              >
                <div className="p-8 h-full flex flex-col min-h-0">
                  {pageIndex === 0 && (
                    <div className="mb-6 pb-6 flex-shrink-0">
                      <HeaderCard
                        header={{
                          ...(paperHeader || header),
                          totalMarks: getTotalMarks(),
                          marks: getTotalMarks(),
                        }}
                        disableHover={true}
                        disableStyles
                      />
                    </div>
                  )}

                  <div className="flex-1 min-h-0 overflow-y-auto space-y-6">
                    {page.map((section, sectionIndex) => {
                      const shouldPrintTitle = !printedTypes.has(section.type);
                      // First section with questions = A, second = B, etc. (sequential, not fixed by type)
                      const sectionLetter = shouldPrintTitle
                        ? String.fromCharCode(65 + printedTypes.size)
                        : "";
                      if (shouldPrintTitle) {
                        printedTypes.add(section.type);
                      }

                      const sectionTypeNormalized = normalizeQuestionType(section.type);
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
                                    color: "#2563eb", // Blue color
                                  }}
                                >
                                  {sectionLetter}){" "}
                                  {(() => {
                                    // Language comes from the subject name: prefer the
                                    // section's own questions, else the paper header's
                                    // subject. getQuestionTypeTitle always falls back to
                                    // the full English title (never the short label).
                                    const firstQuestion =
                                      section.selectedQuestions[0];
                                    const subjectName =
                                      (firstQuestion?.subject_id &&
                                        approvedSubjectsMap.get(firstQuestion.subject_id)) ||
                                      (paperHeader || header)?.subject ||
                                      "";
                                    return getQuestionTypeTitle(
                                      sectionTypeNormalized,
                                      null,
                                      subjectName
                                    );
                                  })()}
                                </h3>
                                <span
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: "bold",
                                    color: "#374151",
                                    // Keep "3 marks" on one line — a long section title
                                    // was wrapping it to "3" / "marks" — and keep it
                                    // aligned with the first line of that title.
                                    whiteSpace: "nowrap",
                                    flexShrink: 0,
                                    marginLeft: "12px",
                                    lineHeight: "1.5",
                                  }}
                                >
                                  {formatMarksLabel(sectionMarksFor(sectionTypeNormalized))}
                                </span>
                              </div>
                            </div>
                          )}

                          <div
                            className={
                              getType(section.type)?.layout === "row"
                                ? "flex flex-wrap gap-x-10 gap-y-1"
                                : "space-y-3"
                            }
                          >
                            {/* Synonyms / antonyms: ONE question holds a list of words.
                                Print the words numbered side-by-side, continuing the
                                numbering across questions in the section. */}
                            {getType(section.type)?.layout === "row" &&
                              (() => {
                                let n = 0;
                                return section.selectedQuestions.flatMap((q, qIdx) =>
                                  getWordList(q).map((word, wIdx) => {
                                    n += 1;
                                    return (
                                      <div
                                        key={`${qIdx}-${wIdx}`}
                                        style={{ fontSize: "14px", lineHeight: "1.9" }}
                                      >
                                        <span style={{ fontWeight: "bold" }}>({n}) </span>
                                        <MathText text={word} />
                                      </div>
                                    );
                                  })
                                );
                              })()}

                            {getType(section.type)?.layout !== "row" &&
                              section.selectedQuestions.map(
                              (question, qIndex) => {
                                return (
                                <div key={qIndex} className="mb-4">
                                  <QuestionImageBlock question={question} slot="top" />
                                  <div
                                    className={`flex items-start justify-between gap-4 ${(question.type === "mcq" || question.type === "true_false" || question.type === "truefalse") ? "flex-row" : ""}`}
                                    style={{ lineHeight: "1.7" }}
                                  >
                                    <p
                                      className="text-gray-800 flex-1 min-w-0"
                                      style={{
                                        fontSize: "14px",
                                        fontWeight: "normal",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: "14px",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        ({question.questionNumber}){" "}
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

                                  {question.type === "mcq" &&
                                    question.options && (
                                      <div
                                        className="ml-6 mt-2 grid grid-cols-2 gap-x-6 gap-y-2"
                                        style={{ gridAutoRows: "minmax(1.2em, auto)" }}
                                      >
                                        {question.options.map(
                                          (option, optIndex) => (
                                            <div
                                              key={optIndex}
                                              className="flex gap-1.5 min-w-0 break-words"
                                              style={{
                                                fontSize: "13px",
                                                fontWeight: "normal",
                                                color: "#374151",
                                              }}
                                            >
                                              <span
                                                className="flex-shrink-0"
                                                style={{
                                                  fontSize: "13px",
                                                  fontWeight: "500",
                                                }}
                                              >
                                                (
                                                {String.fromCharCode(
                                                  97 + optIndex
                                                )}
                                                ){" "}
                                              </span>
                                              <span
                                                className="min-w-0 break-words"
                                                style={{
                                                  fontSize: "13px",
                                                  fontWeight: "normal",
                                                }}
                                              >
                                                <OptionBody
                                                  question={question}
                                                  index={optIndex}
                                                  option={option}
                                                />
                                              </span>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}

                                  {/* Passage: show sub-questions (short or MCQ) below the passage text */}
                                  {question.type === "passage" &&
                                    question.options && (() => {
                                      try {
                                        const passageQuestions =
                                          typeof question.options === "string"
                                            ? JSON.parse(question.options)
                                            : question.options;
                                        if (
                                          Array.isArray(passageQuestions) &&
                                          passageQuestions.length > 0
                                        ) {
                                          return (
                                            <div
                                              className="ml-6 mt-3 space-y-3"
                                              style={{
                                                fontSize: "14px",
                                                fontWeight: "normal",
                                                color: "#374151",
                                              }}
                                            >
                                              {passageQuestions.map(
                                                (pq, pqIdx) => {
                                                  const isMcq = pq && pq.type === "mcq";
                                                  const isBlank = pq && pq.type === "blank";
                                                  const isTf = pq && (pq.type === "truefalse" || pq.type === "true&false");
                                                  const questionText =
                                                    typeof pq === "object" && pq !== null && "question" in pq
                                                      ? pq.question
                                                      : String(pq);
                                                  const options =
                                                    isMcq && Array.isArray(pq.options)
                                                      ? pq.options.filter(
                                                          (o) =>
                                                            o != null && String(o).trim() !== ""
                                                        )
                                                      : [];
                                                  return (
                                                    <div key={pqIdx}>
                                                      {pq && pq.question_html ? (
                                                        // Rich ("Word-like") sub-question prompt. Rendered as a flex
                                                        // row so the block HTML never nests inside a <p>.
                                                        <div
                                                          className="text-gray-800"
                                                          style={{
                                                            display: "flex",
                                                            gap: "4px",
                                                            fontSize: "14px",
                                                            lineHeight: "1.7",
                                                          }}
                                                        >
                                                          <span style={{ fontWeight: "600" }}>
                                                            ({String.fromCharCode(97 + pqIdx)})
                                                          </span>
                                                          <div className="rich-body" style={{ flex: 1 }}>
                                                            {renderRichHtml(pq.question_html)}
                                                          </div>
                                                        </div>
                                                      ) : (
                                                      <p
                                                        className="text-gray-800"
                                                        style={{
                                                          fontSize: "14px",
                                                          lineHeight: "1.7",
                                                        }}
                                                      >
                                                        <span
                                                          style={{
                                                            fontWeight: "600",
                                                          }}
                                                        >
                                                          (
                                                          {String.fromCharCode(
                                                            97 + pqIdx
                                                          )}
                                                          ){" "}
                                                        </span>
                                                        <MathText text={questionText} />
                                                      </p>
                                                      )}
                                                      {isMcq &&
                                                        options.length > 0 && (
                                                          <div
                                                            className="ml-4 mt-1 space-y-1"
                                                            style={{
                                                              fontSize: "13px",
                                                            }}
                                                          >
                                                            {options.map(
                                                              (opt, optIdx) => (
                                                                <div
                                                                  key={optIdx}
                                                                  className="flex gap-2"
                                                                >
                                                                  <span
                                                                    style={{
                                                                      fontWeight:
                                                                        "500",
                                                                    }}
                                                                  >
                                                                    (
                                                                    {String.fromCharCode(
                                                                      65 +
                                                                        optIdx
                                                                    )}
                                                                    )
                                                                  </span>
                                                                  <span>
                                                                    <MathText
                                                                      text={
                                                                        typeof opt ===
                                                                        "object"
                                                                          ? opt.text ||
                                                                            opt.label ||
                                                                            JSON.stringify(
                                                                              opt
                                                                            )
                                                                          : opt
                                                                      }
                                                                    />
                                                                  </span>
                                                                </div>
                                                              )
                                                            )}
                                                          </div>
                                                        )}
                                                      {isTf && (
                                                        <div
                                                          className="ml-4 mt-1 flex gap-4"
                                                          style={{ fontSize: "13px" }}
                                                        >
                                                          <span>(T)</span>
                                                          <span>(F)</span>
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                }
                                              )}
                                            </div>
                                          );
                                        }
                                      } catch (e) {
                                        console.error("Error parsing passage questions:", e);
                                      }
                                      return null;
                                    })()}

                                  {/* Match the following: render table (Column A, Column B, Answer) like in template */}
                                  {question.type === "match" &&
                                    question.options && (() => {
                                      try {
                                        const matchData =
                                          typeof question.options === "string"
                                            ? JSON.parse(question.options)
                                            : question.options;
                                        const leftItems = matchData.left || [];
                                        const rightItems = matchData.right || [];
                                        const maxLength = Math.max(
                                          leftItems.length,
                                          rightItems.length
                                        );
                                        // Shuffle the right column so aligned rows don't reveal the answer.
                                        const rightOrder = seededMatchOrder(
                                          rightItems.length,
                                          question.question_id ?? rightItems.join("|")
                                        );
                                        if (
                                          leftItems.length > 0 ||
                                          rightItems.length > 0
                                        ) {
                                          return (
                                            <div className="ml-6 mt-3 overflow-x-auto">
                                              <table
                                                className="w-full border-collapse"
                                                style={{
                                                  fontSize: "14px",
                                                  border: "1px solid #374151",
                                                }}
                                              >
                                                <thead>
                                                  <tr>
                                                    <th
                                                      className="px-3 py-2 text-left font-semibold text-gray-700"
                                                      style={{
                                                        border: "1px solid #374151",
                                                        backgroundColor: "#f3f4f6",
                                                      }}
                                                    >
                                                      A
                                                    </th>
                                                    <th
                                                      className="px-3 py-2 text-left font-semibold text-gray-700"
                                                      style={{
                                                        border: "1px solid #374151",
                                                        backgroundColor: "#f3f4f6",
                                                      }}
                                                    >
                                                      B
                                                    </th>
                                                    <th
                                                      className="px-3 py-2 text-left font-semibold text-gray-700"
                                                      style={{
                                                        border: "1px solid #374151",
                                                        backgroundColor: "#f3f4f6",
                                                      }}
                                                    >
                                                      Answer
                                                    </th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {Array.from({
                                                    length: maxLength,
                                                  }).map((_, idx) => (
                                                    <tr key={idx}>
                                                      <td
                                                        className="px-3 py-2 text-gray-800"
                                                        style={{
                                                          border: "1px solid #374151",
                                                        }}
                                                      >
                                                        {idx + 1}.{" "}
                                                        <MatchItemBody
                                                          question={question}
                                                          side="left"
                                                          index={idx}
                                                          value={leftItems[idx] || ""}
                                                        />
                                                      </td>
                                                      <td
                                                        className="px-3 py-2 text-gray-800"
                                                        style={{
                                                          border: "1px solid #374151",
                                                        }}
                                                      >
                                                        {String.fromCharCode(
                                                          97 + idx
                                                        )}
                                                        .{" "}
                                                        <MatchItemBody
                                                          question={question}
                                                          side="right"
                                                          index={rightOrder[idx] ?? idx}
                                                          value={rightItems[rightOrder[idx]] ?? ""}
                                                        />
                                                      </td>
                                                      <td
                                                        className="px-3 py-2 text-gray-800 font-mono"
                                                        style={{
                                                          border: "1px solid #374151",
                                                        }}
                                                      >
                                                        ({idx + 1}) (_____)
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          );
                                        }
                                      } catch (e) {
                                        console.error(
                                          "Error parsing match data:",
                                          e
                                        );
                                      }
                                      return null;
                                    })()}

                                  <QuestionImageBlock question={question} slot="bottom" />
                                </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}
    </div>
  );
};

export default CustomPaper;
