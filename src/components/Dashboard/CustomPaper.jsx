import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import Button from "../Common/Buttons/Button";
import { savePaper } from "../../utils/savePaper";
import { useAuth } from "../../context/AuthContext";
import usePdfContent from "../../hooks/usePdfContent";
import HeaderCard from "../Cards/HeaderCard";
import apiClient from "../../services/apiClient";
import { getPaperById, updatePaper } from "../../services/paperService";
import Toast from "../Common/Toast";

// Constants
const PAGE_DIMENSIONS = {
  HEIGHT: 1123,
  WIDTH: 748,
  MARGIN: 70,
};

const COMPONENT_HEIGHTS = {
  HEADER: 230,
  QUESTION: 24,
  OPTION: 30,
  IMAGE: 220,
  SECTION: 28,
  SPACING: 16, // Spacing between questions
};

const INITIAL_QUESTION_SECTIONS = [
  { type: "mcq", selectedQuestions: [] },
  { type: "blank", selectedQuestions: [] },
  { type: "short", selectedQuestions: [] },
  { type: "long", selectedQuestions: [] },
];

// Map question types to section letters (A, B, C, D, E)
const SECTION_LETTERS = {
  mcq: "A",
  blank: "B",
  true_false: "C",
  onetwo: "D",
  short: "D",
  long: "E",
};

const QUESTION_TYPE_CONFIG = {
  mcq: {
    label: "Multiple Choice Questions",
    color: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
  },
  short: {
    label: "Short Answer Questions",
    color: "bg-green-500",
    badge: "bg-green-100 text-green-700",
  },
  long: {
    label: "Long Answer Questions",
    color: "bg-purple-500",
    badge: "bg-purple-100 text-purple-700",
  },
  blank: {
    label: "Fill in the Blanks",
    color: "bg-orange-500",
    badge: "bg-orange-100 text-orange-700",
  },
};

// Language-specific question type titles
const titles = {
  mcq: "Multiple Choice Questions (MCQs). Tick the correct options.",
  blanks: "Fill in the blanks in each sentence with an appropriate word.",
  true_false: "Write (T) for True and (F) for False.",
  onetwo: "Answer the following questions in one or two sentences.",
  short: "Short Answer Questions.",
  long: "Long Answer Questions.",
};

const hindiTitles = {
  mcq: "⁠बहुविकल्पीय प्रश्न (MCQs)। सही विकल्पों पर टिक कीजिए।",
  blanks: "⁠प्रत्येक वाक्य में रिक्त स्थानों को एक उपयुक्त शब्द से भरें।",
  true_false: "⁠सत्य के लिए (T) और असत्य के लिए (F) लिखें।",
  onetwo: "⁠निम्नलिखित प्रश्नों के उत्तर एक या दो वाक्यों में दीजिए।",
  short: "⁠लघु उत्तरीय प्रश्न।",
  long: "दीर्घ उत्तरीय प्रश्न।",
};

const gujaratiTitles = {
  mcq: "નીચે આપેલા વિકલ્પોમાંથી યોગ્ય વિકલ્પ પસંદ કરી ખરાં ✓ ની નિશાની કરો.",
  blanks: "યોગ્ય શબ્દ પસંદ કરી ખાલી જગ્યા પૂરો.",
  true_false:
    "ખરાં વાક્ય સામે ખરાં  ✓ અને ખોટાં વાક્ય સામે ખોટાં × ની નિશાની કરો.",
  onetwo: "નીચે આપેલા પ્રશ્નોના બે ત્રણ વાક્યમાં જવાબ લખો. ",
  short: "નીચે આપેલા પ્રશ્નોના જવાબ ટૂંકમાં લખો.",
  long: "નીચે આપેલા પ્રશ્નોના જવાબ વિસ્તારપૂર્વક લખો.",
};

