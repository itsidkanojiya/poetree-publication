import { useState, useEffect } from "react";
import {
  getAnimations,
  createAnimation,
  updateAnimation,
  deleteAnimation,
  getAllSubjects,
  getAllBoards,
  getAllStandards,
  getAllSubjectTitles,
} from "../../../services/adminService";
import { Plus, Trash2, Search, Pencil, Film } from "lucide-react";
import Toast from "../../Common/Toast";
import Loader from "../../Common/loader/loader";

const getThumbUrl = (videoId) => videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

const AnimationFormModal = ({ animation, subjects, subjectTitles, boards, standards, onClose, onSave }) => {
  const isEdit = !!animation;
  const [formData, setFormData] = useState({
    youtube_url: animation?.youtube_url ?? "",
    title: animation?.title ?? "",
    subject_id: animation?.subject_id ?? animation?.subject?.subject_id ?? "",
    subject_title_id: animation?.subject_title_id ?? animation?.subject_title?.subject_title_id ?? "",
    board_id: animation?.board_id ?? animation?.board?.board_id ?? "",
    standard_id: animation?.standard_id ?? animation?.standard?.standard_id ?? "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const titlesForSubject = (subjectId) => {
    if (!subjectId) return [];
    return (subjectTitles || []).filter((t) => String(t.subject_id ?? t.subject?.subject_id) === String(subjectId));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "subject_id") {
        next.subject_title_id = "";
      }
      return next;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!String(formData.youtube_url).trim()) newErrors.youtube_url = "YouTube URL is required";
    if (!formData.subject_id) newErrors.subject_id = "Subject is required";
    if (!formData.subject_title_id) newErrors.subject_title_id = "Subject title is required";
    if (!formData.board_id) newErrors.board_id = "Board is required";
    if (!formData.standard_id) newErrors.standard_id = "Standard is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const body = {
        youtube_url: String(formData.youtube_url).trim(),
        subject_id: Number(formData.subject_id),
        subject_title_id: Number(formData.subject_title_id),
        board_id: Number(formData.board_id),
        standard_id: Number(formData.standard_id),
        ...(String(formData.title).trim() && { title: String(formData.title).trim() }),
      };
      await onSave(body);
      onClose();
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const titleOptions = titlesForSubject(formData.subject_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-6">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 my-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            {isEdit ? "Edit Animation" : "Add Animation"}
          </h3>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition">
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              YouTube URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              name="youtube_url"
              value={formData.youtube_url}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition ${
                errors.youtube_url ? "border-red-300" : "border-gray-200 focus:border-blue-500"
              }`}
              placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
            />
            {errors.youtube_url && <p className="mt-1 text-sm text-red-600">{errors.youtube_url}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Title (optional)</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition"
              placeholder="My Animation"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              name="subject_id"
              value={formData.subject_id}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition ${
                errors.subject_id ? "border-red-300" : "border-gray-200 focus:border-blue-500"
              }`}
            >
              <option value="">Select subject</option>
              {(subjects || []).map((s) => (
                <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>
              ))}
            </select>
            {errors.subject_id && <p className="mt-1 text-sm text-red-600">{errors.subject_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subject Title <span className="text-red-500">*</span>
            </label>
            <select
              name="subject_title_id"
              value={formData.subject_title_id}
              onChange={handleChange}
              disabled={!formData.subject_id}
              className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition disabled:bg-gray-100 ${
                errors.subject_title_id ? "border-red-300" : "border-gray-200 focus:border-blue-500"
              }`}
            >
              <option value="">{formData.subject_id ? "Select subject title" : "Select subject first"}</option>
              {titleOptions.map((t) => (
                <option key={t.subject_title_id ?? t.id} value={t.subject_title_id ?? t.id}>
                  {t.title_name ?? t.subject_title_name ?? t.name}
                </option>
              ))}
            </select>
            {errors.subject_title_id && <p className="mt-1 text-sm text-red-600">{errors.subject_title_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Board <span className="text-red-500">*</span>
            </label>
            <select
              name="board_id"
              value={formData.board_id}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition ${
                errors.board_id ? "border-red-300" : "border-gray-200 focus:border-blue-500"
              }`}
            >
              <option value="">Select board</option>
              {(boards || []).map((b) => (
                <option key={b.board_id} value={b.board_id}>{b.board_name}</option>
              ))}
            </select>
            {errors.board_id && <p className="mt-1 text-sm text-red-600">{errors.board_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Standard <span className="text-red-500">*</span>
            </label>
            <select
              name="standard_id"
              value={formData.standard_id}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition ${
                errors.standard_id ? "border-red-300" : "border-gray-200 focus:border-blue-500"
              }`}
            >
              <option value="">Select standard</option>
              {(standards || []).map((s) => (
                <option key={s.standard_id} value={s.standard_id}>{s.name}</option>
              ))}
            </select>
            {errors.standard_id && <p className="mt-1 text-sm text-red-600">{errors.standard_id}</p>}
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

const AnimationsManagement = () => {
  const [animations, setAnimations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAnimation, setEditingAnimation] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [subjectTitles, setSubjectTitles] = useState([]);
  const [boards, setBoards] = useState([]);
  const [standards, setStandards] = useState([]);

  const fetchAnimations = async () => {
    try {
      setLoading(true);
      const list = await getAnimations();
      setAnimations(Array.isArray(list) ? list : []);
      setFiltered(Array.isArray(list) ? list : []);
    } catch (err) {
      setToast({ show: true, message: "Failed to load animations", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimations();
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAllSubjects(), getAllSubjectTitles(), getAllBoards(), getAllStandards()])
      .then(([subs, titles, bds, stds]) => {
        if (cancelled) return;
        setSubjects(Array.isArray(subs) ? subs : []);
        setSubjectTitles(Array.isArray(titles) ? titles : []);
        setBoards(Array.isArray(bds) ? bds : []);
        const sList = Array.isArray(stds) ? stds : [];
        setStandards(sList.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFiltered(animations);
      return;
    }
    const term = searchTerm.toLowerCase();
    setFiltered(animations.filter((a) => {
      const sub = a.subject?.subject_name || "";
      const tit = a.subject_title?.title_name || "";
      const brd = a.board?.board_name || "";
      const std = a.standard?.name || "";
      return (a.title || "").toLowerCase().includes(term) ||
        (a.youtube_url || "").toLowerCase().includes(term) ||
        sub.toLowerCase().includes(term) || tit.toLowerCase().includes(term) ||
        brd.toLowerCase().includes(term) || std.toLowerCase().includes(term);
    }));
  }, [animations, searchTerm]);

  const handleSave = async (body) => {
    if (editingAnimation) {
      await updateAnimation(editingAnimation.animation_id, body);
      setToast({ show: true, message: "Animation updated successfully", type: "success" });
    } else {
      await createAnimation(body);
      setToast({ show: true, message: "Animation added successfully", type: "success" });
    }
    setEditingAnimation(null);
    setShowFormModal(false);
    fetchAnimations();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAnimation(deleteTarget.animation_id);
      setToast({ show: true, message: "Animation deleted successfully", type: "success" });
      setDeleteTarget(null);
      fetchAnimations();
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
            Manage Animations
          </h1>
          <p className="text-gray-600">Add or edit YouTube videos shown on the user Animations page. Thumbnails are taken from the link automatically.</p>
        </div>
        <button
          onClick={() => { setEditingAnimation(null); setShowFormModal(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add Animation
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or URL..."
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
                <th className="px-6 py-4 text-left text-sm font-semibold">Preview</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Subject</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Subject Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Board</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Standard</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No animations found
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const vid = a.video_id || (a.youtube_url && a.youtube_url.match(/(?:v=|\/)([\w-]{11})(?:\?|&|$)/)?.[1]);
                  const thumb = getThumbUrl(vid);
                  return (
                    <tr key={a.animation_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        {thumb ? (
                          <img src={thumb} alt="" className="w-24 aspect-video object-cover rounded-lg border border-gray-200" />
                        ) : (
                          <div className="w-24 aspect-video rounded-lg bg-gray-200 flex items-center justify-center">
                            <Film className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.title || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.subject?.subject_name ?? "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.subject_title?.title_name ?? "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.board?.board_name ?? "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.standard?.name ?? "—"}</td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setEditingAnimation(a); setShowFormModal(true); }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(a)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showFormModal && (
        <AnimationFormModal
          animation={editingAnimation}
          subjects={subjects}
          subjectTitles={subjectTitles}
          boards={boards}
          standards={standards}
          onClose={() => { setShowFormModal(false); setEditingAnimation(null); }}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Animation</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{deleteTarget.title || "this video"}</span>?
            </p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AnimationsManagement;
