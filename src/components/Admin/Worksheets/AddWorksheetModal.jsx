import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { addWorksheet, getAllSubjects, getAllBoards } from "../../../services/adminService";
import Toast from "../../Common/Toast";

const AddWorksheetModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    standard: "",
    subject_id: "",
    subject_title_id: "",
    board_id: "",
    worksheet_url: null,
    worksheet_coverlink: null,
  });
  const [subjects, setSubjects] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [subjectsData, boardsData] = await Promise.all([
        getAllSubjects(),
        getAllBoards(),
      ]);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      setBoards(Array.isArray(boardsData) ? boardsData : []);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "worksheet_url" || name === "worksheet_coverlink") {
      setFormData((prev) => ({ ...prev, [name]: files[0] || null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const formDataToSend = new FormData();

      formDataToSend.append("standard", formData.standard);
      if (formData.subject_id) formDataToSend.append("subject_id", formData.subject_id);
      if (formData.subject_title_id) formDataToSend.append("subject_title_id", formData.subject_title_id);
      if (formData.board_id) formDataToSend.append("board_id", formData.board_id);
      if (formData.worksheet_url) formDataToSend.append("worksheet_url", formData.worksheet_url);
      if (formData.worksheet_coverlink) formDataToSend.append("worksheet_coverlink", formData.worksheet_coverlink);

      await addWorksheet(formDataToSend);
      setToast({ show: true, message: "Worksheet added successfully", type: "success" });
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to add worksheet",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.standard) newErrors.standard = "Standard is required";
    if (!formData.worksheet_url) newErrors.worksheet_url = "PDF file is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Add Worksheet</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Standard <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="standard"
                value={formData.standard}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                placeholder="e.g., 10"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject
              </label>
              <select
                name="subject_id"
                value={formData.subject_id}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject.subject_id} value={subject.subject_id}>
                    {subject.subject_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Board
              </label>
              <select
                name="board_id"
                value={formData.board_id}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
              >
                <option value="">Select Board</option>
                {boards.map((board) => (
                  <option key={board.board_id} value={board.board_id}>
                    {board.board_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Worksheet PDF <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                name="worksheet_url"
                onChange={handleChange}
                accept=".pdf"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                required
              />
              {errors.worksheet_url && (
                <p className="mt-1 text-sm text-red-600">{errors.worksheet_url}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cover Image (Optional)
              </label>
              <input
                type="file"
                name="worksheet_coverlink"
                onChange={handleChange}
                accept="image/*"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
              />
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
                {loading ? "Uploading..." : "Add Worksheet"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddWorksheetModal;

