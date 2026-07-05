import { useState, useEffect } from "react";
import {
  getAllPlanners,
  deletePlanner,
  bulkDeletePlanners,
  getAllSubjects,
  getAllStandards,
} from "../../../services/adminService";
import { Plus, Trash2, Search, FileText, Eye, CheckSquare } from "lucide-react";
import Toast from "../../Common/Toast";
import Loader from "../../Common/loader/loader";
import AddPlannerModal from "./AddPlannerModal";

const standardsLabel = (row, standards) => {
  const list =
    Array.isArray(row.standards) && row.standards.length
      ? row.standards.map((s) => s.name ?? s.standard_id)
      : (Array.isArray(row.standard) ? row.standard : []).map(
          (id) => standards.find((s) => Number(s.standard_id) === Number(id))?.name ?? id
        );
  return list.join(", ");
};

const PlannerManagement = () => {
  const [planners, setPlanners] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterStandardId, setFilterStandardId] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [standards, setStandards] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    fetchPlanners();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [subjectsData, standardsData] = await Promise.all([getAllSubjects(), getAllStandards()]);
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
        const stdList = Array.isArray(standardsData) ? standardsData : [];
        setStandards(stdList.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
      } catch (e) {
        console.error("Error loading filters:", e);
      }
    })();
  }, []);

  useEffect(() => {
    filterList();
  }, [planners, searchTerm, filterSubjectId, filterStandardId]);

  const fetchPlanners = async () => {
    try {
      setLoading(true);
      const data = await getAllPlanners();
      setPlanners(Array.isArray(data) ? data : []);
      setSelectedIds([]);
    } catch (error) {
      setToast({ show: true, message: "Failed to load planners", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const filterList = () => {
    let list = planners;
    if (filterSubjectId) {
      const sid = Number(filterSubjectId);
      list = list.filter((p) => Number(p.subject_id) === sid);
    }
    if (filterStandardId) {
      const stdId = Number(filterStandardId);
      list = list.filter((p) => (Array.isArray(p.standard) ? p.standard : []).map(Number).includes(stdId));
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.subject?.toLowerCase().includes(q) ||
          p.board?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deletePlanner(selected.planner_id);
      setToast({ show: true, message: "Planner deleted successfully", type: "success" });
      setShowDeleteModal(false);
      setSelected(null);
      fetchPlanners();
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to delete planner",
        type: "error",
      });
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    const ids = filtered.map((p) => p.planner_id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : ids);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      setBulkDeleting(true);
      const res = await bulkDeletePlanners(selectedIds);
      setToast({
        show: true,
        message: `Deleted ${res?.deletedCount ?? selectedIds.length} planner(s) successfully`,
        type: "success",
      });
      setShowBulkDeleteModal(false);
      setSelectedIds([]);
      fetchPlanners();
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to delete planners",
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

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Planners
          </h1>
          <p className="text-gray-600">Upload planner PDFs for one or more standards</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Add Planner</span>
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex flex-wrap gap-2 shrink-0">
          <select
            value={filterSubjectId}
            onChange={(e) => setFilterSubjectId(e.target.value)}
            className="px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white min-w-[150px]"
          >
            <option value="">Subject: All</option>
            {subjects.map((s) => (
              <option key={s.subject_id} value={s.subject_id}>
                {s.subject_name}
              </option>
            ))}
          </select>
          <select
            value={filterStandardId}
            onChange={(e) => setFilterStandardId(e.target.value)}
            className="px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white min-w-[140px]"
          >
            <option value="">Standard: All</option>
            {standards.map((s) => (
              <option key={s.standard_id} value={s.standard_id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, subject, or board..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
          />
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition"
          >
            <CheckSquare className="w-4 h-4" />
            <span>{filtered.every((p) => selectedIds.includes(p.planner_id)) ? "Deselect all" : "Select all"}</span>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No planners found</p>
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.planner_id}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition ${
                selectedIds.includes(p.planner_id) ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <label className="absolute top-3 left-3 z-10 bg-white/90 rounded-md p-1 shadow cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 cursor-pointer accent-blue-600 block"
                  checked={selectedIds.includes(p.planner_id)}
                  onChange={() => toggleSelect(p.planner_id)}
                />
              </label>

              <div className="h-32 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <FileText className="w-14 h-14 text-indigo-400" />
              </div>

              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">{p.title || "Untitled"}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-2">
                  {p.subject && <span>{p.subject}</span>}
                  {p.board && <span>Board: {p.board}</span>}
                </div>
                <p className="text-sm text-gray-500 mb-4">Std: {standardsLabel(p, standards) || "—"}</p>

                <div className="flex items-center gap-2">
                  {p.planner_pdf_url && (
                    <a
                      href={p.planner_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View PDF</span>
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setSelected(p);
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

      {showAddModal && (
        <AddPlannerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchPlanners();
          }}
        />
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Planner</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this planner? This cannot be undone.</p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelected(null);
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

      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Selected Planners</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedIds.length} selected planner(s)? This cannot be undone.
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

export default PlannerManagement;
