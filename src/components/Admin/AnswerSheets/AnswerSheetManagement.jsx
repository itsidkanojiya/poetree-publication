import { useState, useEffect } from "react";
import {
  getAllAnswerSheets,
  deleteAnswerSheet,
  getAllSubjectTitles,
  getChaptersBySubjectTitle,
} from "../../../services/adminService";
import { Plus, Trash2, Search, FileText, Eye } from "lucide-react";
import Toast from "../../Common/Toast";
import Loader from "../../Common/loader/loader";
import AddAnswerSheetModal from "./AddAnswerSheetModal";

const AnswerSheetManagement = () => {
  const [answerSheets, setAnswerSheets] = useState([]);
  const [filteredSheets, setFilteredSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubjectTitleId, setFilterSubjectTitleId] = useState("");
  const [filterChapterId, setFilterChapterId] = useState("");
  const [subjectTitles, setSubjectTitles] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    fetchAnswerSheets();
  }, [filterChapterId]);

  useEffect(() => {
    filterSheets();
  }, [answerSheets, searchTerm, filterSubjectTitleId]);

  useEffect(() => {
    let cancelled = false;
    getAllSubjectTitles()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.subject_titles ?? data?.data ?? [];
        if (!cancelled) setSubjectTitles(list);
      })
      .catch((err) => {
        if (!cancelled) console.error("Error fetching subject titles:", err);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!filterSubjectTitleId) {
      setChapters([]);
      return;
    }
    let cancelled = false;
    getChaptersBySubjectTitle(filterSubjectTitleId)
      .then((list) => {
        if (!cancelled) setChapters(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (!cancelled) console.error("Error fetching chapters:", err);
      });
    return () => { cancelled = true; };
  }, [filterSubjectTitleId]);

  const fetchAnswerSheets = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterChapterId) filters.chapter_id = filterChapterId;
      const data = await getAllAnswerSheets(filters);
      setAnswerSheets(Array.isArray(data) ? data : data?.answersheets ?? []);
    } catch (error) {
      setToast({
        show: true,
        message: "Failed to load answer sheets",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSheets = () => {
    let filtered = answerSheets;
    if (filterSubjectTitleId) {
      const tid = Number(filterSubjectTitleId);
      filtered = filtered.filter((s) => Number(s.subject_title_id) === tid);
    }
    if (searchTerm) {
      filtered = filtered.filter(
        (sheet) =>
          sheet.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sheet.subject_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sheet.standard?.toString().includes(searchTerm) ||
          sheet.standard_name?.toString().includes(searchTerm) ||
          sheet.board?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (sheet.chapter?.chapter_name ?? sheet.chapter_name ?? "")?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredSheets(filtered);
  };

  const handleDelete = async () => {
    if (!selectedSheet) return;
    try {
      await deleteAnswerSheet(selectedSheet.answer_sheet_id);
      setToast({
        show: true,
        message: "Answer sheet deleted successfully",
        type: "success",
      });
      setShowDeleteModal(false);
      setSelectedSheet(null);
      fetchAnswerSheets();
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to delete answer sheet",
        type: "error",
      });
    }
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

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Answer Sheet Management
          </h1>
          <p className="text-gray-600">Manage answer sheets and solutions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Add Answer Sheet</span>
        </button>
      </div>

      {/* Filters + Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex flex-wrap gap-2 shrink-0">
          <select
            value={filterSubjectTitleId}
            onChange={(e) => {
              setFilterSubjectTitleId(e.target.value);
              setFilterChapterId("");
            }}
            className="px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white min-w-[160px]"
            title="Filter by Subject Title"
          >
            <option value="">Subject Title: All</option>
            {subjectTitles.map((t) => (
              <option key={t.subject_title_id ?? t.id} value={t.subject_title_id ?? t.id}>
                {t.title_name ?? t.subject_title_name ?? t.name ?? `ID ${t.subject_title_id ?? t.id}`}
              </option>
            ))}
          </select>
          <select
            value={filterChapterId}
            onChange={(e) => setFilterChapterId(e.target.value)}
            disabled={!filterSubjectTitleId}
            className="px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white min-w-[140px] disabled:bg-gray-100"
            title="Filter by Chapter"
          >
            <option value="">Chapter: All</option>
            {chapters.map((ch) => (
              <option key={ch.chapter_id} value={ch.chapter_id}>
                {ch.chapter_name}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by subject, standard, board, or chapter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
          />
        </div>
      </div>

      {/* Answer Sheets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSheets.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No answer sheets found</p>
          </div>
        ) : (
          filteredSheets.map((sheet) => (
            <div
              key={sheet.answer_sheet_id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition"
            >
              {/* Cover Image */}
              {sheet.answer_sheet_logo && (
                <div className="h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={sheet.answer_sheet_logo}
                    alt="Answer Sheet Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {!sheet.answer_sheet_logo && (
                <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <FileText className="w-16 h-16 text-blue-400" />
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {sheet.subject || "N/A"}
                </h3>
                {sheet.subject_title && (
                  <p className="text-sm text-gray-600 mb-1">
                    {sheet.subject_title}
                  </p>
                )}
                {(sheet.chapter?.chapter_name ?? sheet.chapter_name) && (
                  <p className="text-sm text-gray-500 mb-1">
                    Chapter: {sheet.chapter?.chapter_name ?? sheet.chapter_name}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  {(sheet.standard_name ?? sheet.standard) && (
                    <span>Std: {sheet.standard_name ?? sheet.standard}</span>
                  )}
                  {sheet.board && (
                    <span>Board: {sheet.board}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {sheet.answer_sheet_url && (
                    <a
                      href={sheet.answer_sheet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View PDF</span>
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setSelectedSheet(sheet);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddAnswerSheetModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchAnswerSheets();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Answer Sheet</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this answer sheet? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedSheet(null);
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

export default AnswerSheetManagement;

