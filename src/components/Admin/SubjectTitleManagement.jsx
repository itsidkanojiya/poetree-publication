import { useState, useEffect } from "react";
import {
  getAllSubjectTitles,
  getAllSubjects,
  addSubjectTitle,
  deleteSubjectTitle,
} from "../../services/adminService";
import { BookOpen, Plus, Trash2, Loader2, X } from "lucide-react";
import Toast from "../Common/Toast";

const SubjectTitleManagement = () => {
  const [subjectTitles, setSubjectTitles] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title_name: "",
    subject_id: "",
    standard: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [titlesData, subjectsData] = await Promise.all([
        getAllSubjectTitles(),
        getAllSubjects(),
      ]);
      setSubjectTitles(Array.isArray(titlesData) ? titlesData : []);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
      setToast({
        message: "Failed to load data",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addSubjectTitle({
        title_name: formData.title_name,
        subject_id: parseInt(formData.subject_id),
        standard: formData.standard,
      });
      setToast({
        message: "Subject title added successfully",
        type: "success",
      });
      setShowAddModal(false);
      setFormData({ title_name: "", subject_id: "", standard: "" });
      fetchData();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to add subject title",
        type: "error",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject title?")) {
      return;
    }
    try {
      await deleteSubjectTitle(id);
      setToast({
        message: "Subject title deleted successfully",
        type: "success",
      });
      fetchData();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to delete subject title",
        type: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading subject titles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Subject Title Management
                </h1>
                <p className="text-gray-600">Manage subject titles and chapters</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} />
            <span>Add Subject Title</span>
          </button>
        </div>

        {/* Subject Titles Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">ID</th>
                  <th className="px-6 py-4 text-left font-semibold">Title Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Subject</th>
                  <th className="px-6 py-4 text-left font-semibold">Standard</th>
                  <th className="px-6 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {subjectTitles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No subject titles found
                    </td>
                  </tr>
                ) : (
                  subjectTitles.map((title) => (
                    <tr key={title.subject_title_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{title.subject_title_id}</td>
                      <td className="px-6 py-4 font-medium">
                        {title.title_name || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        {title.subject || title.subject_name || "N/A"}
                      </td>
                      <td className="px-6 py-4">{title.standard || "N/A"}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDelete(title.subject_title_id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Add Subject Title</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ title_name: "", subject_id: "", standard: "" });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title Name
                </label>
                <input
                  type="text"
                  name="title_name"
                  value={formData.title_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                  placeholder="Enter subject title name"
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
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option
                      key={subject.subject_id}
                      value={subject.subject_id}
                    >
                      {subject.subject_name} - {subject.standard}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Standard
                </label>
                <input
                  type="text"
                  name="standard"
                  value={formData.standard}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                  placeholder="Enter standard (e.g., 10, 11-12)"
                  required
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ title_name: "", subject_id: "", standard: "" });
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add Subject Title
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectTitleManagement;

