import { useState, useEffect } from "react";
import {
  getSubjectRequests,
  approveSubjectRequest,
  rejectSubjectRequest,
} from "../../services/adminService";
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
} from "lucide-react";
import Toast from "../Common/Toast";

const AdminSubjectRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSubjectRequests();
      setRequests(data?.requests || []);
    } catch (err) {
      console.error("Error fetching subject requests:", err);
      setError("Failed to load subject requests");
      setToast({
        message: "Failed to load subject requests",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, type) => {
    try {
      await approveSubjectRequest(requestId, type);
      setToast({
        message: "Request approved successfully",
        type: "success",
      });
      fetchRequests();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to approve request",
        type: "error",
      });
    }
  };

  const handleReject = async (requestId, type) => {
    if (!window.confirm("Are you sure you want to reject this request?")) {
      return;
    }
    try {
      await rejectSubjectRequest(requestId, type);
      setToast({
        message: "Request rejected successfully",
        type: "success",
      });
      fetchRequests();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to reject request",
        type: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading subject requests...</p>
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
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Subject Requests
              </h1>
              <p className="text-gray-600">Manage teacher subject and subject title requests</p>
            </div>
          </div>
          <div className="mt-4 bg-white rounded-lg p-4 shadow">
            <div className="flex items-center gap-2 text-gray-700">
              <Users size={20} />
              <span className="font-semibold">
                Total Users: {requests.length}
              </span>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No subject requests found</p>
            </div>
          ) : (
            requests.map((requestGroup, index) => (
              <div
                key={requestGroup.user?.id || index}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                {/* User Header */}
                <div
                  className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() =>
                    setExpandedUser(
                      expandedUser === requestGroup.user?.id
                        ? null
                        : requestGroup.user?.id
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {requestGroup.user?.name || "Unknown User"}
                      </h3>
                      <p className="text-gray-600">{requestGroup.user?.email}</p>
                      <div className="flex gap-4 mt-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            requestGroup.user?.is_verified === 1 ||
                            requestGroup.user?.is_verified === true
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {requestGroup.user?.is_verified === 1 ||
                          requestGroup.user?.is_verified === true
                            ? "Verified"
                            : "Not Verified"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">Summary</div>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Pending:</span>
                          <span className="font-bold text-amber-600 ml-2">
                            {requestGroup.summary?.pending_subjects || 0} subjects,{" "}
                            {requestGroup.summary?.pending_subject_titles || 0} titles
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Approved:</span>
                          <span className="font-bold text-green-600 ml-2">
                            {requestGroup.summary?.approved_subjects || 0} subjects,{" "}
                            {requestGroup.summary?.approved_subject_titles || 0} titles
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedUser === requestGroup.user?.id && (
                  <div className="p-6 space-y-6">
                    {/* Subjects Section */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">
                        Subjects
                      </h4>
                      <div className="space-y-3">
                        {/* Pending Subjects */}
                        {requestGroup.requests?.subjects?.pending?.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold text-amber-600 mb-2">
                              Pending ({requestGroup.requests.subjects.pending.length})
                            </div>
                            <div className="space-y-2">
                              {requestGroup.requests.subjects.pending.map(
                                (subject, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg"
                                  >
                                    <div>
                                      <p className="font-medium text-gray-800">
                                        {subject.subject_name || "N/A"}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        Standard: {subject.standard || "N/A"}
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() =>
                                          handleApprove(subject.id, "subject")
                                        }
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                      >
                                        <CheckCircle size={18} />
                                        Approve
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleReject(subject.id, "subject")
                                        }
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                                      >
                                        <XCircle size={18} />
                                        Reject
                                      </button>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Approved Subjects */}
                        {requestGroup.requests?.subjects?.approved?.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold text-green-600 mb-2">
                              Approved ({requestGroup.requests.subjects.approved.length})
                            </div>
                            <div className="space-y-2">
                              {requestGroup.requests.subjects.approved.map(
                                (subject, idx) => (
                                  <div
                                    key={idx}
                                    className="p-4 bg-green-50 border border-green-200 rounded-lg"
                                  >
                                    <p className="font-medium text-gray-800">
                                      {subject.subject_name || "N/A"}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Standard: {subject.standard || "N/A"}
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Rejected Subjects */}
                        {requestGroup.requests?.subjects?.rejected?.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold text-red-600 mb-2">
                              Rejected ({requestGroup.requests.subjects.rejected.length})
                            </div>
                            <div className="space-y-2">
                              {requestGroup.requests.subjects.rejected.map(
                                (subject, idx) => (
                                  <div
                                    key={idx}
                                    className="p-4 bg-red-50 border border-red-200 rounded-lg"
                                  >
                                    <p className="font-medium text-gray-800">
                                      {subject.subject_name || "N/A"}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Standard: {subject.standard || "N/A"}
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subject Titles Section */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">
                        Subject Titles
                      </h4>
                      <div className="space-y-3">
                        {/* Pending Subject Titles */}
                        {requestGroup.requests?.subject_titles?.pending?.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold text-amber-600 mb-2">
                              Pending ({requestGroup.requests.subject_titles.pending.length})
                            </div>
                            <div className="space-y-2">
                              {requestGroup.requests.subject_titles.pending.map(
                                (title, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg"
                                  >
                                    <div>
                                      <p className="font-medium text-gray-800">
                                        {title.subject_title_name || "N/A"}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        Subject: {title.subject_name || "N/A"} | Standard:{" "}
                                        {title.standard || "N/A"}
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() =>
                                          handleApprove(title.id, "subject_title")
                                        }
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                      >
                                        <CheckCircle size={18} />
                                        Approve
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleReject(title.id, "subject_title")
                                        }
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                                      >
                                        <XCircle size={18} />
                                        Reject
                                      </button>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Approved Subject Titles */}
                        {requestGroup.requests?.subject_titles?.approved?.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold text-green-600 mb-2">
                              Approved ({requestGroup.requests.subject_titles.approved.length})
                            </div>
                            <div className="space-y-2">
                              {requestGroup.requests.subject_titles.approved.map(
                                (title, idx) => (
                                  <div
                                    key={idx}
                                    className="p-4 bg-green-50 border border-green-200 rounded-lg"
                                  >
                                    <p className="font-medium text-gray-800">
                                      {title.subject_title_name || "N/A"}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Subject: {title.subject_name || "N/A"} | Standard:{" "}
                                      {title.standard || "N/A"}
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Rejected Subject Titles */}
                        {requestGroup.requests?.subject_titles?.rejected?.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold text-red-600 mb-2">
                              Rejected ({requestGroup.requests.subject_titles.rejected.length})
                            </div>
                            <div className="space-y-2">
                              {requestGroup.requests.subject_titles.rejected.map(
                                (title, idx) => (
                                  <div
                                    key={idx}
                                    className="p-4 bg-red-50 border border-red-200 rounded-lg"
                                  >
                                    <p className="font-medium text-gray-800">
                                      {title.subject_title_name || "N/A"}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Subject: {title.subject_name || "N/A"} | Standard:{" "}
                                      {title.standard || "N/A"}
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSubjectRequests;

