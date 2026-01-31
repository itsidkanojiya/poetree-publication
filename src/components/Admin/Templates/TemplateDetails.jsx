import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, FileDown, Eye, Save } from "lucide-react";
import { updatePaper } from "../../../services/paperService";
import Toast from "../../Common/Toast";
import Loader from "../../Common/loader/loader";
import downloadPDF from "../../../utils/downloadPdf";
import HeaderCard from "../../Cards/HeaderCard";
// Use CustomPaper's exact pagination logic
import apiClient from "../../../services/apiClient";

const TemplateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [header, setHeader] = useState(null);
  const [templateMetadata, setTemplateMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    fetchTemplateDetails();
  }, [id]);

  // Fetch questions by IDs
  const fetchQuestionsByIds = async (questionIds) => {
    try {
      if (!questionIds || questionIds.length === 0) {
        setQuestions([]);
        return;
      }

      console.log("Fetching questions for IDs:", questionIds);

      // Fetch all questions
      const response = await apiClient.get(`/question`);
      const allQuestions = response.data?.questions || response.data || [];

      console.log("Total questions fetched:", allQuestions.length);

      // Filter questions by IDs and maintain order
      // Try both question_id and id fields for matching
      const fetchedQuestions = questionIds
        .map((id) => {
          const question = allQuestions.find(
            (q) =>
              q.question_id === id ||
              q.id === id ||
              q.question_id === parseInt(id) ||
              q.id === parseInt(id)
          );
          if (!question) {
            console.warn(`Question with ID ${id} not found`);
          }
          return question;
        })
        .filter((q) => q !== undefined); // Remove any undefined (questions not found)

      console.log(
        "Questions found:",
        fetchedQuestions.length,
        "out of",
        questionIds.length
      );

      // Add number property for proper numbering
      const numberedQuestions = fetchedQuestions.map((q, index) => ({
        ...q,
        number: index + 1,
      }));

      setQuestions(numberedQuestions);
    } catch (error) {
      console.error("Error fetching questions by IDs:", error);
      setToast({
        show: true,
        message: "Failed to load questions. Please refresh the page.",
        type: "error",
      });
      setQuestions([]);
    }
  };

  const fetchTemplateDetails = async () => {
    try {
      setLoading(true);
      // Try templates endpoint first, fallback to regular papers endpoint
      let response;
      try {
        response = await apiClient.get(`/papers/templates/${id}`);
      } catch (error) {
        // If template endpoint fails, try regular papers endpoint
        console.log("Template endpoint failed, trying regular papers endpoint");
        response = await apiClient.get(`/papers/${id}`);
      }

      const templateData =
        response?.data?.template ||
        response?.data?.data ||
        response?.data ||
        response;
      setTemplate(templateData);

      console.log("Template data received:", templateData);

      // Parse template_metadata if available
      if (templateData?.template_metadata) {
        try {
          const metadata =
            typeof templateData.template_metadata === "string"
              ? JSON.parse(templateData.template_metadata)
              : templateData.template_metadata;
          setTemplateMetadata(metadata);
        } catch (error) {
          console.error("Error parsing template_metadata:", error);
          setTemplateMetadata(null);
        }
      } else {
        setTemplateMetadata(null);
      }

      // Parse question IDs from body
      let questionIds = [];
      if (templateData?.body) {
        try {
          if (typeof templateData.body === "string") {
            if (templateData.body.trim().startsWith("[")) {
              questionIds = JSON.parse(templateData.body);
            } else {
              // Try to parse anyway
              questionIds = JSON.parse(templateData.body);
            }
          } else if (Array.isArray(templateData.body)) {
            questionIds = templateData.body;
          }
          console.log(
            "Parsed question IDs from body:",
            questionIds,
            "Count:",
            questionIds.length
          );
        } catch (error) {
          console.error("Error parsing question IDs from body:", error);
          console.error("Body content:", templateData.body);
        }
      }

      // Also check if questions array is already populated
      if (
        templateData?.questions &&
        Array.isArray(templateData.questions) &&
        templateData.questions.length > 0
      ) {
        // Use questions from API response if available
        console.log(
          "Using questions from API response:",
          templateData.questions.length
        );
        const numberedQuestions = templateData.questions.map((q, index) => ({
          ...q,
          number: index + 1,
        }));
        setQuestions(numberedQuestions);
      } else if (questionIds.length > 0) {
        // Fetch questions by IDs
        console.log("Fetching questions by IDs, count:", questionIds.length);
        await fetchQuestionsByIds(questionIds);
      } else {
        console.log("No question IDs found in body");
        setQuestions([]);
      }

      // Parse header data - prefer header_id from metadata, then header_data, then create from template data
      if (templateMetadata?.header_id) {
        // If header_id is in metadata, we should fetch header from headers table
        // For now, create header from template data (backend should populate header fields)
        setHeader({
          layoutType: getLayoutType(templateData.standard || 10),
          styleType: "style1",
          schoolName: templateData.school_name || "SCHOOL NAME",
          subject: templateData.subject || "",
          class: templateData.standard
            ? `Standard ${templateData.standard}`
            : "",
          date: templateData.date || new Date().toISOString().split("T")[0],
        });
      } else if (templateData?.header_data) {
        try {
          const headerData =
            typeof templateData.header_data === "string"
              ? JSON.parse(templateData.header_data)
              : templateData.header_data;
          setHeader(headerData);
        } catch (error) {
          console.error("Error parsing header data:", error);
          // Fallback: create header from template data
          setHeader({
            layoutType: getLayoutType(templateData.standard || 10),
            styleType: "style1",
            schoolName: templateData.school_name || "SCHOOL NAME",
            subject: templateData.subject || "",
            class: templateData.standard
              ? `Standard ${templateData.standard}`
              : "",
            date: templateData.date || new Date().toISOString().split("T")[0],
          });
        }
      } else {
        // Create header from template data if header_data not available
        setHeader({
          layoutType: getLayoutType(templateData.standard || 10),
          styleType: "style1",
          schoolName: templateData.school_name || "SCHOOL NAME",
          subject: templateData.subject || "",
          class: templateData.standard
            ? `Standard ${templateData.standard}`
            : "",
          date: templateData.date || new Date().toISOString().split("T")[0],
        });
      }
    } catch (error) {
      console.error("Error fetching template:", error);
      setToast({
        show: true,
        message: "Failed to load template details",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLayoutType = (standard) => {
    if (standard <= 5) return "primary";
    if (standard <= 8) return "middle";
    if (standard <= 10) return "high";
    return "senior";
  };

  // Get question type title from metadata or use default
  const getQuestionTypeTitle = (questionType) => {
    if (templateMetadata?.question_types?.[questionType]?.custom_title) {
      return templateMetadata.question_types[questionType].custom_title;
    }

    // Default titles
    const defaultTitles = {
      mcq: "A) Multiple Choice Questions (MCQs). Tick the correct options.",
      short: "B) Short Answer Questions",
      long: "C) Long Answer Questions",
      blank: "D) Fill in the Blanks",
      onetwo: "E) One or Two Word Answers",
      truefalse: "F) True/False Questions",
      passage: "G) Passage Based Questions",
      match: "H) Match the Following",
    };

    return (
      defaultTitles[questionType] || `${questionType.toUpperCase()} Questions`
    );
  };

  const handleDownloadPDF = () => {
    const pdfPages = document.querySelectorAll("[id^=template-pdf-content-]");
    if (pdfPages.length > 0) {
      downloadPDF(pdfPages);
    } else {
      setToast({
        show: true,
        message: "No content to download",
        type: "error",
      });
    }
  };

  const handleSaveTemplate = async () => {
    if (!template) return;

    try {
      setSaving(true);

      const formData = new FormData();

      // Required fields
      formData.append(
        "user_id",
        template.user_id || JSON.parse(localStorage.getItem("user"))?.id
      );
      formData.append("type", template.type || "default");
      formData.append("is_template", "true");
      formData.append("title", template.title || "");
      // Note: school_name, address, logo are now fetched from user table via user_id
      formData.append("standard", String(template.standard || 0));
      formData.append("subject_id", String(template.subject_id || ""));
      formData.append(
        "subject_title_id",
        String(template.subject_title_id || "")
      );
      formData.append("board_id", String(template.board_id || ""));
      formData.append("subject", template.subject || "NA");
      formData.append("board", template.board || "NA");
      formData.append(
        "date",
        template.date || new Date().toISOString().split("T")[0]
      );
      formData.append(
        "body",
        template.body || JSON.stringify(questions.map((q) => q.question_id))
      );
      formData.append("total_marks", String(template.total_marks || 0));

      // Marks breakdown
      formData.append("marks_mcq", String(template.marks_mcq || 0));
      formData.append("marks_short", String(template.marks_short || 0));
      formData.append("marks_long", String(template.marks_long || 0));
      formData.append("marks_blank", String(template.marks_blank || 0));
      formData.append("marks_onetwo", String(template.marks_onetwo || 0));
      formData.append("marks_truefalse", String(template.marks_truefalse || 0));
      formData.append("marks_passage", String(template.marks_passage || 0));
      formData.append("marks_match", String(template.marks_match || 0));

      // Optional fields
      if (template.timing) formData.append("timing", String(template.timing));

      // Build template_metadata: always ensure proper structure, never null
      let finalTemplateMetadata = null;

      // Start with existing templateMetadata if available
      if (templateMetadata) {
        finalTemplateMetadata = { ...templateMetadata };
      } else if (template.template_metadata) {
        // Parse existing metadata from template
        try {
          finalTemplateMetadata =
            typeof template.template_metadata === "string"
              ? JSON.parse(template.template_metadata)
              : template.template_metadata;
        } catch (error) {
          console.error("Error parsing existing template_metadata:", error);
          finalTemplateMetadata = { question_types: {}, header_id: null };
        }
      } else {
        // Create new metadata structure
        finalTemplateMetadata = { question_types: {}, header_id: null };
      }

      // Ensure question_types exists and clean it up (only include non-empty custom titles)
      if (!finalTemplateMetadata.question_types) {
        finalTemplateMetadata.question_types = {};
      }

      // Clean up question_types to only include entries with non-empty custom titles
      const cleanedQuestionTypes = {};
      Object.keys(finalTemplateMetadata.question_types || {}).forEach(
        (type) => {
          const customTitle =
            finalTemplateMetadata.question_types[type]?.custom_title;
          if (customTitle && customTitle.trim() !== "") {
            cleanedQuestionTypes[type] = {
              custom_title: customTitle.trim(),
            };
          }
        }
      );
      finalTemplateMetadata.question_types = cleanedQuestionTypes;

      // Ensure header_id is set (priority: templateMetadata > template.header_id > header.id)
      if (!finalTemplateMetadata.header_id) {
        if (template.header_id) {
          finalTemplateMetadata.header_id = template.header_id;
        } else if (header?.id) {
          finalTemplateMetadata.header_id = header.id;
        }
      }

      // If still no header_id, try to extract from header_data
      if (!finalTemplateMetadata.header_id && template.header_data) {
        try {
          const headerData =
            typeof template.header_data === "string"
              ? JSON.parse(template.header_data)
              : template.header_data;
          if (headerData.id || headerData.header_id) {
            finalTemplateMetadata.header_id =
              headerData.id || headerData.header_id;
          }
        } catch (error) {
          console.warn("Could not parse header_data for header_id:", error);
        }
      }

      // If still no header_id, try to match header by styleType to INDIAN_HEADERS
      if (!finalTemplateMetadata.header_id && header?.styleType) {
        const INDIAN_HEADERS = [
          { id: 1, styleType: "style1" },
          { id: 2, styleType: "style2" },
        ];
        const matchedHeader = INDIAN_HEADERS.find(
          (h) => h.styleType === header.styleType
        );
        if (matchedHeader) {
          finalTemplateMetadata.header_id = matchedHeader.id;
        }
      }

      // Final fallback: if header_id is still null, set default to 1 (Classic Style)
      if (!finalTemplateMetadata.header_id) {
        console.warn("No header_id found, using default header_id: 1");
        finalTemplateMetadata.header_id = 1;
      }

      // Always send template_metadata - never null
      // Structure: {"question_types": {...}, "header_id": <number>}
      formData.append(
        "template_metadata",
        JSON.stringify(finalTemplateMetadata)
      );

      console.log("Saving template with metadata:", finalTemplateMetadata);

      await updatePaper(template.id, formData);

      setToast({
        show: true,
        message: "Template saved successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error saving template:", error);
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to save template",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const marksMap = {
    mcq: 1,
    blank: 1,
    truefalse: 1,
    onetwo: 2,
    short: 3,
    long: 5,
    passage: 5, // Default marks for passage questions
    match: 5, // Default marks for match questions
    default: 0,
  };

  // Use CustomPaper's pagination logic - simplified and accurate
  const PAGE_DIMENSIONS = {
    HEIGHT: 1123, // A4 height in pixels
    WIDTH: 794,
    MARGIN: 20,
  };

  const COMPONENT_HEIGHTS = {
    HEADER: 240, // HeaderCard real height
    SECTION_TITLE: 40, // Section heading (A), B), C) + marks)
    QUESTION_TEXT: 28, // Single question line height
    OPTION_ROW: 32, // MCQ option row height
    IMAGE: 200, // Image height
    SPACING: 14, // Spacing between questions
    PASSAGE_NESTED: 22, // Height per nested question in passage
    MATCH_TABLE_HEADER: 42, // Match table header (increased for accuracy)
    MATCH_TABLE_ROW: 48, // Match table row height (increased for accuracy)
  };

  // Calculate MCQ options height based on layout
  const getMcqOptionsHeight = (options = []) => {
    if (!Array.isArray(options) || options.length === 0) return 0;

    // Parse options if string
    let opts = options;
    if (typeof options === "string") {
      try {
        opts = JSON.parse(options);
      } catch {
        opts = options.split(",").map((o) => o.trim());
      }
    }

    if (!Array.isArray(opts) || opts.length === 0) return 0;

    // Calculate average option length
    const avgLength =
      opts.reduce((sum, opt) => sum + (String(opt)?.length || 0), 0) /
      opts.length;

    // Determine rows based on option length
    let rows;
    if (avgLength < 20) {
      rows = Math.ceil(opts.length / 4); // 4 columns
    } else if (avgLength < 50) {
      rows = Math.ceil(opts.length / 2); // 2 columns
    } else {
      rows = opts.length; // 1 column
    }

    return rows * COMPONENT_HEIGHTS.OPTION_ROW + 4; // Add small padding
  };

  // Calculate passage question height
  const getPassageQuestionHeight = (question) => {
    let height = COMPONENT_HEIGHTS.QUESTION_TEXT;

    if (question.options) {
      try {
        const passageQuestions =
          typeof question.options === "string"
            ? JSON.parse(question.options)
            : question.options;
        if (Array.isArray(passageQuestions) && passageQuestions.length > 0) {
          height += passageQuestions.length * COMPONENT_HEIGHTS.PASSAGE_NESTED;
          height += 12; // Container padding
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    return height;
  };

  // Calculate match question height
  const getMatchQuestionHeight = (question) => {
    let height = COMPONENT_HEIGHTS.QUESTION_TEXT;
    height += 8; // Question margin bottom

    if (question.options) {
      try {
        const matchData =
          typeof question.options === "string"
            ? JSON.parse(question.options)
            : question.options;
        const leftItems = matchData.left || [];
        const rightItems = matchData.right || [];
        const maxLength = Math.max(leftItems.length, rightItems.length);

        if (maxLength > 0) {
          height += COMPONENT_HEIGHTS.MATCH_TABLE_HEADER;
          height += maxLength * COMPONENT_HEIGHTS.MATCH_TABLE_ROW;
          height += 16; // Container padding (pl-4 mt-2)
          height += 12; // Table margin
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    return height;
  };
  const MIN_QUESTIONS_PER_SECTION = {
    mcq: 2,
    short: 2,
    long: 1,
    blank: 2,
    onetwo: 2,
    truefalse: 2,
    passage: 1,
    match: 1,
  };

  const renderPages = () => {
    const pages = [];
    let currentPage = [];

    // Reduced margins: 30px total (15px top + 15px bottom) instead of 80px
    const PAGE_MARGINS = 30;
    let availableHeight =
      PAGE_DIMENSIONS.HEIGHT - COMPONENT_HEIGHTS.HEADER - PAGE_MARGINS;

    let lastQuestionType = null;

    questions.forEach((question, index) => {
      const isNewSection = question.type !== lastQuestionType;

      /* ----------------------------------
       🟢 SECTION ORPHAN PROTECTIONnow as per 
    ---------------------------------- */
      if (isNewSection) {
        const minCount = MIN_QUESTIONS_PER_SECTION[question.type] || 1;

        // Estimate height for section + minimum questions
        let requiredHeight = COMPONENT_HEIGHTS.SECTION_TITLE;

        for (let i = 0; i < minCount; i++) {
          const nextQ = questions[index + i];
          if (!nextQ || nextQ.type !== question.type) break;

          // More accurate height calculation based on question type
          if (nextQ.type === "passage") {
            requiredHeight += getPassageQuestionHeight(nextQ);
          } else if (nextQ.type === "match") {
            requiredHeight += getMatchQuestionHeight(nextQ);
          } else {
            requiredHeight += COMPONENT_HEIGHTS.QUESTION_TEXT;
            if (nextQ.type === "mcq" && nextQ.options) {
              requiredHeight += getMcqOptionsHeight(nextQ.options);
            }
          }

          if (nextQ.image || nextQ.image_url) {
            requiredHeight += COMPONENT_HEIGHTS.IMAGE + 12;
          }

          requiredHeight += COMPONENT_HEIGHTS.SPACING;
        }

        // 🚨 If not enough space → new page BEFORE section
        if (requiredHeight > availableHeight && currentPage.length > 0) {
          pages.push([...currentPage]);
          currentPage = [];
          availableHeight = PAGE_DIMENSIONS.HEIGHT - PAGE_MARGINS;
        }

        // Push section marker
        currentPage.push({
          __type: "SECTION",
          sectionType: question.type,
        });

        availableHeight -= COMPONENT_HEIGHTS.SECTION_TITLE;
      }

      /* ----------------------------------
       QUESTION HEIGHT - More accurate calculation
    ---------------------------------- */
      // Base question height (single line, not doubled)
      let questionHeight = COMPONENT_HEIGHTS.QUESTION_TEXT;

      // Add spacing only if there are already questions on the page
      if (currentPage.length > 0) {
        questionHeight += COMPONENT_HEIGHTS.SPACING;
      }

      // Add MCQ options height
      if (question.type === "mcq" && question.options) {
        questionHeight += getMcqOptionsHeight(question.options);
      }

      // Add passage question height
      if (question.type === "passage") {
        questionHeight = getPassageQuestionHeight(question);
        if (currentPage.length > 0) {
          questionHeight += COMPONENT_HEIGHTS.SPACING;
        }
      }

      // Add match question height
      if (question.type === "match") {
        questionHeight = getMatchQuestionHeight(question);
        if (currentPage.length > 0) {
          questionHeight += COMPONENT_HEIGHTS.SPACING;
        }
      }

      // Add image height
      if (question.image || question.image_url) {
        questionHeight += COMPONENT_HEIGHTS.IMAGE + 12;
      }

      // If it doesn't fit, start new page
      if (questionHeight > availableHeight && currentPage.length > 0) {
        pages.push([...currentPage]);
        currentPage = [];
        availableHeight = PAGE_DIMENSIONS.HEIGHT - PAGE_MARGINS;

        // If this is a new section, add section marker to new page
        if (isNewSection) {
          currentPage.push({
            __type: "SECTION",
            sectionType: question.type,
          });
          availableHeight -= COMPONENT_HEIGHTS.SECTION_TITLE;
        }

        // Recalculate question height for new page (no spacing needed on first question)
        if (question.type === "passage") {
          questionHeight = getPassageQuestionHeight(question);
        } else if (question.type === "match") {
          questionHeight = getMatchQuestionHeight(question);
        } else {
          questionHeight = COMPONENT_HEIGHTS.QUESTION_TEXT;
          if (question.type === "mcq" && question.options) {
            questionHeight += getMcqOptionsHeight(question.options);
          }
        }

        if (question.image || question.image_url) {
          questionHeight += COMPONENT_HEIGHTS.IMAGE + 12;
        }

        // Check if question still doesn't fit even on new page (should be rare)
        if (questionHeight > availableHeight) {
          console.warn(
            `Question ${
              question.number || question.question_id
            } is taller than available page height`
          );
        }
      }

      currentPage.push(question);
      availableHeight -= questionHeight;
      lastQuestionType = question.type;
    });

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    return pages;
  };

  const questionPages = renderPages();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Template not found</p>
        <button
          onClick={() => navigate("/admin/templates")}
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Templates
        </button>
      </div>
    );
  }

  return (
    <>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin/templates")}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {template.title || "Template Details"}
              </h1>
              <p className="text-gray-600 mt-1">
                Template preview and information
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveTemplate}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader size="sm" className="inline-block text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Template</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FileDown className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Template Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Template Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Subject:</span>
              <p className="font-semibold text-gray-800">{template.subject}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Standard:</span>
              <p className="font-semibold text-gray-800">
                Standard {template.standard}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Board:</span>
              <p className="font-semibold text-gray-800">{template.board}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Total Marks:</span>
              <p className="font-semibold text-gray-800">
                {template.total_marks || 0}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Timing:</span>
              <p className="font-semibold text-gray-800">
                {template.timing || "N/A"} minutes
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Question Count:</span>
              <p className="font-semibold text-gray-800">{questions.length}</p>
            </div>
          </div>
        </div>

        {/* Paper Preview - A4 Format */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Paper Preview (A4 Size)
            </h2>
            <div className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg">
              <span className="text-sm font-semibold">Total: </span>
              <span className="text-lg font-bold">
                {template.total_marks || 0}
              </span>
              <span className="text-sm font-semibold"> marks</span>
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p>No questions in this template</p>
            </div>
          ) : (
            <div className="flex flex-col gap-10 w-full justify-center items-center">
              {questionPages.map((pageQuestions, pageIndex) => (
                <div
                  key={pageIndex}
                  id={`template-pdf-content-${pageIndex}`}
                  className="w-full max-w-[794px] md:h-[1123px] bg-white shadow-lg rounded-lg border relative md:p-2"
                >
                  {/* Header - Only on first page */}
                  {pageIndex === 0 && header && (
                    <HeaderCard
                      header={header}
                      disableHover={true}
                      disableStyles
                      disableNavigation={true}
                    />
                  )}

                  {/* Questions */}
                  <div className="px-2 md:px-2 py-1">
                    <div className="rounded-lg px-2 md:px-2">
                      {(() => {
                        const previousPageLastQuestion =
                          pageIndex > 0
                            ? questionPages[pageIndex - 1][
                                questionPages[pageIndex - 1].length - 1
                              ]
                            : null;

                        // Track question numbers per type (restart from 1 for each type)
                        const questionNumbersByType = {};
                        let lastQuestionType = null;

                        // Initialize counters for all question types from previous pages
                        if (pageIndex > 0) {
                          for (let pIdx = 0; pIdx < pageIndex; pIdx++) {
                            questionPages[pIdx].forEach((item) => {
                              if (item.__type === "SECTION") {
                                // Reset counter when we see a section marker
                                questionNumbersByType[item.sectionType] = 0;
                                lastQuestionType = null;
                              } else if (item.type) {
                                // Increment counter for this question type
                                if (!questionNumbersByType[item.type]) {
                                  questionNumbersByType[item.type] = 0;
                                }
                                questionNumbersByType[item.type]++;
                                lastQuestionType = item.type;
                              }
                            });
                          }
                        }

                        return pageQuestions.reduce((acc, q, index) => {
                          /* -------------------------------
     SECTION HEADING RENDER
  -------------------------------- */
                          if (q.__type === "SECTION") {
                            // Reset counter for this new section type
                            questionNumbersByType[q.sectionType] = 0;
                            lastQuestionType = null;

                            const count = questions.filter(
                              (qq) => qq.type === q.sectionType
                            ).length;
                            const marksPerQuestion =
                              marksMap[q.sectionType] ?? 0;

                            acc.push(
                              <div
                                key={`section-${q.sectionType}-${pageIndex}-${index}`}
                                className="flex justify-between items-center mt-2 mb-2"
                              >
                                <h3 className="text-lg font-bold text-black">
                                  {getQuestionTypeTitle(q.sectionType)}
                                </h3>
                                <span className="text-sm font-medium text-gray-700">
                                  {count * marksPerQuestion} marks
                                </span>
                              </div>
                            );

                            return acc; // ⛔ stop here for section only
                          }

                          // Get question number for this type (increment and use)
                          if (!questionNumbersByType[q.type]) {
                            questionNumbersByType[q.type] = 0;
                          }
                          questionNumbersByType[q.type]++;
                          const questionNumber = questionNumbersByType[q.type];

                          /* -------------------------------
     QUESTION RENDER
  -------------------------------- */
                          acc.push(
                            <div
                              key={q.question_id || `${q.type}-${index}`}
                              className="mb-3"
                            >
                              {/* Passage Questions: Show passage text + nested questions */}
                              {q.type === "passage" ? (
                                <>
                                  <div className="py-0.5 px-1 text-gray-800 mb-2">
                                    <p className="font-medium mb-1">
                                      {questionNumber}. {q.question}
                                    </p>
                                  </div>
                                  {/* Image for passage questions */}
                                  {(q.image_url || q.image) && (
                                    <div className="mb-3 mt-2">
                                      <img
                                        src={
                                          q.image_url ||
                                          (q.image instanceof File
                                            ? URL.createObjectURL(q.image)
                                            : q.image)
                                        }
                                        alt="Passage"
                                        className="max-w-full"
                                        style={{
                                          height: "200px",
                                          width: "auto",
                                          objectFit: "contain",
                                        }}
                                        onError={(e) => {
                                          e.target.style.display = "none";
                                        }}
                                      />
                                    </div>
                                  )}
                                  {q.options &&
                                    (() => {
                                      try {
                                        const passageQuestions =
                                          typeof q.options === "string"
                                            ? JSON.parse(q.options)
                                            : q.options;
                                        if (
                                          Array.isArray(passageQuestions) &&
                                          passageQuestions.length > 0
                                        ) {
                                          return (
                                            <div className="pl-4 mt-2 space-y-1">
                                              {passageQuestions.map(
                                                (pq, pqIdx) => (
                                                  <p
                                                    key={pqIdx}
                                                    className="text-gray-800 py-0.5 text-sm"
                                                  >
                                                    {String.fromCharCode(
                                                      97 + pqIdx
                                                    )}
                                                    . {pq.question || pq}
                                                  </p>
                                                )
                                              )}
                                            </div>
                                          );
                                        }
                                      } catch (e) {
                                        console.error(
                                          "Error parsing passage questions:",
                                          e
                                        );
                                      }
                                      return null;
                                    })()}
                                </>
                              ) : q.type === "match" ? (
                                <>
                                  <p className="cursor-default py-0.5 px-1 text-gray-800 mb-2">
                                    {questionNumber}. {q.question}
                                  </p>
                                  {/* Image for match questions */}
                                  {(q.image_url || q.image) && (
                                    <div className="mb-3 mt-2">
                                      <img
                                        src={
                                          q.image_url ||
                                          (q.image instanceof File
                                            ? URL.createObjectURL(q.image)
                                            : q.image)
                                        }
                                        alt="Match"
                                        className="max-w-full"
                                        style={{
                                          height: "200px",
                                          width: "auto",
                                          objectFit: "contain",
                                        }}
                                        onError={(e) => {
                                          e.target.style.display = "none";
                                        }}
                                      />
                                    </div>
                                  )}
                                  {q.options &&
                                    (() => {
                                      try {
                                        const matchData =
                                          typeof q.options === "string"
                                            ? JSON.parse(q.options)
                                            : q.options;
                                        const leftItems = matchData.left || [];
                                        const rightItems =
                                          matchData.right || [];
                                        const maxLength = Math.max(
                                          leftItems.length,
                                          rightItems.length
                                        );

                                        if (
                                          leftItems.length > 0 ||
                                          rightItems.length > 0
                                        ) {
                                          return (
                                            <div className="pl-4 mt-2">
                                              <table className="w-full border-collapse border border-gray-800 text-sm">
                                                <thead>
                                                  <tr>
                                                    <th className="border border-gray-800 px-3 py-2 bg-gray-100 font-semibold text-gray-700 text-left">
                                                      A
                                                    </th>
                                                    <th className="border border-gray-800 px-3 py-2 bg-gray-100 font-semibold text-gray-700 text-left">
                                                      B
                                                    </th>
                                                    <th className="border border-gray-800 px-3 py-2 bg-gray-100 font-semibold text-gray-700 text-left">
                                                      Answer
                                                    </th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {Array.from({
                                                    length: maxLength,
                                                  }).map((_, idx) => (
                                                    <tr key={idx}>
                                                      <td className="border border-gray-800 px-3 py-2 text-gray-800">
                                                        {idx + 1}.{" "}
                                                        {leftItems[idx] || ""}
                                                      </td>
                                                      <td className="border border-gray-800 px-3 py-2 text-gray-800">
                                                        {String.fromCharCode(
                                                          97 + idx
                                                        )}
                                                        .{" "}
                                                        {rightItems[idx] || ""}
                                                      </td>
                                                      <td className="border border-gray-800 px-3 py-2 text-gray-800">
                                                        <span className="font-mono">
                                                          ({idx + 1}) (_____)
                                                        </span>
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
                                </>
                              ) : (
                                <>
                                  {/* Question Text for non-passage questions */}
                                  <p className="cursor-default py-0.5 px-1 text-gray-800">
                                    {questionNumber}. {q.question}
                                  </p>

                                  {/* Image - Fixed height and width for all question types */}
                                  {(q.image_url || q.image) && (
                                    <div className="mb-3 mt-2">
                                      <img
                                        src={
                                          q.image_url ||
                                          (q.image instanceof File
                                            ? URL.createObjectURL(q.image)
                                            : q.image)
                                        }
                                        alt="Question"
                                        className="max-w-full"
                                        style={{
                                          height: "200px",
                                          width: "auto",
                                          objectFit: "contain",
                                        }}
                                        onError={(e) => {
                                          e.target.style.display = "none";
                                        }}
                                      />
                                    </div>
                                  )}

                                  {/* MCQ OPTIONS */}
                                  {q.type === "mcq" && q.options && (
                                    <ol className="grid grid-cols-2 gap-1 pl-4 text-sm text-gray-600 mt-1">
                                      {(() => {
                                        try {
                                          let optionsArray = [];
                                          if (typeof q.options === "string") {
                                            if (
                                              q.options.trim().startsWith("[")
                                            ) {
                                              optionsArray = JSON.parse(
                                                q.options
                                              );
                                            } else {
                                              optionsArray = q.options
                                                .split(",")
                                                .map((opt) => opt.trim());
                                            }
                                          } else if (Array.isArray(q.options)) {
                                            optionsArray = q.options;
                                          }

                                          // Determine layout based on option length
                                          const avgLength =
                                            optionsArray.reduce(
                                              (sum, opt) =>
                                                sum +
                                                (String(opt)?.length || 0),
                                              0
                                            ) / optionsArray.length;

                                          let gridCols = "grid-cols-4"; // Default: 4 in 1 row
                                          if (avgLength >= 50) {
                                            gridCols = "grid-cols-1"; // Long: 1 in 1 row
                                          } else if (avgLength >= 20) {
                                            gridCols = "grid-cols-2"; // Medium: 2 in 2 rows
                                          }

                                          return (
                                            <ol
                                              className={`grid ${gridCols} gap-1 pl-3 text-gray-600 text-sm mt-1`}
                                            >
                                              {optionsArray.map((option, i) => (
                                                <li
                                                  key={i}
                                                  className="flex items-start"
                                                >
                                                  <span className="font-mono mr-1">
                                                    (
                                                    {String.fromCharCode(
                                                      97 + i
                                                    )}
                                                    )
                                                  </span>
                                                  <span>{option}</span>
                                                </li>
                                              ))}
                                            </ol>
                                          );
                                        } catch (error) {
                                          const optionsArray = String(q.options)
                                            .split(",")
                                            .map((opt) => opt.trim());

                                          const avgLength =
                                            optionsArray.reduce(
                                              (sum, opt) =>
                                                sum +
                                                (String(opt)?.length || 0),
                                              0
                                            ) / optionsArray.length;

                                          let gridCols = "grid-cols-4";
                                          if (avgLength >= 50) {
                                            gridCols = "grid-cols-1";
                                          } else if (avgLength >= 20) {
                                            gridCols = "grid-cols-2";
                                          }

                                          return (
                                            <ol
                                              className={`grid ${gridCols} gap-1 pl-3 text-gray-600 text-sm mt-1`}
                                            >
                                              {optionsArray.map((option, i) => (
                                                <li
                                                  key={i}
                                                  className="flex items-start"
                                                >
                                                  <span className="font-mono mr-1">
                                                    (
                                                    {String.fromCharCode(
                                                      97 + i
                                                    )}
                                                    )
                                                  </span>
                                                  <span>{option}</span>
                                                </li>
                                              ))}
                                            </ol>
                                          );
                                        }
                                      })()}
                                    </ol>
                                  )}
                                </>
                              )}
                            </div>
                          );

                          // Update last question type for next iteration
                          lastQuestionType = q.type;

                          return acc;
                        }, []); // 🔥 DO NOT REMOVE THIS
                        // 🔥 THIS FIXES THE CRASH
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TemplateDetails;
