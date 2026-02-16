import { useState, useEffect } from "react";
import {
  getAllStandards,
  createStandard,
  updateStandard,
  deleteStandard,
} from "../../../services/adminService";
import { Plus, Trash2, Search, Pencil, GraduationCap } from "lucide-react";
import Toast from "../../Common/Toast";
import Loader from "../../Common/loader/loader";

const STANDARD_TYPES = [
  { value: "pre_primary", label: "Pre-primary" },
  { value: "primary", label: "Primary" },
];

const StandardFormModal = ({ standard, onClose, onSave }) => {
  const isEdit = !!standard;
  const [formData, setFormData] = useState({
    name: standard?.name ?? "",
    sort_order: standard?.sort_order ?? "",
    type: standard?.type ?? "primary",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === "sort_order" ? (value === "" ? "" : Number(value)) : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!String(formData.name).trim()) newErrors.name = "Name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const body = {
        name: String(formData.name).trim(),
        ...(formData.sort_order !== "" && { sort_order: Number(formData.sort_order) }),
        ...(formData.type && { type: formData.type }),
      };
      await onSave(body);
      onClose();
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            {isEdit ? "Edit Standard" : "Add Standard"}
          </h3>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition">
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition ${
                errors.name ? "border-red-300" : "border-gray-200 focus:border-blue-500"
              }`}
              placeholder="e.g. Toddlers, 1, A"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sort order (optional)</label>
            <input
              type="number"
              name="sort_order"
              value={formData.sort_order}
              onChange={handleChange}
              min={0}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition"
              placeholder="Display order"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type (optional)</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition"
            >
              {STANDARD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition font-semibold disabled:opacity-50">
              {saving ? "Saving..." : isEdit ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StandardsManagement = () => {
  const [standards, setStandards] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingStandard, setEditingStandard] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchStandards = async () => {
    try {
      setLoading(true);
      const list = await getAllStandards();
      const sorted = Array.isArray(list) ? [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) : [];
      setStandards(sorted);
      setFiltered(sorted);
    } catch (err) {
      setToast({ show: true, message: "Failed to load standards", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandards();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFiltered(standards);
      return;
    }
    const term = searchTerm.toLowerCase();
    setFiltered(standards.filter((s) => String(s.name || "").toLowerCase().includes(term) || String(s.type || "").toLowerCase().includes(term)));
  }, [standards, searchTerm]);

  const handleSave = async (body) => {
    if (editingStandard) {
      await updateStandard(editingStandard.standard_id, body);
      setToast({ show: true, message: "Standard updated successfully", type: "success" });
    } else {
      await createStandard(body);
      setToast({ show: true, message: "Standard added successfully", type: "success" });
    }
    setEditingStandard(null);
    setShowFormModal(false);
    fetchStandards();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStandard(deleteTarget.standard_id);
      setToast({ show: true, message: "Standard deleted successfully", type: "success" });
      setDeleteTarget(null);
      fetchStandards();
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.message || "Failed to delete", type: "error" });
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
        <Toast message={toast.message} type={toast.type} onClose={() => setToast((t) => ({ ...t, show: false }))} />
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Manage Standards
          </h1>
          <p className="text-gray-600">Add, edit, or remove standards (e.g. Toddlers, A–C, 1–12). Order follows sort_order.</p>
        </div>
        <button
          onClick={() => { setEditingStandard(null); setShowFormModal(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add Standard
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Sort order</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No standards found
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.standard_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.name ?? "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{s.type ?? "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{s.sort_order ?? "—"}</td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setEditingStandard(s); setShowFormModal(true); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(s)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showFormModal && (
        <StandardFormModal
          standard={editingStandard}
          onClose={() => { setShowFormModal(false); setEditingStandard(null); }}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Standard</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{deleteTarget.name}</span>? This may affect questions, papers, and subject titles that use it.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteTarget(null)}
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

export default StandardsManagement;
