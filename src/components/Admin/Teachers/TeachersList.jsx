import { useState, useEffect } from "react";
import {
  getAllTeachers,
  activateTeacher,
  deactivateTeacher,
  deleteTeacher,
} from "../../../services/adminService";
import {
  UserCheck,
  UserX,
  Trash2,
  Search,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Toast from "../../Common/Toast";
import Loader from "../../Common/loader/loader";

const TeachersList = ({ filterType = "all" }) => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    filterTeachers();
  }, [teachers, searchTerm, filterType]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const data = await getAllTeachers();
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      setToast({
        show: true,
        message: "Failed to load teachers",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTeachers = () => {
    let filtered = teachers;

    // Filter by type (all, active, pending)
    if (filterType === "active") {
      filtered = filtered.filter((t) => t.is_verified === 1);
    } else if (filterType === "pending") {
      filtered = filtered.filter((t) => t.is_verified === 0);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTeachers(filtered);
  };

  const handleActivate = async (id) => {
    try {
      await activateTeacher(id);
      setToast({
        show: true,
        message: "Teacher activated successfully",
        type: "success",
      });
      fetchTeachers();
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to activate teacher",
        type: "error",
      });
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await deactivateTeacher(id);
      setToast({
        show: true,
        message: "Teacher deactivated successfully",
        type: "success",
      });
      fetchTeachers();
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to deactivate teacher",
        type: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedTeacher) return;
    try {
      await deleteTeacher(selectedTeacher.id);
      setToast({
        show: true,
        message: "Teacher deleted successfully",
        type: "success",
      });
      setShowDeleteModal(false);
      setSelectedTeacher(null);
      fetchTeachers();
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to delete teacher",
        type: "error",
      });
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
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
          />
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Username</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No teachers found
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {teacher.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{teacher.email || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {teacher.username || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {teacher.is_verified === 1 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                          <XCircle className="w-4 h-4" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {teacher.is_verified === 1 ? (
                          <button
                            onClick={() => handleDeactivate(teacher.id)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Deactivate"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(teacher.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Activate"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Teacher</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{selectedTeacher?.name}</span>? This action cannot
              be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedTeacher(null);
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

export default TeachersList;

