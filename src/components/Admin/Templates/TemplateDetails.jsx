import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, FileDown, Eye } from "lucide-react";
import { getTemplateById } from "../../../services/adminService";
import Toast from "../../Common/Toast";
import downloadPDF from "../../../utils/downloadPdf";

const TemplateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    fetchTemplateDetails();
  }, [id]);

  const fetchTemplateDetails = async () => {
    try {
      setLoading(true);
      const response = await getTemplateById(id);
      const templateData = response?.template || response?.data || response;
      setTemplate(templateData);
      
      // Parse questions from body or questions array
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
          onClick={() => navigate("/admin/templates")}
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Templates
        </button>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    const pdfContent = document.getElementById("template-preview-content");
    if (pdfContent) {
      downloadPDF([pdfContent]);
    }
  };

  // Determine layout type based on standard
  const getLayoutType = (standard) => {
    if (standard <= 5) return "primary";
    if (standard <= 8) return "middle";
    if (standard <= 10) return "high";
    return "senior";
  };

  const layoutType = getLayoutType(template.standard || 10);

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
              <h1 className="text-3xl font-bold text-gray-800">{template.title || "Template Details"}</h1>
              <p className="text-gray-600 mt-1">Template preview and information</p>
            </div>
          </div>
          <div className="flex gap-2">
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

        {/* Paper Preview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Paper Preview
            </h2>
            <div className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg">
              <span className="text-sm font-semibold">Total: </span>
              <span className="text-lg font-bold">{template.total_marks || 0}</span>
              <span className="text-sm font-semibold"> marks</span>
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p>No questions in this template</p>
            </div>
          ) : (
            <div id="template-preview-content" className="bg-white p-8 border-2 border-gray-300 rounded-lg">
              {/* Paper Header */}
              <div className="mb-8 border-4 border-double border-black p-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-full border-3 border-gray-800 flex items-center justify-center text-white font-bold text-xl">
                    {template.school_name?.substring(0, 3).toUpperCase() || "SCH"}
                  </div>
                  <h1 className="text-2xl font-bold">{template.school_name || "School Name"}</h1>
                </div>
                <div className="h-0.5 bg-black my-3"></div>
                <div className="flex justify-between text-sm mt-3">
                  <span>
                    <strong>Name:</strong> _________________
                  </span>
                  <span>
                    <strong>Class:</strong> Standard {template.standard}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span>
                    <strong>Subject:</strong> {template.subject}
                  </span>
                  <span>
                    <strong>Date:</strong> {template.date || new Date().toISOString().split("T")[0]}
                  </span>
                </div>
                {template.timing && (
                  <div className="mt-2 text-sm">
                    <strong>Time:</strong> {template.timing} minutes
                  </div>
                )}
              </div>

              {/* Questions */}
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div
                    key={question.question_id || index}
                    className="border-l-4 border-blue-500 pl-4 py-2"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600 text-lg">Q{index + 1}.</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                          {question.type?.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600 font-semibold">
                          [{question.marks} marks]
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-800 text-base leading-relaxed mt-2">
                      {question.question}
                    </p>
                    {question.options && question.type === "mcq" && (() => {
                      try {
                        // Try to parse as JSON first
                        let optionsArray = [];
                        if (typeof question.options === 'string') {
                          // Check if it's already a JSON string
                          if (question.options.trim().startsWith('[')) {
                            optionsArray = JSON.parse(question.options);
                          } else {
                            // It's a comma-separated string, split it
                            optionsArray = question.options.split(',').map(opt => opt.trim());
                          }
                        } else if (Array.isArray(question.options)) {
                          optionsArray = question.options;
                        }
                        
                        return (
                          <div className="mt-3 ml-6 space-y-1">
                            {optionsArray.map((option, optIdx) => (
                              <div key={optIdx} className="text-sm text-gray-700">
                                {String.fromCharCode(65 + optIdx)}. {option}
                              </div>
                            ))}
                          </div>
                        );
                      } catch (error) {
                        // If parsing fails, try splitting by comma
                        const optionsArray = String(question.options).split(',').map(opt => opt.trim());
                        return (
                          <div className="mt-3 ml-6 space-y-1">
                            {optionsArray.map((option, optIdx) => (
                              <div key={optIdx} className="text-sm text-gray-700">
                                {String.fromCharCode(65 + optIdx)}. {option}
                              </div>
                            ))}
                          </div>
                        );
                      }
                    })()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TemplateDetails;

