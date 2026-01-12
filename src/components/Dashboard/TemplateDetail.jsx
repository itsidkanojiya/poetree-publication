import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Eye, Copy, CheckCircle2 } from "lucide-react";
import Toast from "../Common/Toast";
import HeaderCard from "../Cards/HeaderCard";
// Use CustomPaper's exact pagination logic
import apiClient from "../../services/apiClient";

const TemplateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [header, setHeader] = useState(null);
  const [templateMetadata, setTemplateMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);
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

      // Fetch all questions
      const response = await apiClient.get(`/question`);
      const allQuestions = response.data?.questions || response.data || [];

      // Filter questions by IDs and maintain order
      const fetchedQuestions = questionIds
        .map((id) => allQuestions.find((q) => q.question_id === id))
        .filter((q) => q !== undefined);

      // Add number property for proper numbering
      const numberedQuestions = fetchedQuestions.map((q, index) => ({
        ...q,
        number: index + 1,
      }));

      setQuestions(numberedQuestions);
    } catch (error) {
      console.error("Error fetching questions by IDs:", error);
      setQuestions([]);
    }
  };

  const fetchTemplateDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/papers/${id}`);
      const templateData =
        response?.data?.template || response?.data || response;
      setTemplate(templateData);

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
              questionIds = JSON.parse(templateData.body);
            }
          } else if (Array.isArray(templateData.body)) {
            questionIds = templateData.body;
          }
        } catch (error) {
          console.error("Error parsing question IDs from body:", error);
        }
      }

      // Check if questions array is already populated
      if (
        templateData?.questions &&
        Array.isArray(templateData.questions) &&
        templateData.questions.length > 0
      ) {
        const numberedQuestions = templateData.questions.map((q, index) => ({
          ...q,
          number: index + 1,
        }));
        setQuestions(numberedQuestions);
      } else if (questionIds.length > 0) {
        await fetchQuestionsByIds(questionIds);
      } else {
        setQuestions([]);
      }

      // Parse header - prefer header_id from metadata
      if (templateMetadata?.header_id) {
        // Header should be populated from headers table by backend
        // For now, create from template data
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

  const handleCloneTemplate = async () => {
    try {
      setCloning(true);
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.id) {
        setToast({
          show: true,
          message: "Please login to clone templates",
          type: "error",
        });
        return;
      }

      const response = await apiClient.post(`/papers/templates/${id}/clone`, {
        user_id: user.id,
      });

      const clonedPaper = response?.data?.data || response?.data || response;

      setToast({
        show: true,
        message: "Template cloned successfully! Redirecting to editor...",
        type: "success",
      });

      setTimeout(() => {
        navigate(`/dashboard/papers/${clonedPaper.id}/customize`);
      }, 1500);
    } catch (error) {
      console.error("Error cloning template:", error);
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to clone template",
        type: "error",
      });
    } finally {
      setCloning(false);
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
    HEIGHT: 1123, // A4
    WIDTH: 794,
    MARGIN: 20,
  };

  const COMPONENT_HEIGHTS = {
    HEADER: 240, // HeaderCard real height
    SECTION_TITLE: 34, // A), B), C) heading
    QUESTION_TEXT: 26, // single question line
    OPTION_ROW: 30, // MCQ option row (2-column)
    IMAGE: 200,
    SPACING: 12,
  };

  const getMcqOptionsHeight = (options = []) => {
    if (!Array.isArray(options) || options.length === 0) return 0;
    const rows = Math.ceil(options.length / 10);
    return rows * COMPONENT_HEIGHTS.OPTION_ROW;
  };

  const renderPages = () => {
    const pages = [];
    let currentPage = [];
    let currentHeight =
      PAGE_DIMENSIONS.HEIGHT -
      COMPONENT_HEIGHTS.HEADER -
      PAGE_DIMENSIONS.MARGIN;

    let lastQuestionType = null;

    questions.forEach((question) => {
      const isNewSection = question.type !== lastQuestionType;

      // --- calculate question height ---
      let questionHeight = COMPONENT_HEIGHTS.QUESTION_TEXT;

      // spacing
      if (currentPage.length > 0) {
        questionHeight += COMPONENT_HEIGHTS.SPACING;
      }

      // MCQ options
      if (question.type === "mcq" && question.options) {
        try {
          const opts =
            typeof question.options === "string"
              ? JSON.parse(question.options)
              : question.options;
          questionHeight += getMcqOptionsHeight(opts);
        } catch {}
      }

      // image (count once)
      const hasImage = Boolean(question.image_url || question.image);
      if (hasImage) {
        questionHeight += COMPONENT_HEIGHTS.IMAGE;
      }

      // --- BOARD RULE ---
      // If new section → ensure heading + 1 question fit together
      let requiredHeight = questionHeight;
      if (isNewSection) {
        requiredHeight += COMPONENT_HEIGHTS.SECTION_TITLE;
      }

      // If it does NOT fit → start new page
      if (requiredHeight > currentHeight) {
        if (currentPage.length > 0) {
          pages.push([...currentPage]);
        }

        currentPage = [];
        currentHeight = PAGE_DIMENSIONS.HEIGHT - PAGE_DIMENSIONS.MARGIN;
      }

      // add question
      currentPage.push(question);
      currentHeight -= questionHeight;

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Template not found</p>
        <button
          onClick={() => navigate("/dashboard/templates")}
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
              onClick={() => navigate("/dashboard/templates")}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {template.title || "Template Details"}
              </h1>
              <p className="text-gray-600 mt-1">View and clone template</p>
            </div>
          </div>
          <button
            onClick={handleCloneTemplate}
            disabled={cloning}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50"
          >
            {cloning ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Cloning...</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>Clone Template</span>
              </>
            )}
          </button>
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

        {/* Question Type Titles (if custom titles exist) */}
        {templateMetadata?.question_types &&
          Object.keys(templateMetadata.question_types).some(
            (type) => templateMetadata.question_types[type]?.custom_title
          ) && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Question Type Titles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(templateMetadata.question_types).map(
                  ([type, data]) => {
                    if (!data?.custom_title) return null;
                    return (
                      <div key={type} className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-600 uppercase">
                          {type}:
                        </span>
                        <p className="text-gray-800 mt-1">
                          {data.custom_title}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

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

                        return pageQuestions.reduce((acc, q, index) => {
                          const isTypeChanged =
                            index === 0
                              ? previousPageLastQuestion
                                ? q.type !== previousPageLastQuestion.type
                                : true
                              : q.type !== pageQuestions[index - 1].type;

                          if (isTypeChanged) {
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
                                className="flex justify-between items-center mt-1 mb-2"
                              >
                                <h3 className="text-base md:text-lg font-bold mt-1 mb-2 text-black">
                                  {getQuestionTypeTitle(q.type)}
                                </h3>
                                <span className="text-sm font-medium text-gray-700">
                                  Marks: {totalMarks}
                                </span>
                              </div>
                            );
                          }

                          acc.push(
                            <div
                              key={q.question_id || q.number || index}
                              className="mb-3"
                            >
                              {q.type === "passage" ? (
                                <>
                                  <div className="py-0.5 px-1 text-gray-800 mb-2">
                                    <p className="font-medium mb-1">
                                      {q.number || index + 1}. {q.question}
                                    </p>
                                  </div>
                                  {(q.image_url || q.image) && (
                                    <div className="mb-2">
                                      <img
                                        src={q.image_url || q.image}
                                        alt="Passage"
                                        className="border border-gray-200 rounded"
                                        style={{
                                          height: "200px",
                                          width: "auto",
                                          maxWidth: "100%",
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
                                            <div className="pl-3 mt-2">
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
                                    {q.number || index + 1}. {q.question}
                                  </p>
                                  {(q.image_url || q.image) && (
                                    <div className="mb-2">
                                      <img
                                        src={q.image_url || q.image}
                                        alt="Match"
                                        className="border border-gray-200 rounded"
                                        style={{
                                          height: "200px",
                                          width: "auto",
                                          maxWidth: "100%",
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

                                        if (
                                          leftItems.length > 0 ||
                                          rightItems.length > 0
                                        ) {
                                          const maxLength = Math.max(
                                            leftItems.length,
                                            rightItems.length
                                          );
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
                                  <p className="cursor-default py-0.5 px-1 border-b last:border-none text-gray-800">
                                    {q.number || index + 1}. {q.question}
                                  </p>
                                  {(q.image_url || q.image) && (
                                    <div className="mb-2 mt-2">
                                      <img
                                        src={q.image_url || q.image}
                                        alt="Question"
                                        className="border border-gray-200 rounded"
                                        style={{
                                          height: "200px",
                                          width: "auto",
                                          maxWidth: "100%",
                                        }}
                                      />
                                    </div>
                                  )}
                                </>
                              )}
                              {q.type === "mcq" &&
                                q.options &&
                                (() => {
                                  try {
                                    let optionsArray = [];
                                    if (typeof q.options === "string") {
                                      if (q.options.trim().startsWith("[")) {
                                        optionsArray = JSON.parse(q.options);
                                      } else {
                                        optionsArray = q.options
                                          .split(",")
                                          .map((opt) => opt.trim());
                                      }
                                    } else if (Array.isArray(q.options)) {
                                      optionsArray = q.options;
                                    }

                                    return (
                                      <ol className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-5 text-gray-600 text-sm md:text-base mt-2">
                                        {optionsArray.map((option, i) => (
                                          <li
                                            key={i}
                                            className="flex items-start"
                                          >
                                            <span className="font-mono mr-2">
                                              ({String.fromCharCode(65 + i)})
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
                                    return (
                                      <ol className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-5 text-gray-600 text-sm md:text-base mt-2">
                                        {optionsArray.map((option, i) => (
                                          <li
                                            key={i}
                                            className="flex items-start"
                                          >
                                            <span className="font-mono mr-2">
                                              ({String.fromCharCode(65 + i)})
                                            </span>
                                            <span>{option}</span>
                                          </li>
                                        ))}
                                      </ol>
                                    );
                                  }
                                })()}
                              {(q.image_url || q.image) && (
                                <div className="mb-2 mt-2">
                                  <img
                                    src={q.image_url || q.image}
                                    alt="Question"
                                    className="border border-gray-200 rounded"
                                    style={{
                                      height: "200px",
                                      width: "auto",
                                      maxWidth: "100%",
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );

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
      </div>
    </>
  );
};

export default TemplateDetail;
