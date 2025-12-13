import { useState, useEffect } from "react";
import {
  getAllSubjectTitles,
  getAllSubjects,
  addSubjectTitle,
  deleteSubjectTitle,
} from "../../../services/adminService";
import { Plus, Trash2, Search, BookOpen } from "lucide-react";
import Toast from "../../Common/Toast";
import AddSubjectTitleModal from "./AddSubjectTitleModal";

const SubjectTitleManagement = () => {
  const [subjectTitles, setSubjectTitles] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filteredTitles, setFilteredTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterTitles();
  }, [subjectTitles, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [titlesData, subjectsData] = await Promise.all([
        getAllSubjectTitles(),
        getAllSubjects(),
      ]);
      setSubjectTitles(Array.isArray(titlesData) ? titlesData : []);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
    } catch (error) {
      setToast({
        show: true,
        message: "Failed to load data",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTitles = () => {
    if (!searchTerm) {
      setFilteredTitles(subjectTitles);
      return;
    }

    const filtered = subjectTitles.filter(
      (title) =>
        title.title_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        title.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        title.standard?.toString().includes(searchTerm)
    );
    setFilteredTitles(filtered);
  };

  const handleAdd = async (data) => {
    try {
      await addSubjectTitle(data);
      setToast({
        show: true,
        message: "Subject title added successfully",
        type: "success",
      });
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to add subject title",
        type: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedTitle) return;
    try {
      await deleteSubjectTitle(selectedTitle.subject_title_id);
      setToast({
        show: true,
        message: "Subject title deleted successfully",
        type: "success",
      });
      setShowDeleteModal(false);
      setSelectedTitle(null);
      fetchData();
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to delete subject title",
        type: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            Subject Title Management
          </h1>
          <p className="text-gray-600">Manage subject titles and chapters</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Add Subject Title</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title name, subject, or standard..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
          />
        </div>
      </div>

      {/* Subject Titles Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Title Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Subject</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Standard</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTitles.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No subject titles found
                  </td>
                </tr>
              ) : (
                filteredTitles.map((title) => (
                  <tr key={title.subject_title_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {title.title_name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {title.subject || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {title.standard || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => {
                          setSelectedTitle(title);
                          setShowDeleteModal(true);
                        }}
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

      {/* Add Modal */}
      {showAddModal && (
        <AddSubjectTitleModal
          subjects={subjects}
          onClose={() => setShowAddModal(false)}
          onSave={handleAdd}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Subject Title</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{selectedTitle?.title_name}</span>? This action
              cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedTitle(null);
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

export default SubjectTitleManagement;

