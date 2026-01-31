import { useState, useEffect } from "react";
import {
  getQuestionsByType,
  deleteQuestion,
} from "../../../services/adminService";
import { Plus, Trash2, Search, Edit, Eye, Upload } from "lucide-react";
import Toast from "../../Common/Toast";
import Loader from "../../Common/loader/loader";
import AddQuestionModal from "./AddQuestionModal";
import BulkUploadModal from "./BulkUploadModal";

const QuestionsList = ({ questionType }) => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    fetchQuestions();
  }, [questionType]);

  useEffect(() => {
    filterQuestions();
  }, [questions, searchTerm]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const data = await getQuestionsByType(questionType);
      setQuestions(Array.isArray(data) ? data : []);
    } catch (error) {
      setToast({
        show: true,
        message: "Failed to load questions",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely get subject name (handles both string and object)
  const getSubjectName = (subject) => {
    if (!subject) return "";
    if (typeof subject === "string") return subject;
    if (typeof subject === "object" && subject.subject_name) return subject.subject_name;
    return "";
  };

  const filterQuestions = () => {
    if (!searchTerm) {
      setFilteredQuestions(questions);
      return;
    }

    const filtered = questions.filter(
      (q) =>
        q.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof q.answer === "string" && q.answer?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        getSubjectName(q.subject)?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredQuestions(filtered);
  };

  const handleDelete = async () => {
    if (!selectedQuestion) return;
    try {
      await deleteQuestion(selectedQuestion.question_id);
      setToast({
        show: true,
        message: "Question deleted successfully",
        type: "success",
      });
      setShowDeleteModal(false);
      setSelectedQuestion(null);
      fetchQuestions();
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to delete question",
        type: "error",
      });
    }
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    fetchQuestions();
  };

  const handleEditSuccess = () => {
    setSelectedQuestion(null);
    fetchQuestions();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader />
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

      {/* Header with Add Button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
            />
          </div>
        </div>
        <div className="ml-4 flex items-center gap-2">
          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition shadow-lg"
          >
            <Upload className="w-5 h-5" />
            <span>Bulk Upload</span>
          </button>
          <button
            onClick={() => {
              setSelectedQuestion(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Questions Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Question</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Answer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Subject</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Standard</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Marks</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No questions found
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((question) => (
                  <tr key={question.question_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                      <div className="line-clamp-2">
                        {question.question || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                      <div className="line-clamp-2">
                        {typeof question.answer === "object"
                          ? JSON.stringify(question.answer)
                          : question.answer || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getSubjectName(question.subject) || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {question.standard || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {question.marks || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedQuestion(question);
                            setShowAddModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedQuestion(question);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddQuestionModal
          questionType={questionType}
          question={selectedQuestion}
          onClose={() => {
            setShowAddModal(false);
            setSelectedQuestion(null);
          }}
          onSuccess={selectedQuestion ? handleEditSuccess : handleAddSuccess}
        />
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <BulkUploadModal
          questionType={questionType}
          onClose={() => setShowBulkUploadModal(false)}
          onSuccess={() => {
            setShowBulkUploadModal(false);
            fetchQuestions();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Question</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this question? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedQuestion(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuestionsList;

