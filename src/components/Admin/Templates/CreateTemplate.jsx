import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Save } from "lucide-react";
import { createTemplate } from "../../../services/adminService";
import { getAllSubjects, getAllBoards, getAllSubjectTitles, getQuestionsByType } from "../../../services/adminService";
import Toast from "../../Common/Toast";

const CreateTemplate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  const [subjects, setSubjects] = useState([]);
  const [subjectTitles, setSubjectTitles] = useState([]);
  const [boards, setBoards] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState({});
  
  const [formData, setFormData] = useState({
    title: "",
    school_name: "",
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
    body: "[]", // JSON array of question IDs
  });

  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [currentQuestionType, setCurrentQuestionType] = useState("mcq");
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);

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

  const handleAddQuestion = (questionId) => {
    const question = availableQuestions[currentQuestionType]?.find((q) => q.question_id === questionId);
    if (question) {
      setSelectedQuestions((prev) => [...prev, question]);
      const currentBody = JSON.parse(formData.body || "[]");
      currentBody.push(questionId);
      setFormData((prev) => ({
        ...prev,
        body: JSON.stringify(currentBody),
      }));
      setShowQuestionSelector(false);
    }
  };

  const handleRemoveQuestion = (index) => {
    setSelectedQuestions((prev) => prev.filter((_, i) => i !== index));
    const currentBody = JSON.parse(formData.body || "[]");
    currentBody.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      body: JSON.stringify(currentBody),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject_id || !formData.subject_title_id || !formData.board_id || !formData.standard) {
      setToast({
        show: true,
        message: "Please fill all required fields",
        type: "error",
      });
      return;
    }

    if (selectedQuestions.length === 0) {
      setToast({
        show: true,
        message: "Please add at least one question",
        type: "error",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Get subject and board names
      const selectedSubject = subjects.find(s => s.subject_id === parseInt(formData.subject_id));
      const selectedBoard = boards.find(b => b.board_id === parseInt(formData.board_id));
      
      // Get current date
      const currentDate = new Date().toISOString().split("T")[0];
      
      const templateData = {
        ...formData,
        type: "default",
        is_template: true,
        user_id: JSON.parse(localStorage.getItem("user"))?.id,
        standard: parseInt(formData.standard),
        subject_id: parseInt(formData.subject_id),
        subject_title_id: parseInt(formData.subject_title_id),
        board_id: parseInt(formData.board_id),
        subject: selectedSubject?.subject_name || "NA", // Add subject name as string
        board: selectedBoard?.board_name || "NA", // Add board name as string
        date: currentDate, // Add date field
        total_marks: parseInt(formData.total_marks) || 0,
        marks_mcq: parseInt(formData.marks_mcq) || 0,
        marks_short: parseInt(formData.marks_short) || 0,
        marks_long: parseInt(formData.marks_long) || 0,
        marks_blank: parseInt(formData.marks_blank) || 0,
        marks_onetwo: parseInt(formData.marks_onetwo) || 0,
        marks_truefalse: parseInt(formData.marks_truefalse) || 0,
        marks_passage: parseInt(formData.marks_passage) || 0,
        marks_match: parseInt(formData.marks_match) || 0,
      };

      const response = await createTemplate(templateData);
      
      const templateId = response?.data?.id || response?.id;
      
      setToast({
        show: true,
        message: "Template created successfully! Redirecting to preview...",
        type: "success",
      });

      setTimeout(() => {
        if (templateId) {
          // Navigate to template details/preview page
          navigate(`/admin/templates/${templateId}`);
        } else {
          // Fallback to templates list if ID not available
          navigate("/admin/templates");
        }
      }, 1500);
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to create template",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-3xl font-bold text-gray-800">Create Template</h1>
            <p className="text-gray-600 mt-1">Create a default paper template</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
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
                  School Name
                </label>
                <input
                  type="text"
                  name="school_name"
                  value={formData.school_name}
                  onChange={handleInputChange}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Marks
                </label>
                <input
                  type="number"
                  name="total_marks"
                  value={formData.total_marks}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timing (minutes)
                </label>
                <input
                  type="number"
                  name="timing"
                  value={formData.timing}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Marks Breakdown */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Marks Breakdown</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.replace("marks_", "").replace(/_/g, " ").toUpperCase()}
                  </label>
                  <input
                    type="number"
                    name={field}
                    value={formData[field]}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Questions ({selectedQuestions.length})
              </h2>
              <button
                type="button"
                onClick={() => setShowQuestionSelector(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>

            {selectedQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No questions added yet. Click "Add Question" to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedQuestions.map((q, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">Q{index + 1}</span>
                        <span className="text-sm text-gray-600">({q.type})</span>
                        <span className="text-sm text-gray-600">{q.marks} marks</span>
                      </div>
                      <p className="text-gray-700">{q.question}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
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
                  <h3 className="text-xl font-bold">Select Question</h3>
                  <button
                    onClick={() => setShowQuestionSelector(false)}
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

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableQuestions[currentQuestionType]?.map((q) => (
                    <div
                      key={q.question_id}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleAddQuestion(q.question_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-gray-800">{q.question}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                            <span>{q.type}</span>
                            <span>•</span>
                            <span>{q.marks} marks</span>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/admin/templates")}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition disabled:opacity-50"
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
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateTemplate;

