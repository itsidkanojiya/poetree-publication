import { useState, useEffect } from "react";
import {
  getAllWorksheets,
  deleteWorksheet,
  getAllSubjectTitles,
  getChaptersBySubjectTitle,
} from "../../../services/adminService";
import { Plus, Trash2, Search, FileText, Eye } from "lucide-react";
import Toast from "../../Common/Toast";
import Loader from "../../Common/loader/loader";
import AddWorksheetModal from "./AddWorksheetModal";

const WorksheetManagement = () => {
  const [worksheets, setWorksheets] = useState([]);
  const [filteredWorksheets, setFilteredWorksheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubjectTitleId, setFilterSubjectTitleId] = useState("");
  const [filterChapterId, setFilterChapterId] = useState("");
  const [subjectTitles, setSubjectTitles] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWorksheet, setSelectedWorksheet] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    fetchWorksheets();
  }, [filterChapterId]);

  useEffect(() => {
    filterWorksheets();
  }, [worksheets, searchTerm, filterSubjectTitleId]);

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

  const fetchWorksheets = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterChapterId) filters.chapter_id = filterChapterId;
      const data = await getAllWorksheets(filters);
      setWorksheets(Array.isArray(data) ? data : data?.worksheets ?? []);
    } catch (error) {
      setToast({
        show: true,
        message: "Failed to load worksheets",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterWorksheets = () => {
    let filtered = worksheets;
    if (filterSubjectTitleId) {
      const tid = Number(filterSubjectTitleId);
      filtered = filtered.filter((w) => Number(w.subject_title_id) === tid);
    }
    if (searchTerm) {
      filtered = filtered.filter(
        (worksheet) =>
          worksheet.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          worksheet.subject_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          worksheet.standard?.toString().includes(searchTerm) ||
          worksheet.standard_name?.toString().includes(searchTerm) ||
          worksheet.board?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (worksheet.chapter?.chapter_name ?? worksheet.chapter_name ?? "")?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredWorksheets(filtered);
  };

  const handleDelete = async () => {
    if (!selectedWorksheet) return;
    try {
      await deleteWorksheet(selectedWorksheet.worksheet_id);
      setToast({
        show: true,
        message: "Worksheet deleted successfully",
        type: "success",
      });
      setShowDeleteModal(false);
      setSelectedWorksheet(null);
      fetchWorksheets();
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to delete worksheet",
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
            Worksheet Management
          </h1>
          <p className="text-gray-600">Manage practice worksheets</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Add Worksheet</span>
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

      {/* Worksheets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorksheets.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No worksheets found</p>
          </div>
        ) : (
          filteredWorksheets.map((worksheet) => (
            <div
              key={worksheet.worksheet_id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition"
            >
              {/* Cover Image */}
              {worksheet.worksheet_coverlink && (
                <div className="h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={worksheet.worksheet_coverlink}
                    alt="Worksheet Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {!worksheet.worksheet_coverlink && (
                <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                  <FileText className="w-16 h-16 text-green-400" />
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {worksheet.subject || "N/A"}
                </h3>
                {worksheet.subject_title && (
                  <p className="text-sm text-gray-600 mb-1">
                    {worksheet.subject_title}
                  </p>
                )}
                {(worksheet.chapter?.chapter_name ?? worksheet.chapter_name) && (
                  <p className="text-sm text-gray-500 mb-1">
                    Chapter: {worksheet.chapter?.chapter_name ?? worksheet.chapter_name}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  {(worksheet.standard_name ?? worksheet.standard) && (
                    <span>Std: {worksheet.standard_name ?? worksheet.standard}</span>
                  )}
                  {worksheet.board && (
                    <span>Board: {worksheet.board}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {worksheet.worksheet_url && (
                    <a
                      href={worksheet.worksheet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View PDF</span>
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setSelectedWorksheet(worksheet);
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
        <AddWorksheetModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchWorksheets();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Worksheet</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this worksheet? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedWorksheet(null);
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

export default WorksheetManagement;

