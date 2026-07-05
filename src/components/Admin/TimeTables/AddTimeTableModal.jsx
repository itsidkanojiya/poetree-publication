import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { addTimeTable, getAllSubjects, getAllBoards, getAllStandards } from "../../../services/adminService";
import Toast from "../../Common/Toast";

const AddTimeTableModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    subject_id: "",
    board_id: "",
    standard: [],
    timetable_pdf: null,
  });
  const [subjects, setSubjects] = useState([]);
  const [boards, setBoards] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });

  useEffect(() => {
    (async () => {
      try {
        const [subjectsData, boardsData, standardsData] = await Promise.all([
          getAllSubjects(),
          getAllBoards(),
          getAllStandards(),
        ]);
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
        setBoards(Array.isArray(boardsData) ? boardsData : []);
        const stdList = Array.isArray(standardsData) ? standardsData : [];
        setStandards(stdList.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "timetable_pdf") {
      setFormData((prev) => ({ ...prev, timetable_pdf: files[0] || null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const toggleStandard = (standardId) => {
    const id = Number(standardId);
    setFormData((prev) => {
      const next = prev.standard.includes(id)
        ? prev.standard.filter((s) => s !== id)
        : [...prev.standard, id].sort((a, b) => a - b);
      return { ...prev, standard: next };
    });
    if (errors.standard) setErrors((prev) => ({ ...prev, standard: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.subject_id) newErrors.subject_id = "Subject is required";
    if (!formData.board_id) newErrors.board_id = "Board is required";
    if (!formData.standard.length) newErrors.standard = "Select at least one standard";
    if (!formData.timetable_pdf) newErrors.timetable_pdf = "PDF file is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const userId = user?.id;

      const fd = new FormData();
      fd.append("title", formData.title.trim());
      fd.append("subject_id", formData.subject_id);
      fd.append("board_id", formData.board_id);
      fd.append("standard", JSON.stringify(formData.standard.map(Number)));
      if (userId) fd.append("user_id", userId);
      fd.append("timetable_pdf", formData.timetable_pdf);

      await addTimeTable(fd);
      setToast({ show: true, message: "Time table added successfully", type: "success" });
      setTimeout(() => onSuccess(), 900);
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.error || error.response?.data?.message || "Failed to add time table",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      )}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full my-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Add Time Table</h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter a title"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 transition outline-none ${
                  errors.title ? "border-red-300" : "border-gray-200 focus:border-blue-500"
                }`}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                name="subject_id"
                value={formData.subject_id}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 transition outline-none ${
                  errors.subject_id ? "border-red-300" : "border-gray-200 focus:border-blue-500"
                }`}
              >
                <option value="">Select a subject</option>
                {subjects.map((s) => (
                  <option key={s.subject_id} value={s.subject_id}>
                    {s.subject_name}
                  </option>
                ))}
              </select>
              {errors.subject_id && <p className="mt-1 text-sm text-red-600">{errors.subject_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Board <span className="text-red-500">*</span>
              </label>
              <select
                name="board_id"
                value={formData.board_id}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 transition outline-none ${
                  errors.board_id ? "border-red-300" : "border-gray-200 focus:border-blue-500"
                }`}
              >
                <option value="">Select a board</option>
                {boards.map((b) => (
                  <option key={b.board_id} value={b.board_id}>
                    {b.board_name}
                  </option>
                ))}
              </select>
              {errors.board_id && <p className="mt-1 text-sm text-red-600">{errors.board_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Standards <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">Select one or more standards</p>
              <div
                className={`flex flex-wrap gap-2 p-3 border-2 rounded-lg min-h-[52px] ${
                  errors.standard ? "border-red-300" : "border-gray-200 focus-within:border-blue-500"
                }`}
              >
                {standards.map((s) => (
                  <label
                    key={s.standard_id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300 has-[:checked]:text-blue-700"
                  >
                    <input
                      type="checkbox"
                      checked={formData.standard.includes(Number(s.standard_id))}
                      onChange={() => toggleStandard(s.standard_id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">{s.name}</span>
                  </label>
                ))}
              </div>
              {formData.standard.length > 0 && (
                <p className="mt-1.5 text-sm text-gray-600">
                  Selected: {formData.standard.map((id) => standards.find((st) => Number(st.standard_id) === id)?.name ?? id).join(", ")}
                </p>
              )}
              {errors.standard && <p className="mt-1 text-sm text-red-600">{errors.standard}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Time Table PDF <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                name="timetable_pdf"
                onChange={handleChange}
                accept=".pdf"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none ${
                  errors.timetable_pdf ? "border-red-300" : "border-gray-200"
                }`}
              />
              {errors.timetable_pdf && <p className="mt-1 text-sm text-red-600">{errors.timetable_pdf}</p>}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition font-semibold disabled:opacity-50"
              >
                {loading ? "Uploading..." : "Add Time Table"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddTimeTableModal;
