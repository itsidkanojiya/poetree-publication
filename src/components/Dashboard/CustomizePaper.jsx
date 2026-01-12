import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Save, X, Plus, Eye } from "lucide-react";
import { getPaperById, updatePaper } from "../../services/paperService";
import { getQuestionsByType } from "../../services/adminService";
import Toast from "../Common/Toast";
import HeaderCard from "../Cards/HeaderCard";
// Use CustomPaper's exact pagination logic
import apiClient from "../../services/apiClient";

const CustomizePaper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [header, setHeader] = useState(null);
  const [templateMetadata, setTemplateMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [replacing, setReplacing] = useState(null);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [currentQuestionType, setCurrentQuestionType] = useState("mcq");
  const [availableQuestions, setAvailableQuestions] = useState({});
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPaperDetails();
  }, [id]);

  useEffect(() => {
    if (currentQuestionType && showQuestionSelector) {
      fetchQuestionsByType();
    }
  }, [currentQuestionType, showQuestionSelector]);

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
        .filter((q) => q !== undefined);

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
        position: index + 1,
      }));

      setQuestions(numberedQuestions);
    } catch (error) {
      console.error("Error fetching questions by IDs:", error);
      setQuestions([]);
    }
  };

  const fetchPaperDetails = async () => {
    try {
      setLoading(true);
      const response = await getPaperById(id);
      const paperData = response?.paper || response?.data || response;
      setPaper(paperData);

      console.log("Paper data received:", paperData);

      // Parse template_metadata if available
      if (paperData?.template_metadata) {
        try {
          const metadata =
            typeof paperData.template_metadata === "string"
              ? JSON.parse(paperData.template_metadata)
              : paperData.template_metadata;
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
      if (paperData?.body) {
        try {
          if (typeof paperData.body === "string") {
            if (paperData.body.trim().startsWith("[")) {
              questionIds = JSON.parse(paperData.body);
            } else {
              questionIds = JSON.parse(paperData.body);
            }
          } else if (Array.isArray(paperData.body)) {
            questionIds = paperData.body;
          }
          console.log(
            "Parsed question IDs from body:",
            questionIds,
            "Count:",
            questionIds.length
          );
        } catch (error) {
          console.error("Error parsing question IDs from body:", error);
        }
      }

      // Fetch questions by IDs
      if (questionIds.length > 0) {
        await fetchQuestionsByIds(questionIds);
      } else {
        setQuestions([]);
      }

      // Parse header - prefer header_id from metadata
      const getLayoutType = (standard) => {
        if (standard <= 5) return "primary";
        if (standard <= 8) return "middle";
        if (standard <= 10) return "high";
        return "senior";
      };

      if (templateMetadata?.header_id) {
        // Map header_id to header style
        const headerMap = {
          1: { layoutType: "primary", styleType: "style1" },
          2: { layoutType: "middle", styleType: "style2" },
          3: { layoutType: "high", styleType: "style3" },
          4: { layoutType: "senior", styleType: "style4" },
        };
        const headerStyle =
          headerMap[templateMetadata.header_id] || headerMap[1];
        setHeader({
          ...headerStyle,
          schoolName: paperData.school_name || "SCHOOL NAME",
          subject: paperData.subject || "",
          class: paperData.standard ? `Standard ${paperData.standard}` : "",
          date: paperData.date || new Date().toISOString().split("T")[0],
        });
      } else if (paperData?.header_data) {
        try {
          const headerData =
            typeof paperData.header_data === "string"
              ? JSON.parse(paperData.header_data)
              : paperData.header_data;
          setHeader(headerData);
        } catch (error) {
          console.error("Error parsing header data:", error);
          setHeader({
            layoutType: getLayoutType(paperData.standard || 10),
            styleType: "style1",
            schoolName: paperData.school_name || "SCHOOL NAME",
            subject: paperData.subject || "",
            class: paperData.standard ? `Standard ${paperData.standard}` : "",
            date: paperData.date || new Date().toISOString().split("T")[0],
          });
        }
      } else {
        setHeader({
          layoutType: getLayoutType(paperData.standard || 10),
          styleType: "style1",
          schoolName: paperData.school_name || "SCHOOL NAME",
          subject: paperData.subject || "",
          class: paperData.standard ? `Standard ${paperData.standard}` : "",
          date: paperData.date || new Date().toISOString().split("T")[0],
        });
      }
    } catch (error) {
      console.error("Error fetching paper:", error);
      setToast({
        show: true,
        message: "Failed to load paper",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionsByType = async () => {
    try {
      if (!availableQuestions[currentQuestionType]) {
        const questionsData = await getQuestionsByType(currentQuestionType);
        const questionsArray = Array.isArray(questionsData)
          ? questionsData
          : questionsData?.questions || questionsData?.data || [];
        setAvailableQuestions((prev) => ({
          ...prev,
          [currentQuestionType]: questionsArray,
        }));
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  };

  // Get question type title from metadata or use default
  const getQuestionTypeTitle = (questionType) => {
    if (templateMetadata?.question_types?.[questionType]?.custom_title) {
      return templateMetadata.question_types[questionType].custom_title;
    }

    // Default titles
    const defaultTitles = {
      mcq: "A) Multiple Choice Questions",
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

  const handleReplaceQuestion = (position) => {
    // Get the question type of the question being replaced
    const questionToReplace = questions.find(
      (q) => q.position === position || q.number === position
    );
    if (questionToReplace?.type) {
      setCurrentQuestionType(questionToReplace.type);
    }
    setReplacing(position);
    setShowQuestionSelector(true);
  };

  const handleSelectQuestion = async (questionId) => {
    try {
      setShowQuestionSelector(false);

      // Update local state only (no API call)
      const bodyArray = JSON.parse(paper.body || "[]");
      bodyArray[replacing - 1] = questionId;

      setPaper((prev) => ({
        ...prev,
        body: JSON.stringify(bodyArray),
      }));

      // Fetch the new question details
      const response = await apiClient.get(`/question`);
      const allQuestions = response.data?.questions || response.data || [];
      const selectedQuestion = allQuestions.find(
        (q) =>
          q.question_id === questionId ||
          q.id === questionId ||
          q.question_id === parseInt(questionId) ||
          q.id === parseInt(questionId)
      );

      if (selectedQuestion) {
        setQuestions((prev) =>
          prev.map((q) =>
            q.position === replacing || q.number === replacing
              ? {
                  ...selectedQuestion,
                  number: replacing,
                  position: replacing,
                }
              : q
          )
        );
      }

      setHasChanges(true);
      setToast({
        show: true,
        message: "Question replaced. Click 'Update Paper' to save changes.",
        type: "success",
      });

      setReplacing(null);
    } catch (error) {
      setShowQuestionSelector(true);
      setToast({
        show: true,
        message: "Failed to replace question. Please try again.",
        type: "error",
      });
    }
  };

  const handleUpdatePaper = async () => {
    try {
      setSaving(true);

      // Get current question IDs from state
      const questionIds = questions
        .map((q) => q.question_id || q.id)
        .filter((id) => id);

      // Create FormData for update
      const formData = new FormData();
      formData.append("body", JSON.stringify(questionIds));

      // Add other paper fields if they exist
      // Note: school_name, address, logo are now fetched from user table via user_id
      if (paper.subject) formData.append("subject", paper.subject);
      if (paper.standard) formData.append("standard", paper.standard);
      if (paper.board) formData.append("board", paper.board);
      if (paper.date) formData.append("date", paper.date);
      if (paper.timing) formData.append("timing", paper.timing);
      if (paper.division) formData.append("division", paper.division);
      if (paper.subject_title_id)
        formData.append("subject_title_id", paper.subject_title_id);
      // Add paper_title if provided (optional)
      if (paper.paper_title) formData.append("paper_title", paper.paper_title);

      // Add marks if available
      if (paper.marks_mcq !== undefined)
        formData.append("marks_mcq", paper.marks_mcq);
      if (paper.marks_short !== undefined)
        formData.append("marks_short", paper.marks_short);
      if (paper.marks_long !== undefined)
        formData.append("marks_long", paper.marks_long);
      if (paper.marks_blank !== undefined)
        formData.append("marks_blank", paper.marks_blank);
      if (paper.marks_onetwo !== undefined)
        formData.append("marks_onetwo", paper.marks_onetwo);
      if (paper.marks_truefalse !== undefined)
        formData.append("marks_truefalse", paper.marks_truefalse);
      if (paper.total_marks !== undefined)
        formData.append("total_marks", paper.total_marks);

      // Add template_metadata if it exists
      if (templateMetadata) {
        formData.append("template_metadata", JSON.stringify(templateMetadata));
      }

      await updatePaper(id, formData);

      setHasChanges(false);
      setToast({
        show: true,
        message: "Paper updated successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating paper:", error);
      setToast({
        show: true,
        message:
          error.response?.data?.message ||
          "Failed to update paper. Please try again.",
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

  // Use CustomPaper's pagination logic with reduced margin for better space utilization
  const PAGE_DIMENSIONS = {
    HEIGHT: 1123,
    WIDTH: 748,
    MARGIN: 15, // Reduced from 70px to allow multiple question types on same page
  };

  const COMPONENT_HEIGHTS = {
    HEADER: Math.floor(1123 * 0.21),
    QUESTION: 24,
    OPTION: 30,
    IMAGE: 200, // Fixed height for images (matches display height)
    SECTION: 28,
    SPACING: 16,
  };

  const getMcqOptionsHeight = (options) => {
    if (!options || options.length === 0) return 0;
    const avgLength =
      options.reduce((sum, opt) => sum + (opt?.length || 0), 0) /
      options.length;
    let rows;
    if (avgLength < 20) {
      rows = Math.ceil(options.length / 4);
    } else if (avgLength < 50) {
      rows = Math.ceil(options.length / 2);
    } else {
      rows = options.length;
    }
    return rows * COMPONENT_HEIGHTS.OPTION;
  };

  const renderPages = () => {
    let pages = [];
    let currentHeight = PAGE_DIMENSIONS.HEIGHT - COMPONENT_HEIGHTS.HEADER;
    let currentPage = [];
    let isFirstPage = true;

    questions.forEach((question) => {
      const isFirstQuestionOfType = !currentPage.some(
        (q) => q.type === question.type
      );
      let questionHeight = COMPONENT_HEIGHTS.QUESTION;
      if (isFirstQuestionOfType) {
        questionHeight += COMPONENT_HEIGHTS.SECTION;
      }
      if (question.type === "mcq" && question.options) {
        try {
          const options =
            typeof question.options === "string"
              ? JSON.parse(question.options)
              : question.options;
          if (Array.isArray(options) && options.length > 0) {
            questionHeight += getMcqOptionsHeight(options);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
      // Check for images in all question types (both image_url and image fields)
      if (
        (question.image_url !== null &&
          question.image_url !== undefined &&
          question.image_url !== "") ||
        (question.image !== null &&
          question.image !== undefined &&
          question.image !== "")
      ) {
        questionHeight += COMPONENT_HEIGHTS.IMAGE;
      }
      const hasQuestionsOnPage = currentPage.length > 0;
      if (hasQuestionsOnPage) {
        questionHeight += COMPONENT_HEIGHTS.SPACING;
      }

      const availableHeight = currentHeight - PAGE_DIMENSIONS.MARGIN;

      if (questionHeight > availableHeight) {
        if (currentPage.length > 0) {
          pages.push([...currentPage]);
        }
        isFirstPage = false;
        currentPage = [];
        currentHeight = PAGE_DIMENSIONS.HEIGHT;
        let newQuestionHeight =
          COMPONENT_HEIGHTS.QUESTION + COMPONENT_HEIGHTS.SECTION;
        if (question.type === "mcq" && question.options) {
          try {
            const options =
              typeof question.options === "string"
                ? JSON.parse(question.options)
                : question.options;
            if (Array.isArray(options) && options.length > 0) {
              newQuestionHeight += getMcqOptionsHeight(options);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
        // Check for images in all question types (both image_url and image fields)
        if (
          (question.image_url !== null &&
            question.image_url !== undefined &&
            question.image_url !== "") ||
          (question.image !== null &&
            question.image !== undefined &&
            question.image !== "")
        ) {
          newQuestionHeight += COMPONENT_HEIGHTS.IMAGE;
        }
        currentPage.push(question);
        currentHeight = PAGE_DIMENSIONS.HEIGHT - newQuestionHeight;
        if (currentHeight < 0) {
          currentHeight = 0;
        }
      } else {
        currentPage.push(question);
        currentHeight -= questionHeight;
      }
    });

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    return pages.length > 0 ? pages : [[]];
  };

  const questionPages = renderPages();

  if (loading && !paper) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Paper not found</p>
        <button
          onClick={() => navigate("/dashboard/papers")}
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Papers
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
              onClick={() => navigate("/dashboard/papers")}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Customize Paper
              </h1>
              <p className="text-gray-600 mt-1">
                Click on questions to replace them
              </p>
            </div>
          </div>
          <button
            onClick={handleUpdatePaper}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Update Paper</span>
              </>
            )}
          </button>
        </div>

        {/* Paper Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Paper Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Title:</span>
              <p className="font-semibold text-gray-800">
                {paper.title || "Untitled"}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Subject:</span>
              <p className="font-semibold text-gray-800">{paper.subject}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Standard:</span>
              <p className="font-semibold text-gray-800">
                Standard {paper.standard}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Total Marks:</span>
              <p className="font-semibold text-gray-800">
                {paper.total_marks || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Paper Preview - A4 Format */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Paper Preview (A4 Size) - Click questions to replace
            </h2>
            <div className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg">
              <span className="text-sm font-semibold">Total: </span>
              <span className="text-lg font-bold">
                {paper.total_marks || 0}
              </span>
              <span className="text-sm font-semibold"> marks</span>
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No questions in this paper</p>
            </div>
          ) : (
            <div className="flex flex-col gap-10 w-full justify-center items-center">
              {questionPages.map((pageQuestions, pageIndex) => (
                <div
                  key={pageIndex}
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
                          const isTypeChanged =
                            index === 0
                              ? previousPageLastQuestion
                                ? q.type !== previousPageLastQuestion.type
                                : true
                              : q.type !== pageQuestions[index - 1].type;

                          if (isTypeChanged) {
                            // Reset counter for this new section type
                            questionNumbersByType[q.type] = 0;
                            lastQuestionType = null;

                            const allQuestionsOfType = questions.filter(
                              (qq) => qq.type === q.type
                            );
                            const count = allQuestionsOfType.length;
                            const marksPerQuestion =
                              marksMap[q.type] ?? marksMap.default;
                            const totalMarks = count * marksPerQuestion;

                            acc.push(
                              <div
                                key={`heading-${q.type}-${pageIndex}-${index}`}
                                className="flex justify-between items-center mt-2 mb-2"
                              >
                                <h3 className="text-lg font-bold text-black">
                                  {getQuestionTypeTitle(q.type)}
                                </h3>
                                <span className="text-sm font-medium text-gray-700">
                                  {totalMarks} marks
                                </span>
                              </div>
                            );
                          }

                          // Get question number for this type (increment and use)
                          if (!questionNumbersByType[q.type]) {
                            questionNumbersByType[q.type] = 0;
                          }
                          questionNumbersByType[q.type]++;
                          const questionNumber = questionNumbersByType[q.type];

                          acc.push(
                            <div
                              key={q.question_id || `${q.type}-${index}`}
                              className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 border-2 border-transparent rounded-lg p-2 transition-all group mb-3"
                              onClick={() =>
                                handleReplaceQuestion(
                                  q.position || q.number || index + 1
                                )
                              }
                            >
                              {/* Passage Questions: Show passage text + nested questions */}
                              {q.type === "passage" ? (
                                <>
                                  <div className="py-0.5 px-1 text-gray-800 mb-2 group-hover:text-blue-700">
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
                                  <p className="cursor-default py-0.5 px-1 text-gray-800 mb-2 group-hover:text-blue-700">
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
                                  <p className="cursor-default py-0.5 px-1 text-gray-800 group-hover:text-blue-700">
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
                                  {q.type === "mcq" &&
                                    q.options &&
                                    (() => {
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
                                              sum + (String(opt)?.length || 0),
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
                                                  ({String.fromCharCode(97 + i)}
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
                                              sum + (String(opt)?.length || 0),
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
                                                  ({String.fromCharCode(97 + i)}
                                                  )
                                                </span>
                                                <span>{option}</span>
                                              </li>
                                            ))}
                                          </ol>
                                        );
                                      }
                                    })()}
                                </>
                              )}
                              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition">
                                <Edit className="w-3 h-3" />
                                <span>Click to replace this question</span>
                              </div>
                            </div>
                          );

                          // Update last question type for next iteration
                          lastQuestionType = q.type;

                          return acc;
                        }, []);
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Question Selector Modal */}
        {showQuestionSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">
                  Select Question to Replace Q{replacing}
                </h3>
                <button
                  onClick={() => {
                    setShowQuestionSelector(false);
                    setReplacing(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <select
                  value={currentQuestionType}
                  onChange={(e) => setCurrentQuestionType(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg"
                >
                  <option value="mcq">MCQ</option>
                  <option value="short">Short Answer</option>
                  <option value="long">Long Answer</option>
                  <option value="blank">Fill in Blank</option>
                  <option value="onetwo">One Two</option>
                  <option value="truefalse">True/False</option>
                  <option value="passage">Passage</option>
                  <option value="match">Match</option>
                </select>
              </div>

              {!availableQuestions[currentQuestionType] ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading questions...</p>
                </div>
              ) : availableQuestions[currentQuestionType]?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No {currentQuestionType} questions available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableQuestions[currentQuestionType]?.map((q) => (
                    <div
                      key={q.question_id}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => handleSelectQuestion(q.question_id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-gray-800 font-medium group-hover:text-blue-700 transition mb-2">
                            {q.question}
                          </p>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              {q.type}
                            </span>
                            <span className="text-gray-600">
                              {q.marks} marks
                            </span>
                            {q.answer && (
                              <span className="text-gray-500 italic">
                                Has answer
                              </span>
                            )}
                          </div>
                          {q.type === "mcq" && q.options && (
                            <div className="mt-2 text-xs text-gray-600">
                              Options:{" "}
                              {typeof q.options === "string"
                                ? q.options.substring(0, 50) + "..."
                                : "Available"}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectQuestion(q.question_id);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex-shrink-0"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CustomizePaper;
