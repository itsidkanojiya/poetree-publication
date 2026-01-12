import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Eye,
  Check,
  FileText,
} from "lucide-react";
import { createTemplate } from "../../../services/adminService";
import {
  getAllSubjects,
  getAllBoards,
  getAllSubjectTitles,
  getQuestionsByType,
} from "../../../services/adminService";
import { getProfile } from "../../../services/authService";
import Toast from "../../Common/Toast";
import HeaderCard from "../../Cards/HeaderCard";
// Use CustomPaper's exact pagination logic
import QuestionTypeTitleEditor from "./QuestionTypeTitleEditor";

// 2 Indian-style paper headers
const INDIAN_HEADERS = [
  {
    id: 1,
    layoutType: "primary",
    styleType: "style1",
    schoolName: "SCHOOL NAME",
    address: "",
    studentName: "",
    class: "",
    subject: "",
    date: "",
    image: "",
    name: "Classic Style",
    description: "Traditional double border design for primary classes (1-5)",
  },
  {
    id: 2,
    layoutType: "middle",
    styleType: "style2",
    schoolName: "SCHOOL NAME",
    address: "",
    contact: "",
    documentTitle: "",
    class: "",
    studentName: "",
    rollNo: "",
    section: "",
    subject: "",
    date: "",
    image: "",
    name: "Modern Style",
    description: "Clean gradient design for middle classes (6-8)",
  },
];

const STEPS = [
  { id: 1, name: "Basic Information", description: "Fill in template details" },
  { id: 2, name: "Header Selection", description: "Choose paper header style" },
  {
    id: 3,
    name: "Questions & Marks",
    description: "Select questions and set marks",
  },
  {
    id: 4,
    name: "Question Titles",
    description: "Customize question type titles (optional)",
  },
  { id: 5, name: "Preview", description: "Review template before creating" },
];