// Function to detect language from subject name
const detectLanguage = (subjectName) => {
  if (!subjectName) return "english";

  // Check for Gujarati script (Unicode range: 0x0A80-0x0AFF)
  if (/[\u0A80-\u0AFF]/.test(subjectName)) {
    return "gujarati";
  }

  // Check for Hindi/Devanagari script (Unicode range: 0x0900-0x097F)
  if (/[\u0900-\u097F]/.test(subjectName)) {
    return "hindi";
  }

  // Default to English for subjects like Mathematics, Science, English, etc.
  // All subjects with English names (no Indic script) default to English
  return "english";
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

// Function to calculate MCQ options height based on layout
const getMcqOptionsHeight = (options) => {
  if (!options || options.length === 0) return 0;

  // Calculate average option length
  const avgLength =
    options.reduce((sum, opt) => sum + (opt?.length || 0), 0) / options.length;

  // Calculate number of rows based on layout
  let rows;
  if (avgLength < 20) {
    // Short options: 4 in 1 row
    rows = Math.ceil(options.length / 4);
  } else if (avgLength < 50) {
    // Medium options: 2x2 grid
    rows = Math.ceil(options.length / 2);
  } else {
    // Long options: 1 by 4 (vertical)
    rows = options.length;
  }

  return rows * COMPONENT_HEIGHTS.OPTION;
};

// Function to get question type title based on language
const getQuestionTypeTitle = (questionType, language, subjectName) => {
  // Determine language if not provided
  const lang = language || detectLanguage(subjectName);

  // Map question types to title keys
  const typeMapping = {
    mcq: "mcq",
    blank: "blanks",
    short: "short",
    long: "long",
  };

  const titleKey = typeMapping[questionType] || questionType;

  // Get appropriate title based on language
  switch (lang) {
    case "gujarati":
      return (
        gujaratiTitles[titleKey] ||
        titles[titleKey] ||
        QUESTION_TYPE_CONFIG[questionType]?.label
      );
    case "hindi":
      return (
        hindiTitles[titleKey] ||
        titles[titleKey] ||
        QUESTION_TYPE_CONFIG[questionType]?.label
      );
    default:
      return titles[titleKey] || QUESTION_TYPE_CONFIG[questionType]?.label;
  }
};

const CustomPaper = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { header, paperId, editMode, paperData: initialPaperData } = location.state || {};
  const divContents = usePdfContent();
  const pagesRef = useRef(null);
  
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
    return storedData ? JSON.parse(storedData) : INITIAL_QUESTION_SECTIONS;
  });
  const [marksPerType, setMarksPerType] = useState(() => {
    const storedMarks = localStorage.getItem("marksPerType");
    return storedMarks
      ? JSON.parse(storedMarks)
      : {
          mcq: 1,
          blank: 1,
          short: 3,
          long: 5,
        };
  });

  // Save to localStorage whenever sections change
  useEffect(() => {
    localStorage.setItem("questionSections", JSON.stringify(questionSections));
  }, [questionSections]);

  // Save marks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("marksPerType", JSON.stringify(marksPerType));
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
            }
            
            // Load marks from paper response first (needed for calculating marks per question)
            const marksData = {
              mcq: paper.marks_mcq || 0,
              short: paper.marks_short || 0,
              long: paper.marks_long || 0,
              blank: paper.marks_blank || 0,
              onetwo: paper.marks_onetwo || 0,
              true_false: paper.marks_truefalse || 0,
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
      // Fetch all questions and filter by IDs
      const response = await apiClient.get(`/question`);
      const allQuestions = response.data?.questions || response.data || [];
      
      // Filter questions by IDs and maintain order
      const fetchedQuestions = questionIds
        .map((id) => allQuestions.find((q) => q.question_id === id))
        .filter((q) => q !== undefined); // Remove any undefined (questions not found)
      
      // Group questions by type and populate questionSections
      const groupedQuestions = {
        mcq: [],
        blank: [],
        short: [],
        long: [],
        onetwo: [],
        true_false: [],
      };
      
      fetchedQuestions.forEach((question) => {
        if (groupedQuestions[question.type]) {
          groupedQuestions[question.type].push(question);
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

  // Fetch questions filtered by approved subjects, board, and subject title from API
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
        // Build query parameters for API
        const params = new URLSearchParams();
        params.append("subject_id", approvedSubjectIds.join(","));

        // Add board filter from header if available
        if (header?.board) {
          params.append("board_id", header.board);
        }

        // Add subject title filter from header if available
        if (header?.subjectTitle) {
          params.append("subject_title_id", header.subjectTitle);
        }

        // Call API with filters
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
  }, [approvedSubjectIds, header?.board, header?.subjectTitle]);

  const handleMarksChange = (type, value) => {
    const numValue = parseFloat(value) || 0;
    if (numValue >= 0) {
      setMarksPerType((prev) => ({
        ...prev,
        [type]: numValue,
      }));
    }
  };

  const getTotalMarks = () => {
    return questionSections.reduce((total, section) => {
      const marks = marksPerType[section.type] || 0;
      return total + section.selectedQuestions.length * marks;
    }, 0);
  };

  const handleTypeSelection = (type) => {
    const filtered = questions.filter((q) => q.type === type);
    setFilteredQuestions(filtered);
    setCurrentType(type);
  };

  const toggleQuestionSelection = (question) => {
    setQuestionSections((prev) => {
      return prev.map((section) => {
        if (section.type === question.type) {
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
      short: 3,
      long: 5,
    });
    localStorage.removeItem("questionSections");
    localStorage.removeItem("marksPerType");
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
        // Get all selected question IDs
        const allQuestionIds = [];
        questionSections.forEach((section) => {
          section.selectedQuestions.forEach((question) => {
            allQuestionIds.push(question.question_id);
          });
        });
        
        // Save paper with question IDs, header data, marks, and question sections
        await savePaper(
          user, 
          allQuestionIds, 
          logoFile, 
          "custom", 
          header,
          marksPerType,
          questionSections,
          header?.documentTitle || null
        );
        setIsSaved(true);
        setToast({
          message: "Paper saved successfully!",
          type: "success",
        });
        
        // Clear selected questions to prevent duplicate saves
        setQuestionSections(INITIAL_QUESTION_SECTIONS);
        localStorage.removeItem("questionSections");
        localStorage.removeItem("marksPerType");
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
    
    // Generate and download PDF
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pages = pagesRef.current.children;
      let promises = [];

      Array.from(pages).forEach((page, index) => {
        let images = Array.from(page.querySelectorAll("img"));
        let loadPromises = images.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) resolve();
              else img.onload = () => resolve();
            })
        );

        let capturePromise = Promise.all(loadPromises).then(() => {
          return html2canvas(page, {
            scale: 1.5,
            useCORS: true,
            ignoreElements: (element) => element.classList.contains("no-print"),
          }).then((canvas) => {
            const imgData = canvas.toDataURL("image/jpeg", 0.7);
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const maxHeight = 297;
            const finalHeight = imgHeight > maxHeight ? maxHeight : imgHeight;

            if (index > 0) pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, 0, imgWidth, finalHeight);
          });
        });

        promises.push(capturePromise);
      });

      await Promise.all(promises);
      pdf.save("exam-paper.pdf");
      
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

  const handleSavePaper = async () => {
    // Prevent duplicate saves
    if (isSaving || isSaved) {
      return;
    }
    
    // Check if there are any questions selected
    const totalQuestions = questionSections.reduce(
      (total, section) => total + section.selectedQuestions.length,
      0
    );
    
    if (totalQuestions === 0) {
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
        
        // Get all selected question IDs
        const allQuestionIds = [];
        questionSections.forEach((section) => {
          section.selectedQuestions.forEach((question) => {
            allQuestionIds.push(question.question_id);
          });
        });
        
        // Add body as JSON string of question IDs (required)
        formData.append("body", JSON.stringify(allQuestionIds));
        
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
          // Add paper_title (documentTitle) if provided (optional)
          if (header.documentTitle) formData.append("paper_title", header.documentTitle);
        }
        
        // Calculate and add marks for each question type
        let marksMcq = 0;
        let marksShort = 0;
        let marksLong = 0;
        let marksBlank = 0;
        let marksOnetwo = 0;
        let marksTruefalse = 0;

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
          }
        });

        formData.append("marks_mcq", marksMcq);
        formData.append("marks_short", marksShort);
        formData.append("marks_long", marksLong);
        formData.append("marks_blank", marksBlank);
        formData.append("marks_onetwo", marksOnetwo);
        formData.append("marks_truefalse", marksTruefalse);
        
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
        // Get all selected question IDs
        const allQuestionIds = [];
        questionSections.forEach((section) => {
          section.selectedQuestions.forEach((question) => {
            allQuestionIds.push(question.question_id);
          });
        });
        
        // Save paper with question IDs, header data, marks, and question sections
        await savePaper(
          user, 
          allQuestionIds, 
          logoFile, 
          "custom", 
          header,
          marksPerType,
          questionSections,
          header?.documentTitle || null
        );
        setIsSaved(true);
        setToast({
          message: "Paper saved successfully!",
          type: "success",
        });
        
        // Clear selected questions to prevent duplicate saves
        setQuestionSections(INITIAL_QUESTION_SECTIONS);
        localStorage.removeItem("questionSections");
        localStorage.removeItem("marksPerType");
        
        // Redirect to history after 1.5 seconds with refresh flag
        setTimeout(() => {
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

  const renderPages = () => {
    let pages = [];
    let currentHeight = PAGE_DIMENSIONS.HEIGHT - COMPONENT_HEIGHTS.HEADER;
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
        let questionHeight = COMPONENT_HEIGHTS.QUESTION;
        if (isFirstQuestionOfType) {
          questionHeight += COMPONENT_HEIGHTS.SECTION;
        }
        if (question.type === "mcq" && Array.isArray(question.options)) {
          questionHeight += getMcqOptionsHeight(question.options);
        }
        if (question.image_url !== null) {
          questionHeight += COMPONENT_HEIGHTS.IMAGE;
        }
        // Add spacing between questions (except for first question on page)
        // Check if there are already questions on the current page
        const hasQuestionsOnPage = currentPage.some(
          (s) => s.selectedQuestions.length > 0
        );
        if (hasQuestionsOnPage) {
          questionHeight += COMPONENT_HEIGHTS.SPACING;
        }

        // Check if question fits on current page (with margin buffer)
        // We need at least MARGIN pixels of space remaining after adding this question
        const availableHeight = currentHeight - PAGE_DIMENSIONS.MARGIN;

        if (questionHeight > availableHeight) {
          // Save current page if it has content
          if (currentPage.length > 0) {
            pages.push([...currentPage]);
          }

          // Start new page
          isFirstPage = false;
          currentPage = [];
          currentHeight = PAGE_DIMENSIONS.HEIGHT; // Full page height for subsequent pages (no header)

          // Recalculate question height for new page (it's now first of its type on this page)
          let newQuestionHeight =
            COMPONENT_HEIGHTS.QUESTION + COMPONENT_HEIGHTS.SECTION;
          if (question.type === "mcq" && Array.isArray(question.options)) {
            newQuestionHeight += getMcqOptionsHeight(question.options);
          }
          if (question.image_url !== null) {
            newQuestionHeight += COMPONENT_HEIGHTS.IMAGE;
          }
          // No spacing needed for first question on new page

          // Add question to new page
          currentPage.push({
            type: question.type,
            selectedQuestions: [question],
          });
          currentHeight = PAGE_DIMENSIONS.HEIGHT - newQuestionHeight;

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

        // Number questions within each section (1, 2, 3...)
        question.questionNumber = questionCounters[question.type]++;
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

  // Show loading state while loading paper data
  if (loadingPaper) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading paper data...</p>
        </div>
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
              onClick={() => navigate(-1)}
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

      {/* Split Screen Layout */}
      <div className="flex h-[calc(100vh-73px)] overflow-hidden">
        {/* Left Half - Question Selection */}
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

          {/* Question Type Selector - Modern Design */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6 hover:shadow-xl transition-all duration-300">
            <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></span>
              Select Question Type
            </label>
            <select
              onChange={(e) => handleTypeSelection(e.target.value)}
              value={currentType}
              disabled={approvedSubjectIds.length === 0}
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800 font-semibold bg-white hover:border-blue-300 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Choose a question type...</option>
              <option value="mcq">Multiple Choice Questions</option>
              <option value="short">Short Answer Questions</option>
              <option value="long">Long Answer Questions</option>
              <option value="blank">Fill in the Blanks</option>
            </select>
            {currentType && (
              <div className="mt-4 animate-in slide-in-from-top-2">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-md ${QUESTION_TYPE_CONFIG[currentType]?.badge}`}
                >
                  <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                  {QUESTION_TYPE_CONFIG[currentType]?.label}
                </span>
              </div>
            )}
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
                {Object.entries(QUESTION_TYPE_CONFIG).map(([type, config]) => (
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
                  const isSelected = questionSections
                    .find((p) => p.type === currentType)
                    ?.selectedQuestions.some(
                      (qItem) => qItem.question_id === q.question_id
                    );
                  const isExpanded = expandedQuestionId === q.question_id;

                  return (
                    <div
                      key={q.question_id}
                      className={`group rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                        isSelected
                          ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 shadow-xl shadow-blue-200/50"
                          : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50"
                      }`}
                    >
                      <div
                        className="p-5 cursor-pointer"
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
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-gray-800 font-semibold leading-relaxed text-base">
                                  {q.question}
                                </p>
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
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleQuestionSelection(q);
                                }}
                                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 ${
                                  isSelected
                                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700"
                                    : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                                }`}
                              >
                                {isSelected ? "✓ Selected" : "Select"}
                              </button>
                            </div>
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

        {/* Right Half - Paper Preview */}
        <div className="w-1/2 overflow-y-auto bg-gradient-to-b from-slate-50 to-gray-100/50 p-6 scroll-smooth">
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

          <div ref={pagesRef} className="space-y-8 flex flex-col items-center">
            {renderPages().map((page, pageIndex) => (
              <div
                id={`pdf-content-${pageIndex}`}
                key={pageIndex}
                className="bg-white rounded-2xl shadow-2xl border-4 border-gray-200 overflow-hidden transform hover:scale-[1.01] transition-transform duration-300"
                style={{ height: "1123px", width: "748px" }}
              >
                <div className="p-8 h-full flex flex-col">
                  {pageIndex === 0 && (
                    <div className="mb-6 pb-6">
                      <HeaderCard
                        header={paperHeader || header}
                        disableHover={true}
                        disableStyles
                      />
                    </div>
                  )}

                  <div className="flex-1 space-y-6">
                    {page.map((section, sectionIndex) => {
                      const shouldPrintTitle = !printedTypes.has(section.type);
                      if (shouldPrintTitle) {
                        printedTypes.add(section.type);
                      }

                      // Get section letter (A, B, C, D, E)
                      const sectionLetter = SECTION_LETTERS[section.type] || "";

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
                                    // Get subject name from first question in section
                                    // This determines the language for the section title
                                    const firstQuestion =
                                      section.selectedQuestions[0];
                                    if (
                                      firstQuestion &&
                                      firstQuestion.subject_id
                                    ) {
                                      const subjectName =
                                        approvedSubjectsMap.get(
                                          firstQuestion.subject_id
                                        );

                                      // Use language-specific title based on subject
                                      // If subject is Mathematics, Science, etc. (English) -> English titles
                                      // If subject is in Gujarati script -> Gujarati titles
                                      // If subject is in Hindi script -> Hindi titles
                                      if (subjectName) {
                                        const title = getQuestionTypeTitle(
                                          section.type,
                                          null,
                                          subjectName
                                        );
                                        // Display title on one line (in a row)
                                        return title;
                                      }
                                    }
                                    // Fallback to English if subject name not available
                                    const defaultTitle =
                                      QUESTION_TYPE_CONFIG[section.type]
                                        ?.label || "";
                                    return defaultTitle;
                                  })()}
                                </h3>
                                <span
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: "bold",
                                    color: "#374151",
                                  }}
                                >
                                  {section.selectedQuestions.length *
                                    (marksPerType[section.type] || 0)}{" "}
                                  marks
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="space-y-3">
                            {section.selectedQuestions.map(
                              (question, qIndex) => (
                                <div key={qIndex} className="mb-4">
                                  <p
                                    className="text-gray-800"
                                    style={{
                                      fontSize: "14px",
                                      fontWeight: "normal",
                                      lineHeight: "1.7",
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
                                    {question.question}
                                  </p>

                                  {question.type === "mcq" &&
                                    question.options && (
                                      <div
                                        className={`ml-6 mt-2 grid ${getMcqLayout(
                                          question.options
                                        )} gap-2`}
                                      >
                                        {question.options.map(
                                          (option, optIndex) => (
                                            <p
                                              key={optIndex}
                                              className="text-gray-700"
                                              style={{
                                                fontSize: "13px",
                                                fontWeight: "normal",
                                              }}
                                            >
                                              <span
                                                style={{
                                                  fontSize: "13px",
                                                  fontWeight: "500",
                                                }}
                                              >
                                                (
                                                {String.fromCharCode(
                                                  97 + optIndex
                                                )}
                                                )
                                              </span>{" "}
                                              <span
                                                style={{
                                                  fontSize: "13px",
                                                  fontWeight: "normal",
                                                }}
                                              >
                                                {option}
                                              </span>
                                            </p>
                                          )
                                        )}
                                      </div>
                                    )}

                                  {question.image_url && (
                                    <div className="mt-3 ml-6">
                                      <img
                                        src={question.image_url}
                                        alt={`Question ${question.questionNumber}`}
                                        className="border border-gray-200 max-h-[200px] w-auto"
                                        style={{ height: "200px" }}
                                      />
                                    </div>
                                  )}
                                </div>
                              )
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
