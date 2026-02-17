import { useState } from "react";
import { X } from "lucide-react";

const AddSubjectTitleModal = ({ subjects, standards = [], boards = [], onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title_name: "",
    subject_id: "",
    board_id: "",
    standard: [],
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const toggleStandard = (standardId) => {
    const id = Number(standardId);
    setFormData((prev) => {
      const next = prev.standard.includes(id)
        ? prev.standard.filter((s) => s !== id)
        : [...prev.standard, id].sort((a, b) => a - b);
      return { ...prev, standard: next };
    });
    if (errors.standard) {
      setErrors((prev) => ({ ...prev, standard: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title_name.trim()) {
      newErrors.title_name = "Title name is required";
    }
    if (!formData.subject_id) {
      newErrors.subject_id = "Subject is required";
    }
    if (!formData.board_id) {
      newErrors.board_id = "Board is required";
    }
    if (!formData.standard.length) {
      newErrors.standard = "Select at least one standard";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        title_name: formData.title_name,
        subject_id: parseInt(formData.subject_id, 10),
        board_id: parseInt(formData.board_id, 10),
        standard: formData.standard.map(Number),
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Add Subject Title</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title_name"
              value={formData.title_name}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 transition outline-none ${
                errors.title_name ? "border-red-300" : "border-gray-200 focus:border-blue-500"
              }`}
              placeholder="Enter title name (e.g., Algebra, Geometry)"
            />
            {errors.title_name && (
              <p className="mt-1 text-sm text-red-600">{errors.title_name}</p>
            )}
          </div>

          {/* Subject - required */}
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
              {(subjects || []).map((subject) => (
                <option key={subject.subject_id} value={subject.subject_id}>
                  {subject.subject_name}
                </option>
              ))}
            </select>
            {errors.subject_id && (
              <p className="mt-1 text-sm text-red-600">{errors.subject_id}</p>
            )}
          </div>

          {/* Board - required */}
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
              {(boards || []).map((board) => (
                <option key={board.board_id} value={board.board_id}>
                  {board.board_name}
                </option>
              ))}
            </select>
            {errors.board_id && (
              <p className="mt-1 text-sm text-red-600">{errors.board_id}</p>
            )}
          </div>

          {/* Standard - multi-select from API */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Standard <span className="text-red-500">*</span>
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
            {errors.standard && (
              <p className="mt-1 text-sm text-red-600">{errors.standard}</p>
            )}
          </div>

          {/* Buttons */}
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
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition font-semibold"
            >
              Add Subject Title
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubjectTitleModal;

