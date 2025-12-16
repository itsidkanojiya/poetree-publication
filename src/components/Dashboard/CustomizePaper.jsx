import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Save, X, Plus } from "lucide-react";
import { getPaperById, replaceQuestion, updatePaper } from "../../services/paperService";
import { getQuestionsByType } from "../../services/adminService";
import Toast from "../Common/Toast";

const CustomizePaper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replacing, setReplacing] = useState(null);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [currentQuestionType, setCurrentQuestionType] = useState("mcq");
  const [availableQuestions, setAvailableQuestions] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    fetchPaperDetails();
  }, [id]);

  useEffect(() => {
    if (currentQuestionType && showQuestionSelector) {
      fetchQuestionsByType();
    }
  }, [currentQuestionType, showQuestionSelector]);

  const fetchPaperDetails = async () => {
    try {
      setLoading(true);
      const response = await getPaperById(id);
      const paperData = response?.paper || response?.data || response;
      setPaper(paperData);
      
      // Parse questions from body
      const bodyArray = JSON.parse(paperData.body || "[]");
      // For now, we'll need to fetch question details separately
      // This would ideally come from the API
      setQuestions(bodyArray.map((qId, index) => ({
        question_id: qId,
        position: index + 1,
        placeholder: true, // Indicates we need to fetch full details
      })));
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

  const handleReplaceQuestion = (position) => {
    setReplacing(position);
    setShowQuestionSelector(true);
  };

  const handleSelectQuestion = async (questionId) => {
    try {
      setLoading(true);
      await replaceQuestion(id, replacing, questionId);
      
      // Update local state
      const bodyArray = JSON.parse(paper.body || "[]");
      bodyArray[replacing - 1] = questionId;
      
      setPaper((prev) => ({
        ...prev,
        body: JSON.stringify(bodyArray),
      }));

      setQuestions((prev) => prev.map((q, idx) => 
        idx === replacing - 1 ? { ...q, question_id: questionId } : q
      ));

      setToast({
        show: true,
        message: "Question replaced successfully!",
        type: "success",
      });

      setShowQuestionSelector(false);
      setReplacing(null);
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to replace question",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-3xl font-bold text-gray-800">Customize Paper</h1>
              <p className="text-gray-600 mt-1">Replace questions in your customized paper</p>
            </div>
          </div>
        </div>

        {/* Paper Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Paper Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Title:</span>
              <p className="font-semibold text-gray-800">{paper.title}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Subject:</span>
              <p className="font-semibold text-gray-800">{paper.subject}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Standard:</span>
              <p className="font-semibold text-gray-800">Standard {paper.standard}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Total Marks:</span>
              <p className="font-semibold text-gray-800">{paper.total_marks || 0}</p>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Questions</h2>
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={index}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-blue-600">Q{question.position || index + 1}</span>
                      <span className="text-sm text-gray-600">Question ID: {question.question_id}</span>
                    </div>
                    {question.placeholder ? (
                      <p className="text-gray-500 italic">Loading question details...</p>
                    ) : (
                      <p className="text-gray-800">{question.question || "Question content"}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleReplaceQuestion(question.position || index + 1)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Replace</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Question Selector Modal */}
        {showQuestionSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Select Question to Replace Q{replacing}</h3>
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

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableQuestions[currentQuestionType]?.map((q) => (
                  <div
                    key={q.question_id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelectQuestion(q.question_id)}
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
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CustomizePaper;

