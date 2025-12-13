import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  getAllTeachers,
  activateTeacher,
  deactivateTeacher,
  deleteTeacher,
  getUserSelections,
  approveUserSelections,
} from "../../services/adminService";
import {
  Users,
  UserCheck,
  UserX,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import Toast from "../Common/Toast";

const TeacherManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0); // 0: Pending, 1: Active
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showSelectionsModal, setShowSelectionsModal] = useState(false);
  const [userSelections, setUserSelections] = useState(null);
  const [loadingSelections, setLoadingSelections] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllTeachers();
      setTeachers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setError("Failed to load teachers");
      setToast({
        message: "Failed to load teachers",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      await activateTeacher(id);
      setToast({
        message: "Teacher activated successfully",
        type: "success",
      });
      fetchTeachers();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to activate teacher",
        type: "error",
      });
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await deactivateTeacher(id);
      setToast({
        message: "Teacher deactivated successfully",
        type: "success",
      });
      fetchTeachers();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to deactivate teacher",
        type: "error",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this teacher?")) {
      return;
    }
    try {
      await deleteTeacher(id);
      setToast({
        message: "Teacher deleted successfully",
        type: "success",
      });
      fetchTeachers();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to delete teacher",
        type: "error",
      });
    }
  };

  const handleViewSelections = async (userId) => {
    setSelectedUser(userId);
    setShowSelectionsModal(true);
    setLoadingSelections(true);
    try {
      const data = await getUserSelections(userId);
      setUserSelections(data);
    } catch (err) {
      setToast({
        message: "Failed to load user selections",
        type: "error",
      });
    } finally {
      setLoadingSelections(false);
    }
  };

  const handleApproveSelections = async () => {
    if (!userSelections || !selectedUser) return;

    const subjectIds =
      userSelections.subjects
        ?.filter((s) => s.is_selected)
        .map((s) => s.subject_id) || [];
    const subjectTitleIds =
      userSelections.subject_titles
        ?.filter((s) => s.is_selected)
        .map((s) => s.subject_title_id) || [];

    try {
      await approveUserSelections(selectedUser, {
        subject_ids: subjectIds,
        subject_title_ids: subjectTitleIds,
        reject_others: true,
      });
      setToast({
        message: "Selections approved and user activated successfully",
        type: "success",
      });
      setShowSelectionsModal(false);
      fetchTeachers();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to approve selections",
        type: "error",
      });
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    if (activeTab === 0) {
      // Pending: is_verified === 0
      return teacher.is_verified === 0 || teacher.is_verified === false;
    } else {
      // Active: is_verified === 1
      return teacher.is_verified === 1 || teacher.is_verified === true;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading teachers...</p>
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
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Teacher Management
          </h1>
          <p className="text-gray-600">Manage teachers and their access</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab(0)}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 0
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <UserX size={20} />
                <span>Pending Teachers ({filteredTeachers.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab(1)}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 1
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCheck size={20} />
                <span>Active Teachers ({filteredTeachers.length})</span>
              </div>
            </button>
          </div>
        </div>

        {/* Teachers Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">ID</th>
                  <th className="px-6 py-4 text-left font-semibold">Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Email</th>
                  <th className="px-6 py-4 text-left font-semibold">Username</th>
                  <th className="px-6 py-4 text-left font-semibold">School</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No {activeTab === 0 ? "pending" : "active"} teachers found
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{teacher.id}</td>
                      <td className="px-6 py-4 font-medium">{teacher.name || "N/A"}</td>
                      <td className="px-6 py-4">{teacher.email || "N/A"}</td>
                      <td className="px-6 py-4">{teacher.username || "N/A"}</td>
                      <td className="px-6 py-4">{teacher.school_name || "N/A"}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            teacher.is_verified === 1 || teacher.is_verified === true
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {teacher.is_verified === 1 || teacher.is_verified === true
                            ? "Active"
                            : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {activeTab === 0 && (
                            <>
                              <button
                                onClick={() => handleViewSelections(teacher.id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="View Selections"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => handleActivate(teacher.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                title="Activate"
                              >
                                <CheckCircle size={18} />
                              </button>
                            </>
                          )}
                          {activeTab === 1 && (
                            <button
                              onClick={() => handleDeactivate(teacher.id)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title="Deactivate"
                            >
                              <XCircle size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(teacher.id)}
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

      {/* Selections Modal */}
      {showSelectionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">User Selections</h2>
              <button
                onClick={() => {
                  setShowSelectionsModal(false);
                  setUserSelections(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6">
              {loadingSelections ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading selections...</p>
                </div>
              ) : (
                <>
                  {/* Subjects */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Subjects</h3>
                    {userSelections?.subjects?.length > 0 ? (
                      <div className="space-y-2">
                        {userSelections.subjects.map((subject, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border-2 ${
                              subject.is_selected
                                ? "bg-green-50 border-green-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-800">
                                  {subject.subject_name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Standard: {subject.standard}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  subject.is_selected
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {subject.is_selected ? "Selected" : "Not Selected"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No subjects selected</p>
                    )}
                  </div>

                  {/* Subject Titles */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Subject Titles
                    </h3>
                    {userSelections?.subject_titles?.length > 0 ? (
                      <div className="space-y-2">
                        {userSelections.subject_titles.map((title, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border-2 ${
                              title.is_selected
                                ? "bg-green-50 border-green-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-800">
                                  {title.subject_title_name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Subject: {title.subject_name} | Standard: {title.standard}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  title.is_selected
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {title.is_selected ? "Selected" : "Not Selected"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No subject titles selected</p>
                    )}
                  </div>

                  {/* Approve Button */}
                  <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowSelectionsModal(false);
                        setUserSelections(null);
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApproveSelections}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Approve Selections & Activate User
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;

