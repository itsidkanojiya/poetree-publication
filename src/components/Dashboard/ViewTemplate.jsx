import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Edit, CheckCircle2 } from "lucide-react";
import { viewTemplate, customizeTemplate } from "../../services/paperService";
import Toast from "../Common/Toast";

const ViewTemplate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customizing, setCustomizing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    fetchTemplateDetails();
  }, [id]);

  const fetchTemplateDetails = async () => {
    try {
      setLoading(true);
      const response = await viewTemplate(id);
      const templateData = response?.template || response?.data || response;
      setTemplate(templateData);
      
      const questionsData = templateData?.questions || [];
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
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

  const handleCustomize = async () => {
    try {
      setCustomizing(true);
      const response = await customizeTemplate(id, []);
      const paper = response?.paper || response?.data || response;
      
      setToast({
        show: true,
        message: "Template customized successfully!",
        type: "success",
      });

      setTimeout(() => {
        navigate(`/dashboard/papers/${paper.id}/customize`);
      }, 1500);
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to customize template",
        type: "error",
      });
    } finally {
      setCustomizing(false);
    }
  };

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
              <h1 className="text-3xl font-bold text-gray-800">{template.title || "Template"}</h1>
              <p className="text-gray-600 mt-1">View template details</p>
            </div>
          </div>
          {template.can_customize !== false && (
            <button
              onClick={handleCustomize}
              disabled={customizing}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50"
            >
              {customizing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating Copy...</span>
                </>
              ) : (
                <>
                  <Edit className="w-5 h-5" />
                  <span>Customize Template</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Template Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Template Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Subject:</span>
              <p className="font-semibold text-gray-800">{template.subject}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Standard:</span>
              <p className="font-semibold text-gray-800">Standard {template.standard}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Board:</span>
              <p className="font-semibold text-gray-800">{template.board}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Total Marks:</span>
              <p className="font-semibold text-gray-800">{template.total_marks || 0}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Timing:</span>
              <p className="font-semibold text-gray-800">{template.timing || "N/A"} minutes</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Question Count:</span>
              <p className="font-semibold text-gray-800">{questions.length}</p>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Questions</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Read-only view</span>
            </div>
          </div>
          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p>No questions in this template</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={question.question_id || index}
                  className="p-4 border-2 border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600">Q{question.position || index + 1}</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        {question.type}
                      </span>
                      <span className="text-sm text-gray-600">{question.marks} marks</span>
                    </div>
                  </div>
                  <p className="text-gray-800 mb-2">{question.question}</p>
                  {question.answer && (
                    <div className="mt-2 p-2 bg-green-50 rounded">
                      <span className="text-sm font-semibold text-green-800">Answer: </span>
                      <span className="text-sm text-green-700">{question.answer}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ViewTemplate;

