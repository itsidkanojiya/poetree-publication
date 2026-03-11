import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { addAnswerSheet, getAllSubjects, getAllBoards, getSubjectTitlesBySubjectAndContext, getAllStandards, getChaptersBySubjectTitle } from "../../../services/adminService";
import Toast from "../../Common/Toast";

const AddAnswerSheetModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    standard: "",
    subject_id: "",
    subject_title_id: "",
    chapter_id: "",
    board_id: "",
    answersheet_url: null,
    answersheet_coverlink: null,
  });
  const [subjects, setSubjects] = useState([]);
  const [boards, setBoards] = useState([]);
  const [standards, setStandards] = useState([]);
  const [subjectTitles, setSubjectTitles] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
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
  };

  const fetchSubjectTitles = async (subjectId, standardId, boardId) => {
    if (!subjectId || !standardId || !boardId) {
      setSubjectTitles([]);
      return;
    }
    try {
      const list = await getSubjectTitlesBySubjectAndContext(subjectId, {
        board_id: boardId,
        standard: standardId,
      });
      setSubjectTitles(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Error fetching subject titles:", error);
      setSubjectTitles([]);
    }
  };

  useEffect(() => {
    if (formData.subject_id && formData.standard && formData.board_id) {
      fetchSubjectTitles(formData.subject_id, formData.standard, formData.board_id);
    } else {
      setSubjectTitles([]);
    }
  }, [formData.subject_id, formData.standard, formData.board_id]);

  useEffect(() => {
    if (!formData.subject_title_id) {
      setChapters([]);
      return;
    }
    let cancelled = false;
    getChaptersBySubjectTitle(formData.subject_title_id)
      .then((list) => {
        if (!cancelled) setChapters(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (!cancelled) console.error("Error fetching chapters:", err);
      });
    return () => { cancelled = true; };
  }, [formData.subject_title_id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "answersheet_url" || name === "answersheet_coverlink") {
      setFormData((prev) => ({ ...prev, [name]: files[0] || null }));
    } else if (name === "subject_id") {
      setFormData((prev) => ({ ...prev, subject_id: value, subject_title_id: "", chapter_id: "", standard: "" }));
    } else if (name === "standard") {
      setFormData((prev) => ({ ...prev, standard: value, subject_title_id: "", chapter_id: "" }));
    } else if (name === "board_id") {
      setFormData((prev) => ({ ...prev, board_id: value, subject_title_id: "", chapter_id: "" }));
    } else if (name === "subject_title_id") {
      setFormData((prev) => ({ ...prev, [name]: value, chapter_id: "" }));
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
      
      // Get user_id from localStorage if available
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const userId = user?.id;

      const formDataToSend = new FormData();

      // Required fields
      formDataToSend.append("subject_id", formData.subject_id);
      formDataToSend.append("board_id", formData.board_id);
      formDataToSend.append("subject_title_id", formData.subject_title_id);
      formDataToSend.append("standard", formData.standard);
      if (formData.chapter_id) {
        formDataToSend.append("chapter_id", formData.chapter_id);
      }

      // Optional user_id
      if (userId) {
        formDataToSend.append("user_id", userId);
      }
      
      // File uploads
      if (formData.answersheet_url) {
        formDataToSend.append("answersheet_url", formData.answersheet_url);
      }
      if (formData.answersheet_coverlink) {
        formDataToSend.append("answersheet_coverlink", formData.answersheet_coverlink);
      }

      await addAnswerSheet(formDataToSend);
      setToast({ show: true, message: "Answer sheet added successfully", type: "success" });
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to add answer sheet",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.standard) newErrors.standard = "Standard is required";
    if (!formData.subject_id) newErrors.subject_id = "Subject is required";
    if (!formData.subject_title_id) newErrors.subject_title_id = "Subject Title is required";
    if (!formData.board_id) newErrors.board_id = "Board is required";
    if (!formData.answersheet_url) newErrors.answersheet_url = "PDF file is required";
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
            <h3 className="text-2xl font-bold text-gray-800">Add Answer Sheet</h3>
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
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                name="subject_id"
                value={formData.subject_id}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 transition outline-none ${
                  errors.subject_id ? "border-red-300" : "border-gray-200 focus:border-blue-500"
                }`}
                required
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.subject_id} value={s.subject_id}>
                    {s.subject_name}
                  </option>
                ))}
              </select>
              {errors.subject_id && (
                <p className="mt-1 text-sm text-red-600">{errors.subject_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Standard <span className="text-red-500">*</span>
              </label>
              <select
                name="standard"
                value={formData.standard}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 transition outline-none ${
                  errors.standard ? "border-red-300" : "border-gray-200 focus:border-blue-500"
                }`}
                required
              >
                <option value="">Select Standard</option>
                {standards.map((s) => (
                  <option key={s.standard_id} value={s.standard_id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.standard && (
                <p className="mt-1 text-sm text-red-600">{errors.standard}</p>
              )}
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
                required
              >
                <option value="">Select Board</option>
                {boards.map((board) => (
                  <option key={board.board_id} value={board.board_id}>
                    {board.board_name}
                  </option>
                ))}
              </select>
              {errors.board_id && (
                <p className="mt-1 text-sm text-red-600">{errors.board_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject Title <span className="text-red-500">*</span>
              </label>
              <select
                name="subject_title_id"
                value={formData.subject_title_id}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 transition outline-none disabled:bg-gray-100 ${
                  errors.subject_title_id ? "border-red-300" : "border-gray-200 focus:border-blue-500"
                }`}
                required
                disabled={!formData.subject_id || !formData.standard || !formData.board_id}
              >
                <option value="">
                  {formData.subject_id && formData.standard && formData.board_id
                    ? "Select Subject Title"
                    : "Select subject, standard and board first"}
                </option>
                {subjectTitles.map((title) => (
                  <option key={title.subject_title_id ?? title.id} value={title.subject_title_id ?? title.id}>
                    {title.title_name ?? title.subject_title_name ?? title.name}
                  </option>
                ))}
              </select>
              {errors.subject_title_id && (
                <p className="mt-1 text-sm text-red-600">{errors.subject_title_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Chapter (Optional)
              </label>
              <select
                name="chapter_id"
                value={formData.chapter_id}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 transition outline-none disabled:bg-gray-100"
                disabled={!formData.subject_title_id}
              >
                <option value="">No chapter</option>
                {chapters.map((ch) => (
                  <option key={ch.chapter_id} value={ch.chapter_id}>
                    {ch.chapter_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Answer Sheet PDF <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                name="answersheet_url"
                onChange={handleChange}
                accept=".pdf"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                required
              />
              {errors.answersheet_url && (
                <p className="mt-1 text-sm text-red-600">{errors.answersheet_url}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cover Image (Optional)
              </label>
              <input
                type="file"
                name="answersheet_coverlink"
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
                {loading ? "Uploading..." : "Add Answer Sheet"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddAnswerSheetModal;

