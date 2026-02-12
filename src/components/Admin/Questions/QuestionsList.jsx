import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  getQuestionsByType,
  deleteQuestion,
  getAllSubjects,
  getAllBoards,
  getAllSubjectTitles,
} from "../../../services/adminService";
import { Plus, Trash2, Search, Edit, Upload, Download, Eye, X } from "lucide-react";
import Toast from "../../Common/Toast";
import Loader from "../../Common/loader/loader";
import AddQuestionModal from "./AddQuestionModal";
import BulkUploadModal from "./BulkUploadModal";
import { API_ORIGIN } from "../../../config/api";

const QuestionsList = ({ questionType }) => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterSubjectTitleId, setFilterSubjectTitleId] = useState("");
  const [filterBoardId, setFilterBoardId] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [boards, setBoards] = useState([]);
  const [subjectTitles, setSubjectTitles] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewSingleQuestion, setPreviewSingleQuestion] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const getQuestionImageUrl = (q) => {
    const img = q?.image;
    if (!img) return null;
    if (typeof img === "string" && img.startsWith("http")) return img;
    const base = API_ORIGIN || "";
    return img.startsWith("/") ? `${base}${img}` : `${base}/${img}`;
  };

  useEffect(() => {
    fetchQuestions();
  }, [questionType]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [subjectsData, boardsData, titlesData] = await Promise.all([
          getAllSubjects(),
          getAllBoards(),
          getAllSubjectTitles(),
        ]);
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
        setBoards(Array.isArray(boardsData) ? boardsData : []);
        setSubjectTitles(Array.isArray(titlesData) ? titlesData : []);
      } catch (e) {
        console.error("Error fetching filter options:", e);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    filterQuestions();
  }, [questions, searchTerm, filterSubjectId, filterSubjectTitleId, filterBoardId]);

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
    let filtered = questions;

    if (searchTerm) {
      filtered = filtered.filter(
        (q) =>
          q.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (typeof q.answer === "string" && q.answer?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          getSubjectName(q.subject)?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterSubjectId) {
      const sid = Number(filterSubjectId);
      filtered = filtered.filter((q) => Number(q.subject_id) === sid);
    }
    if (filterSubjectTitleId) {
      const tid = Number(filterSubjectTitleId);
      filtered = filtered.filter((q) => Number(q.subject_title_id) === tid);
    }
    if (filterBoardId) {
      const bid = Number(filterBoardId);
      filtered = filtered.filter((q) => Number(q.board_id) === bid);
    }
    setFilteredQuestions(filtered);
  };

  // Build Excel in same format as bulk upload (IDs only: Subject ID, Subject Title ID, Board ID)
  const getExportColumnMapping = () => {
    const base = {
      question: "Question",
      answer: "Answer",
      standard: "Standard",
      subject_id: "Subject ID",
      subject_title_id: "Subject Title ID",
      board_id: "Board ID",
      marks: "Marks",
      solution: "Solution",
      image: "Image",
    };
    if (questionType === "mcq") {
      return { ...base, option1: "Option1", option2: "Option2", option3: "Option3", option4: "Option4" };
    }
    if (questionType === "passage") {
      return { ...base, passage: "Passage", passage_questions: "Passage Questions", passage_answers: "Passage Answers" };
    }
    if (questionType === "match") {
      return { ...base, left_items: "Left Items", right_items: "Right Items", match_answers: "Match Answers" };
    }
    return base;
  };

  const buildAndDownloadExcel = () => {
    const m = getExportColumnMapping();
    const headers = [
      m.question,
      m.answer,
      m.standard,
      m.subject_id,
      m.subject_title_id,
      m.board_id,
      m.marks,
    ];
    if (questionType === "mcq") headers.push(m.option1, m.option2, m.option3, m.option4);
    if (questionType === "passage") headers.push(m.passage, m.passage_questions, m.passage_answers);
    if (questionType === "match") headers.push(m.left_items, m.right_items, m.match_answers);
    headers.push(m.solution, m.image);

    const rows = filteredQuestions.map((q) => {
      const answerStr =
        typeof q.answer === "object" ? JSON.stringify(q.answer) : (q.answer != null ? String(q.answer) : "");
      const row = [
        q.question || "",
        answerStr,
        q.standard != null ? String(q.standard) : "",
        q.subject_id != null ? String(q.subject_id) : "",
        q.subject_title_id != null ? String(q.subject_title_id) : "",
        q.board_id != null ? String(q.board_id) : "",
        q.marks != null ? String(q.marks) : "",
      ];
      if (questionType === "mcq") {
        let opts = [];
        try {
          opts = Array.isArray(q.options) ? q.options : (q.options ? JSON.parse(q.options) : []);
        } catch (_) {}
        row.push(
          opts[0] ?? "",
          opts[1] ?? "",
          opts[2] ?? "",
          opts[3] ?? ""
        );
      }
      if (questionType === "passage") {
        const passage = q.question || "";
        let pq = [];
        let pa = {};
        try {
          pq = Array.isArray(q.options) ? q.options : (q.options ? JSON.parse(q.options) : []);
          pa = typeof q.answer === "object" ? q.answer : (q.answer ? JSON.parse(q.answer) : {});
        } catch (_) {}
        const passageQuestions = Array.isArray(pq) ? JSON.stringify(pq) : "";
        const passageAnswers = typeof pa === "object" ? JSON.stringify(pa) : "";
        row.push(passage, passageQuestions, passageAnswers);
      }
      if (questionType === "match") {
        let left = [],
          right = [],
          ans = {};
        try {
          const opt = typeof q.options === "string" ? JSON.parse(q.options || "{}") : q.options || {};
          left = opt.left || [];
          right = opt.right || [];
          ans = typeof q.answer === "object" ? q.answer : (q.answer ? JSON.parse(q.answer) : {});
        } catch (_) {}
        row.push(
          Array.isArray(left) ? JSON.stringify(left) : "",
          Array.isArray(right) ? JSON.stringify(right) : "",
          typeof ans === "object" ? JSON.stringify(ans) : ""
        );
      }
      row.push(q.solution ?? "", q.image ?? "");
      return row;
    });

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, `Questions_Export_${questionType}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setToast({ show: true, message: `Downloaded ${rows.length} question(s)`, type: "success" });
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

      {/* Toolbar: Filters + Search + Buttons */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Filters inline in toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white min-w-[120px]"
              title="Filter by Subject"
            >
              <option value="">Subject: All</option>
              {subjects.map((s) => (
                <option key={s.subject_id} value={s.subject_id}>
                  {s.subject_name}
                </option>
              ))}
            </select>
            <select
              value={filterSubjectTitleId}
              onChange={(e) => setFilterSubjectTitleId(e.target.value)}
              className="px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white min-w-[140px]"
              title="Filter by Subject Title"
            >
              <option value="">Title: All</option>
              {subjectTitles.map((st) => (
                <option key={st.subject_title_id} value={st.subject_title_id}>
                  {st.title_name ?? st.subject_title_name ?? `ID ${st.subject_title_id}`}
                </option>
              ))}
            </select>
            <select
              value={filterBoardId}
              onChange={(e) => setFilterBoardId(e.target.value)}
              className="px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white min-w-[120px]"
              title="Filter by Board"
            >
              <option value="">Board: All</option>
              {boards.map((b) => (
                <option key={b.board_id} value={b.board_id}>
                  {b.board_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-0">
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
          <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={buildAndDownloadExcel}
            disabled={filteredQuestions.length === 0}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            <span>Bulk Download</span>
          </button>
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
                            setPreviewSingleQuestion(question);
                            setShowPreviewModal(true);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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

      {/* Question preview modal (all or single with image) */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
              <h3 className="text-xl font-bold text-gray-800">
                {previewSingleQuestion ? "Question preview" : `All questions preview (${filteredQuestions.length})`}
              </h3>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewSingleQuestion(null);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {(previewSingleQuestion ? [previewSingleQuestion] : filteredQuestions).map((q, idx) => {
                const imageUrl = getQuestionImageUrl(q);
                let optionsList = [];
                try {
                  const opts = Array.isArray(q.options) ? q.options : (q.options ? JSON.parse(q.options) : []);
                  optionsList = Array.isArray(opts) ? opts : [];
                } catch (_) {}
                const answerStr = typeof q.answer === "object" ? JSON.stringify(q.answer) : (q.answer ?? "");
                return (
                  <div
                    key={q.question_id || idx}
                    className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    {!previewSingleQuestion && (
                      <span className="text-xs font-semibold text-gray-500 mb-2 block">Question {idx + 1}</span>
                    )}
                    <p className="text-gray-900 font-medium mb-2">{q.question || "N/A"}</p>
                    {imageUrl && (
                      <div className="mb-3">
                        <img
                          src={imageUrl}
                          alt="Question"
                          className="max-w-full max-h-64 object-contain rounded-lg border border-gray-200 bg-white"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                    {questionType === "mcq" && optionsList.length > 0 && (
                      <ul className="list-disc list-inside text-gray-700 text-sm mb-2">
                        {optionsList.map((opt, i) => (
                          <li key={i}>{opt}</li>
                        ))}
                      </ul>
                    )}
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Answer:</span> {answerStr || "—"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                      <span>Subject: {getSubjectName(q.subject) || "—"}</span>
                      <span>Standard: {q.standard ?? "—"}</span>
                      <span>Marks: {q.marks ?? "—"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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

