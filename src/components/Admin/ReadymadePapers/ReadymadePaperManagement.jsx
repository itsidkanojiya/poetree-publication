import { useState, useEffect } from "react";
import {
  getAllReadymadePapers,
  deleteReadymadePaper,
  bulkDeleteReadymadePapers,
  getAllSubjectTitles,
  getChaptersBySubjectTitle,
} from "../../../services/adminService";
import { Plus, Trash2, Search, FileText, Eye, Download, CheckSquare } from "lucide-react";
import Toast from "../../Common/Toast";
import Loader from "../../Common/loader/loader";
import AddReadymadePaperModal from "./AddReadymadePaperModal";

const ReadymadePaperManagement = () => {
  const [papers, setPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubjectTitleId, setFilterSubjectTitleId] = useState("");
  const [filterChapterId, setFilterChapterId] = useState("");
  const [subjectTitles, setSubjectTitles] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    fetchPapers();
  }, [filterChapterId]);

  useEffect(() => {
    filterPapers();
  }, [papers, searchTerm, filterSubjectTitleId]);

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

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterChapterId) filters.chapter_id = filterChapterId;
      const data = await getAllReadymadePapers(filters);
      setPapers(Array.isArray(data) ? data : data?.readymade_papers ?? []);
      setSelectedIds([]);
    } catch (error) {
      setToast({ show: true, message: "Failed to load readymade papers", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const filterPapers = () => {
    let filtered = papers;
    if (filterSubjectTitleId) {
      const tid = Number(filterSubjectTitleId);
      filtered = filtered.filter((p) => Number(p.subject_title_id) === tid);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.subject?.toLowerCase().includes(q) ||
          p.subject_title?.toLowerCase().includes(q) ||
          p.standard?.toString().includes(searchTerm) ||
          p.standard_name?.toString().includes(searchTerm) ||
          p.board?.toLowerCase().includes(q) ||
          (p.chapter?.chapter_name ?? p.chapter_name ?? "")?.toLowerCase().includes(q)
      );
    }
    setFilteredPapers(filtered);
  };

  const handleDelete = async () => {
    if (!selectedPaper) return;
    try {
      await deleteReadymadePaper(selectedPaper.readymade_paper_id);
      setToast({ show: true, message: "Readymade paper deleted successfully", type: "success" });
      setShowDeleteModal(false);
      setSelectedPaper(null);
      fetchPapers();
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to delete readymade paper",
        type: "error",
      });
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredPapers.map((p) => p.readymade_paper_id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : visibleIds);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      setBulkDeleting(true);
      const res = await bulkDeleteReadymadePapers(selectedIds);
      setToast({
        show: true,
        message: `Deleted ${res?.deletedCount ?? selectedIds.length} paper(s) successfully`,
        type: "success",
      });
      setShowBulkDeleteModal(false);
      setSelectedIds([]);
      fetchPapers();
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to delete papers",
        type: "error",
      });
    } finally {
      setBulkDeleting(false);
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
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Readymade Papers
          </h1>
          <p className="text-gray-600">Upload complete exam papers (PDF and/or Word)</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Add Paper</span>
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

      {/* Selection action bar */}
      {filteredPapers.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition"
          >
            <CheckSquare className="w-4 h-4" />
            <span>
              {filteredPapers.every((p) => selectedIds.includes(p.readymade_paper_id))
                ? "Deselect all"
                : "Select all"}
            </span>
          </button>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-red-700">{selectedIds.length} selected</span>
              <button
                onClick={() => setSelectedIds([])}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition"
              >
                Clear
              </button>
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition shadow"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Papers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPapers.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No readymade papers found</p>
          </div>
        ) : (
          filteredPapers.map((paper) => (
            <div
              key={paper.readymade_paper_id}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition ${
                selectedIds.includes(paper.readymade_paper_id) ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {/* Selection checkbox */}
              <label className="absolute top-3 left-3 z-10 bg-white/90 rounded-md p-1 shadow cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 cursor-pointer accent-blue-600 block"
                  checked={selectedIds.includes(paper.readymade_paper_id)}
                  onChange={() => toggleSelect(paper.readymade_paper_id)}
                />
              </label>

              {/* Cover */}
              <div className="h-40 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <FileText className="w-16 h-16 text-indigo-400" />
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{paper.subject || "N/A"}</h3>
                {paper.subject_title && <p className="text-sm text-gray-600 mb-1">{paper.subject_title}</p>}
                {(paper.chapter?.chapter_name ?? paper.chapter_name) && (
                  <p className="text-sm text-gray-500 mb-1">
                    Chapter: {paper.chapter?.chapter_name ?? paper.chapter_name}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-4">
                  {(paper.standard_name ?? paper.standard) && (
                    <span>Std: {paper.standard_name ?? paper.standard}</span>
                  )}
                  {paper.board && <span>Board: {paper.board}</span>}
                  {paper.total_marks != null && <span>Marks: {paper.total_marks}</span>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {paper.paper_pdf_url && (
                    <a
                      href={paper.paper_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>PDF</span>
                    </a>
                  )}
                  {paper.paper_word_url && (
                    <a
                      href={paper.paper_word_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition text-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Word</span>
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setSelectedPaper(paper);
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
        <AddReadymadePaperModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchPapers();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Readymade Paper</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this paper? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPaper(null);
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

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Selected Papers</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedIds.length} selected paper(s)? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={bulkDeleting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {bulkDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReadymadePaperManagement;