const CreateTemplate = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [subjects, setSubjects] = useState([]);
  const [subjectTitles, setSubjectTitles] = useState([]);
  const [boards, setBoards] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState({});
  const [selectedHeader, setSelectedHeader] = useState(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState(new Set());
  const [currentQuestionType, setCurrentQuestionType] = useState("mcq");

  const [formData, setFormData] = useState({
    title: "",
    // Note: school_name, address, logo are now fetched from user table via user_id
    standard: "",
    subject_id: "",
    subject_title_id: "",
    board_id: "",
    total_marks: "",
    marks_mcq: "",
    marks_short: "",
    marks_long: "",
    marks_blank: "",
    marks_onetwo: "",
    marks_truefalse: "",
    marks_passage: "",
    marks_match: "",
    timing: "",
    body: "[]",
  });

  // Template metadata state
  const [templateMetadata, setTemplateMetadata] = useState({
    question_types: {
      mcq: { custom_title: "" },
      short: { custom_title: "" },
      long: { custom_title: "" },
      blank: { custom_title: "" },
      onetwo: { custom_title: "" },
      truefalse: { custom_title: "" },
      passage: { custom_title: "" },
      match: { custom_title: "" },
    },
    header_id: null,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.subject_id) {
      fetchSubjectTitles();
    }
  }, [formData.subject_id]);

  useEffect(() => {
    if (currentQuestionType) {
      fetchQuestionsByType();
    }
  }, [currentQuestionType]);

  const fetchInitialData = async () => {
    try {
      const [subjectsData, boardsData] = await Promise.all([
        getAllSubjects(),
        getAllBoards(),
      ]);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      setBoards(Array.isArray(boardsData) ? boardsData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchSubjectTitles = async () => {
    try {
      const titlesData = await getAllSubjectTitles();
      const allTitles = Array.isArray(titlesData) ? titlesData : [];
      const filtered = allTitles.filter(
        (st) => st.subject_id === parseInt(formData.subject_id)
      );
      setSubjectTitles(filtered);
    } catch (error) {
      console.error("Error fetching subject titles:", error);
    }
  };

  const fetchQuestionsByType = async () => {
    try {
      if (!availableQuestions[currentQuestionType]) {
        const questions = await getQuestionsByType(currentQuestionType);
        const questionsArray = Array.isArray(questions)
          ? questions
          : questions?.questions || questions?.data || [];
        setAvailableQuestions((prev) => ({
          ...prev,
          [currentQuestionType]: questionsArray,
        }));
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuestionToggle = (questionId) => {
    if (!questionId) {
      console.error("Invalid questionId:", questionId);
      return;
    }
    setSelectedQuestionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      console.log("Selected question IDs:", Array.from(newSet));
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const currentQuestions = availableQuestions[currentQuestionType] || [];
    const allIds = currentQuestions
      .map((q) => q.question_id || q.id)
      .filter((id) => id !== undefined && id !== null);
    console.log("Selecting all question IDs:", allIds);
    if (allIds.length === 0) {
      console.warn("No valid question IDs found in current questions");
    }
    setSelectedQuestionIds(new Set(allIds));
  };

  const handleDeselectAll = () => {
    setSelectedQuestionIds(new Set());
  };

  const getSelectedQuestions = () => {
    const allQuestions = Object.values(availableQuestions).flat();
    const filtered = allQuestions.filter((q) => {
      const questionId = q.question_id || q.id;
      return questionId && selectedQuestionIds.has(questionId);
    });
    // Add number property for proper numbering in preview
    return filtered.map((q, index) => ({
      ...q,
      number: index + 1,
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (
          !formData.subject_id ||
          !formData.subject_title_id ||
          !formData.board_id ||
          !formData.standard ||
          !formData.title
        ) {
          setToast({
            show: true,
            message: "Please fill all required fields",
            type: "error",
          });
          return false;
        }
        return true;
      case 2:
        if (!selectedHeader) {
          setToast({
            show: true,
            message: "Please select a paper header",
            type: "error",
          });
          return false;
        }
        return true;
      case 3:
        if (selectedQuestionIds.size === 0) {
          setToast({
            show: true,
            message: "Please select at least one question",
            type: "error",
          });
          return false;
        }
        return true;
      case 4:
        // Preview step - no validation needed, just show preview
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length + 1)); // +1 for preview step
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(3)) {
      return;
    }

    // Get selected questions with proper numbering (declare outside try for error handling)
    const selectedQuestions = getSelectedQuestions();

    try {
      setLoading(true);

      const selectedSubject = subjects.find(
        (s) => s.subject_id === parseInt(formData.subject_id)
      );
      const selectedBoard = boards.find(
        (b) => b.board_id === parseInt(formData.board_id)
      );
      const currentDate = new Date().toISOString().split("T")[0];

      const headerData = {
        ...selectedHeader,
        // Note: schoolName will be fetched from user table via user_id
        subject: selectedSubject?.subject_name || "NA",
        class: `Standard ${formData.standard}`,
        date: currentDate,
      };

      if (selectedQuestions.length === 0) {
        setToast({
          show: true,
          message:
            "No valid questions selected. Please select questions again.",
          type: "error",
        });
        setLoading(false);
        return;
      }

      // Convert questions to IDs array
      const questionIdsArray = selectedQuestions
        .map((q) => q.question_id || q.id)
        .filter((id) => id !== null && id !== undefined);

      if (questionIdsArray.length === 0) {
        setToast({
          show: true,
          message:
            "No valid questions selected. Please select questions again.",
          type: "error",
        });
        setLoading(false);
        return;
      }

      console.log("Selected Question IDs:", questionIdsArray);
      console.log("Template Data:", {
        title: formData.title,
        subject_id: formData.subject_id,
        questionCount: questionIdsArray.length,
      });

      // Validate header is selected
      if (!selectedHeader || !selectedHeader.id) {
        setToast({
          show: true,
          message: "Please select a header style",
          type: "error",
        });
        setLoading(false);
        return;
      }

      // Build template_metadata: clean up question_types to only include non-empty custom titles
      const cleanedQuestionTypes = {};
      Object.keys(templateMetadata.question_types || {}).forEach((type) => {
        const customTitle = templateMetadata.question_types[type]?.custom_title;
        // Only include question types with non-empty custom titles
        if (customTitle && customTitle.trim() !== "") {
          cleanedQuestionTypes[type] = {
            custom_title: customTitle.trim(),
          };
        }
      });

      // Always create template_metadata with header_id and question_types (even if empty)
      const finalTemplateMetadata = {
        question_types: cleanedQuestionTypes, // Only include question types with custom titles
        header_id: selectedHeader.id, // Always include header_id
      };

      console.log("Final template_metadata:", finalTemplateMetadata);

      // Declare templateData outside try block so it's accessible in catch
      let templateData = null;

      const user = JSON.parse(localStorage.getItem("user")) || {};
      console.log("User from localStorage:", user);
      console.log("User school_name:", user.school_name);

      // If school_name is missing, try to get it from profile API
      let schoolName = user.school_name || user.schoolName;
      if (
        !schoolName ||
        schoolName === null ||
        schoolName === undefined ||
        schoolName === ""
      ) {
        try {
          console.log("school_name is missing, fetching from profile API...");
          const profileResponse = await getProfile();
          const profileUser =
            profileResponse?.user || profileResponse?.data || profileResponse;
          schoolName = profileUser?.school_name || profileUser?.schoolName;

          // Update localStorage with school_name if found
          if (schoolName) {
            const updatedUser = { ...user, school_name: schoolName };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            console.log(
              "Updated user in localStorage with school_name:",
              schoolName
            );
          } else {
            console.warn(
              "Profile API response doesn't contain school_name either"
            );
          }
        } catch (error) {
          console.error("Error fetching profile for school_name:", error);
        }
      }

      // Trim school_name to remove any whitespace
      schoolName = schoolName ? String(schoolName).trim() : "NA";
      if (!schoolName || schoolName === "") {
        schoolName = "NA";
      }

      // Get address and logo from user profile as well (might be required by API)
      const userAddress = user.address || "NA";
      const userLogo = user.logo || user.logo_url || null;

      console.log("Final school_name value (trimmed):", schoolName);
      console.log("User address:", userAddress);
      console.log("User logo:", userLogo);

      // Now assign templateData
      templateData = {
        ...formData,
        type: "default",
        is_template: true, // Always true for templates
        user_id: user.id,
        school_name: schoolName, // Get school_name from user profile or use "NA" as fallback
        address: userAddress, // Get address from user profile
        logo: userLogo, // Get logo from user profile (optional)
        paper_title: formData.title || "", // Send paper_title (same as title for templates)
        standard: parseInt(formData.standard),
        subject_id: parseInt(formData.subject_id),
        subject_title_id: parseInt(formData.subject_title_id),
        board_id: parseInt(formData.board_id),
        subject: selectedSubject?.subject_name || "NA",
        board: selectedBoard?.board_name || "NA",
        date: currentDate,
        total_marks: parseInt(formData.total_marks) || 0,
        marks_mcq: parseInt(formData.marks_mcq) || 0,
        marks_short: parseInt(formData.marks_short) || 0,
        marks_long: parseInt(formData.marks_long) || 0,
        marks_blank: parseInt(formData.marks_blank) || 0,
        marks_onetwo: parseInt(formData.marks_onetwo) || 0,
        marks_truefalse: parseInt(formData.marks_truefalse) || 0,
        marks_passage: parseInt(formData.marks_passage) || 0,
        marks_match: parseInt(formData.marks_match) || 0,
        body: JSON.stringify(questionIdsArray), // Send question IDs as JSON array
        template_metadata: JSON.stringify(finalTemplateMetadata), // Include template metadata
        question_count: questionIdsArray.length, // Add question count for display
      };

      console.log("Sending template data:", {
        ...templateData,
        body: questionIdsArray, // Log the array
      });
      console.log("Template data school_name:", templateData.school_name);
      console.log("Template data address:", templateData.address);
      console.log("Template data logo:", templateData.logo);

      const response = await createTemplate(templateData);
      const templateId = response?.data?.id || response?.id;

      setToast({
        show: true,
        message: "Template created successfully! Redirecting to preview...",
        type: "success",
      });

      setTimeout(() => {
        if (templateId) {
          navigate(`/admin/templates/${templateId}`);
        } else {
          navigate("/admin/templates");
        }
      }, 1500);
    } catch (error) {
      console.error("Error creating template:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error(
        "Full error response:",
        JSON.stringify(error.response?.data, null, 2)
      );

      // Log what we're sending (only if templateData was created)
      if (templateData) {
        console.error("Template data being sent:", {
          user_id: templateData.user_id,
          type: templateData.type,
          is_template: templateData.is_template,
          title: templateData.title,
          school_name: templateData.school_name,
          standard: templateData.standard,
          subject_id: templateData.subject_id,
          subject_title_id: templateData.subject_title_id,
          board_id: templateData.board_id,
          subject: templateData.subject,
          board: templateData.board,
          date: templateData.date,
          body: templateData.body,
          total_marks: templateData.total_marks,
          template_metadata: templateData.template_metadata,
        });
      } else {
        console.error("Template data was not created before error occurred");
      }

      let errorMessage = "Failed to create template";

      // Handle specific error types
      if (
        error.response?.data?.error?.includes("ETIMEDOUT") ||
        error.response?.data?.error?.includes("timeout") ||
        error.message?.includes("timeout")
      ) {
        errorMessage =
          "Database connection timeout. The server is taking too long to process your request. Please try again with fewer questions or contact support.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // If it's a timeout with many questions, suggest splitting
      if (selectedQuestions.length > 30 && errorMessage.includes("timeout")) {
        errorMessage += ` You selected ${selectedQuestions.length} questions. Try selecting fewer questions at once.`;
      }

      setToast({
        show: true,
        message: errorMessage,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPreviewHeader = () => {
    if (!selectedHeader) return null;

    const selectedSubject = subjects.find(
      (s) => s.subject_id === parseInt(formData.subject_id)
    );

    // Get user profile data from localStorage
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const userSchoolName = user.school_name || user.schoolName || "";
    const userAddress = user.address || "";
    const userLogo = user.logo || "";

    const previewHeader = {
      ...selectedHeader,
      schoolName: userSchoolName || selectedHeader.schoolName,
      address: userAddress || selectedHeader.address || "",
      image: userLogo || selectedHeader.image || "",
      subject: selectedSubject?.subject_name || "",
      class: formData.standard ? `Standard ${formData.standard}` : "",
      date: new Date().toISOString().split("T")[0],
      documentTitle: formData.title || selectedHeader.documentTitle || null,
    };

    return previewHeader;
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                currentStep === step.id
                  ? "bg-blue-600 text-white"
                  : currentStep > step.id
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
            </div>
            <div className="ml-3 hidden md:block">
              <div
                className={`font-semibold ${
                  currentStep === step.id ? "text-blue-600" : "text-gray-600"
                }`}
              >
                {step.name}
              </div>
              <div className="text-sm text-gray-500">{step.description}</div>
            </div>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={`flex-1 h-1 mx-4 ${
                currentStep > step.id ? "bg-green-500" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Basic Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paper Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject <span className="text-red-500">*</span>
          </label>
          <select
            name="subject_id"
            value={formData.subject_id}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
          >
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s.subject_id} value={s.subject_id}>
                {s.subject_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject Title <span className="text-red-500">*</span>
          </label>
          <select
            name="subject_title_id"
            value={formData.subject_title_id}
            onChange={handleInputChange}
            required
            disabled={!formData.subject_id}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none disabled:bg-gray-100"
          >
            <option value="">Select Subject Title</option>
            {subjectTitles.map((st) => (
              <option key={st.subject_title_id} value={st.subject_title_id}>
                {st.title_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Standard <span className="text-red-500">*</span>
          </label>
          <select
            name="standard"
            value={formData.standard}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
          >
            <option value="">Select Standard</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((std) => (
              <option key={std} value={std}>
                Standard {std}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Board <span className="text-red-500">*</span>
          </label>
          <select
            name="board_id"
            value={formData.board_id}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
          >
            <option value="">Select Board</option>
            {boards.map((b) => (
              <option key={b.board_id} value={b.board_id}>
                {b.board_name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    // Get user profile data from localStorage
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const userSchoolName = user.school_name || user.schoolName || "";
    const userAddress = user.address || "";
    const userLogo = user.logo || "";

    const previewHeader = getPreviewHeader();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Select Paper Header
          </h2>
          {selectedHeader && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Header Selected</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Header Selection */}
          <div>
            {!selectedHeader ? (
              <div className="space-y-4">
                {INDIAN_HEADERS.map((header) => {
                  const selectedSubject = formData.subject_id
                    ? subjects.find(
                        (s) => s.subject_id === parseInt(formData.subject_id)
                      )?.subject_name || ""
                    : "";

                  return (
                    <div
                      key={header.id}
                      onClick={() => setSelectedHeader(header)}
                      className="border-2 border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer bg-white"
                    >
                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-800">
                          {header.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {header.description}
                        </p>
                      </div>
                      <div className="border border-gray-200 rounded p-3 bg-gray-50">
                        <HeaderCard
                          header={{
                            ...header,
                            schoolName: userSchoolName || header.schoolName,
                            address: userAddress || header.address || "",
                            image: userLogo || header.image || "",
                            subject: selectedSubject,
                            class: formData.standard
                              ? `Standard ${formData.standard}`
                              : "",
                            date: new Date().toISOString().split("T")[0],
                            documentTitle:
                              formData.title || header.documentTitle || null,
                          }}
                          disableHover={true}
                          disableStyles={false}
                          disableNavigation={true}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">
                      Selected: {selectedHeader.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedHeader.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedHeader(null)}
                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Change
                  </button>
                </div>
                <div className="border border-gray-300 rounded p-4 bg-white">
                  <HeaderCard
                    header={previewHeader || selectedHeader}
                    disableHover={true}
                    disableStyles={false}
                    disableNavigation={true}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Preview</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-gray-300">
                <h4 className="font-semibold text-gray-700 mb-3">
                  Basic Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Title:</span>
                    <span className="font-medium">
                      {formData.title || "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subject:</span>
                    <span className="font-medium">
                      {subjects.find(
                        (s) => s.subject_id === parseInt(formData.subject_id)
                      )?.subject_name || "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Standard:</span>
                    <span className="font-medium">
                      {formData.standard
                        ? `Standard ${formData.standard}`
                        : "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Board:</span>
                    <span className="font-medium">
                      {boards.find(
                        (b) => b.board_id === parseInt(formData.board_id)
                      )?.board_name || "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Marks:</span>
                    <span className="font-medium">
                      {formData.total_marks || "Not set"}
                    </span>
                  </div>
                </div>
              </div>

              {previewHeader && (
                <div className="bg-white rounded-lg p-4 border border-gray-300">
                  <h4 className="font-semibold text-gray-700 mb-3">
                    Header Preview
                  </h4>
                  <HeaderCard
                    header={previewHeader}
                    disableHover={true}
                    disableStyles={false}
                    disableNavigation={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const selectedQuestions = getSelectedQuestions();
    const currentQuestions = availableQuestions[currentQuestionType] || [];
    const selectedInCurrentType = currentQuestions.filter((q) =>
      selectedQuestionIds.has(q.question_id)
    ).length;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Select Questions & Set Marks
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Selected: {selectedQuestionIds.size} question(s)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Selection */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <select
                  value={currentQuestionType}
                  onChange={(e) => setCurrentQuestionType(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none font-semibold"
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
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {currentQuestions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No questions available for this type
                  </div>
                ) : (
                  currentQuestions.map((q) => {
                    const questionId = q.question_id || q.id;
                    if (!questionId) {
                      console.error("Question missing ID:", q);
                      return null;
                    }
                    const isSelected = selectedQuestionIds.has(questionId);
                    return (
                      <div
                        key={questionId}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                        onClick={() => handleQuestionToggle(questionId)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-800 font-medium">
                              {q.question}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                              <span className="px-2 py-1 bg-gray-100 rounded">
                                {q.type}
                              </span>
                              <span>{q.marks} marks</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Marks Breakdown & Selected Questions */}
          <div className="space-y-4">
            {/* Marks Breakdown */}
            <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-4">
                Marks Breakdown
              </h3>
              <div className="space-y-3">
                {[
                  "marks_mcq",
                  "marks_short",
                  "marks_long",
                  "marks_blank",
                  "marks_onetwo",
                  "marks_truefalse",
                  "marks_passage",
                  "marks_match",
                ].map((field) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {field
                        .replace("marks_", "")
                        .replace(/_/g, " ")
                        .toUpperCase()}
                    </label>
                    <input
                      type="number"
                      name={field}
                      value={formData[field]}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Questions Summary */}
            {selectedQuestions.length > 0 && (
              <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Selected Questions ({selectedQuestions.length})
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {selectedQuestions.map((q) => (
                    <div
                      key={q.question_id}
                      className="p-2 bg-gray-50 rounded border border-gray-200 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700 truncate">
                          {q.question}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 ml-6">
                        {q.type} • {q.marks} marks
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Question Type Titles
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Customize the section headings for each question type. Leave empty
            to use default titles.
          </p>
        </div>
        <QuestionTypeTitleEditor
          questionTypes={templateMetadata.question_types}
          onChange={(updated) =>
            setTemplateMetadata((prev) => ({
              ...prev,
              question_types: updated,
            }))
          }
        />
      </div>
    );
  };

  const renderStep5 = () => {
    const selectedQuestions = getSelectedQuestions();
    const previewHeader = getPreviewHeader();

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
      const avgLength = options.reduce((sum, opt) => sum + (opt?.length || 0), 0) / options.length;
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

      selectedQuestions.forEach((question) => {
        const isFirstQuestionOfType = !currentPage.some((q) => q.type === question.type);
        let questionHeight = COMPONENT_HEIGHTS.QUESTION;
        if (isFirstQuestionOfType) {
          questionHeight += COMPONENT_HEIGHTS.SECTION;
        }
        if (question.type === "mcq" && question.options) {
          try {
            const options = typeof question.options === "string" ? JSON.parse(question.options) : question.options;
            if (Array.isArray(options) && options.length > 0) {
              questionHeight += getMcqOptionsHeight(options);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
        // Check for images in all question types (both image_url and image fields)
        if ((question.image_url !== null && question.image_url !== undefined && question.image_url !== "") ||
            (question.image !== null && question.image !== undefined && question.image !== "")) {
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
          let newQuestionHeight = COMPONENT_HEIGHTS.QUESTION + COMPONENT_HEIGHTS.SECTION;
          if (question.type === "mcq" && question.options) {
            try {
              const options = typeof question.options === "string" ? JSON.parse(question.options) : question.options;
              if (Array.isArray(options) && options.length > 0) {
                newQuestionHeight += getMcqOptionsHeight(options);
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
          // Check for images in all question types (both image_url and image fields)
          if ((question.image_url !== null && question.image_url !== undefined && question.image_url !== "") ||
              (question.image !== null && question.image !== undefined && question.image !== "")) {
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

    const marksMap = {
      mcq: 1,
      blank: 1,
      truefalse: 1,
      onetwo: 2,
      short: 3,
      long: 5,
      default: 0,
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Preview Template
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Review your template before creating. Make sure everything looks
              correct.
            </p>
          </div>
          <div className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg">
            <span className="text-sm font-semibold">Total: </span>
            <span className="text-lg font-bold">
              {formData.total_marks || 0}
            </span>
            <span className="text-sm font-semibold"> marks</span>
          </div>
        </div>

        {/* Template Summary */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Template Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-gray-600">Title:</span>
              <p className="font-semibold text-gray-800">
                {formData.title || "Not set"}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Subject:</span>
              <p className="font-semibold text-gray-800">
                {subjects.find(
                  (s) => s.subject_id === parseInt(formData.subject_id)
                )?.subject_name || "Not set"}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Standard:</span>
              <p className="font-semibold text-gray-800">
                {formData.standard
                  ? `Standard ${formData.standard}`
                  : "Not set"}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Questions:</span>
              <p className="font-semibold text-gray-800">
                {selectedQuestions.length}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Header:</span>
              <p className="font-semibold text-gray-800">
                {selectedHeader?.name || "Not selected"}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Board:</span>
              <p className="font-semibold text-gray-800">
                {boards.find((b) => b.board_id === parseInt(formData.board_id))
                  ?.board_name || "Not set"}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Total Marks:</span>
              <p className="font-semibold text-gray-800">
                {formData.total_marks || 0}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Timing:</span>
              <p className="font-semibold text-gray-800">
                {formData.timing || "N/A"} min
              </p>
            </div>
          </div>
        </div>

        {/* Paper Preview - A4 Format */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Paper Preview (A4 Size)
          </h3>

          {selectedQuestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p>No questions selected</p>
            </div>
          ) : (
            <div className="flex flex-col gap-10 w-full justify-center items-center">
              {questionPages.map((pageQuestions, pageIndex) => (
                <div
                  key={pageIndex}
                  className="w-full max-w-[794px] md:h-[1123px] bg-white shadow-lg rounded-lg border relative md:p-6"
                >
                  {/* Header - Only on first page */}
                  {pageIndex === 0 && previewHeader && (
                    <HeaderCard
                      header={previewHeader}
                      disableHover={true}
                      disableStyles
                    />
                  )}

                  {/* Questions */}
                  <div className="px-6 md:px-6 py-2">
                    <div className="rounded-lg px-6 md:px-6">
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
                            const allQuestionsOfType = selectedQuestions.filter(
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
                                  {q.type === "mcq"
                                    ? "A) Multiple Choice Questions (MCQs). Tick the correct options."
                                    : q.type === "blank"
                                    ? "B) Fill in the Blanks"
                                    : q.type === "onetwo"
                                    ? "C) One or Two Word Answers"
                                    : q.type === "short"
                                    ? "D) Short Answer Questions"
                                    : q.type === "long"
                                    ? "E) Long Answer Questions"
                                    : q.type === "truefalse"
                                    ? "C) True/False Questions"
                                    : q.type === "passage"
                                    ? "F) Passage Based Questions"
                                    : q.type === "match"
                                    ? "G) Match the Following"
                                    : "F) Other Questions"}
                                </h3>
                                <span className="text-sm font-medium text-gray-700">
                                  {totalMarks} marks
                                </span>
                              </div>
                            );
                          }

                          acc.push(
                            <div key={q.question_id || index}>
                              <p className="cursor-default py-1 px-2 text-gray-800">
                                {q.number || index + 1}. {q.question}
                              </p>
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

                                    // Determine layout based on option length
                                    const avgLength =
                                      optionsArray.reduce(
                                        (sum, opt) => sum + (opt?.length || 0),
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
                                              ({String.fromCharCode(97 + i)})
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

                                    // Determine layout based on option length
                                    const avgLength =
                                      optionsArray.reduce(
                                        (sum, opt) => sum + (opt?.length || 0),
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
                                              ({String.fromCharCode(97 + i)})
                                            </span>
                                            <span>{option}</span>
                                          </li>
                                        ))}
                                      </ol>
                                    );
                                  }
                                })()}
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
    );
  };

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
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/templates")}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Create Template
            </h1>
            <p className="text-gray-600 mt-1">Step-by-step template creation</p>
          </div>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-6"
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/admin/templates")}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <div className="flex gap-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>
              )}
              {currentStep < STEPS.length + 1 ? ( // +1 for preview step (step 5)
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Create Template</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateTemplate;
