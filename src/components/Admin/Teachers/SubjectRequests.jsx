import { useState, useEffect } from "react";
import {
  getSubjectRequests,
  approveSubjectRequest,
  rejectSubjectRequest,
} from "../../../services/adminService";
import { CheckCircle, XCircle, Search, User, Mail, Eye } from "lucide-react";
import Toast from "../../Common/Toast";

const SubjectRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getSubjectRequests();
      setRequests(data?.requests || []);
    } catch (error) {
      setToast({
        show: true,
        message: "Failed to load subject requests",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    if (!searchTerm) {
      setFilteredRequests(requests);
      return;
    }

    const filtered = requests.filter(
      (req) =>
        req.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRequests(filtered);
  };

  const handleApprove = async (requestId, type) => {
    try {
      await approveSubjectRequest(requestId, type);
      setToast({
        show: true,
        message: "Request approved successfully",
        type: "success",
      });
      fetchRequests();
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to approve request",
        type: "error",
      });
    }
  };

  const handleReject = async (requestId, type) => {
    try {
      await rejectSubjectRequest(requestId, type);
      setToast({
        show: true,
        message: "Request rejected successfully",
        type: "success",
      });
      fetchRequests();
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to reject request",
        type: "error",
      });
    }
  };

  const getRequestStatus = (request) => {
    if (request.status === "approved") return "approved";
    if (request.status === "rejected") return "rejected";
    return "pending";
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

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by teacher name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-6">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">No subject requests found</p>
          </div>
        ) : (
          filteredRequests.map((requestGroup) => {
            const user = requestGroup.user || {};
            const summary = requestGroup.summary || {};
            const requestsData = requestGroup.requests || {};

            return (
              <div
                key={user.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                {/* User Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-lg">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{user.name || "N/A"}</h3>
                        <p className="text-blue-100 flex items-center gap-2 mt-1">
                          <Mail className="w-4 h-4" />
                          {user.email || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-blue-100">Status</div>
                      <div className="text-lg font-semibold">
                        {user.is_verified === 1 ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-white">
                            <CheckCircle className="w-4 h-4" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-white">
                            <XCircle className="w-4 h-4" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="p-6 border-b border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        {summary.pending_subjects || 0}
                      </div>
                      <div className="text-sm text-gray-600">Pending Subjects</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {summary.approved_subjects || 0}
                      </div>
                      <div className="text-sm text-gray-600">Approved Subjects</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {summary.rejected_subjects || 0}
                      </div>
                      <div className="text-sm text-gray-600">Rejected Subjects</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        {summary.pending_subject_titles || 0}
                      </div>
                      <div className="text-sm text-gray-600">Pending Titles</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {summary.approved_subject_titles || 0}
                      </div>
                      <div className="text-sm text-gray-600">Approved Titles</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {summary.rejected_subject_titles || 0}
                      </div>
                      <div className="text-sm text-gray-600">Rejected Titles</div>
                    </div>
                  </div>
                </div>

                {/* Subjects Section */}
                {requestsData.subjects && (
                  <div className="p-6 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Subject Requests</h4>
                    <div className="space-y-3">
                      {[
                        ...(requestsData.subjects.pending || []),
                        ...(requestsData.subjects.approved || []),
                        ...(requestsData.subjects.rejected || []),
                      ].map((subject) => {
                        const status = getRequestStatus(subject);
                        return (
                          <div
                            key={subject.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <div className="font-medium text-gray-800">
                                {subject.subject_name || "N/A"}
                              </div>
                              {subject.standard && (
                                <div className="text-sm text-gray-600">
                                  Standard: {subject.standard}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {status === "pending" && (
                                <>
                                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                                    Pending
                                  </span>
                                  <button
                                    onClick={() => handleApprove(subject.id, "subject")}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                    title="Approve"
                                  >
                                    <CheckCircle className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => handleReject(subject.id, "subject")}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Reject"
                                  >
                                    <XCircle className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                              {status === "approved" && (
                                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                                  Approved
                                </span>
                              )}
                              {status === "rejected" && (
                                <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                                  Rejected
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {[
                        ...(requestsData.subjects.pending || []),
                        ...(requestsData.subjects.approved || []),
                        ...(requestsData.subjects.rejected || []),
                      ].length === 0 && (
                        <p className="text-gray-500 text-center py-4">No subject requests</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Subject Titles Section */}
                {requestsData.subject_titles && (
                  <div className="p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                      Subject Title Requests
                    </h4>
                    <div className="space-y-3">
                      {[
                        ...(requestsData.subject_titles.pending || []),
                        ...(requestsData.subject_titles.approved || []),
                        ...(requestsData.subject_titles.rejected || []),
                      ].map((title) => {
                        const status = getRequestStatus(title);
                        return (
                          <div
                            key={title.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <div className="font-medium text-gray-800">
                                {title.subject_title_name || "N/A"}
                              </div>
                              <div className="text-sm text-gray-600">
                                Subject: {title.subject_name || "N/A"}
                                {title.standard && ` | Standard: ${title.standard}`}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {status === "pending" && (
                                <>
                                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                                    Pending
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleApprove(title.id, "subject_title")
                                    }
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                    title="Approve"
                                  >
                                    <CheckCircle className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => handleReject(title.id, "subject_title")}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Reject"
                                  >
                                    <XCircle className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                              {status === "approved" && (
                                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                                  Approved
                                </span>
                              )}
                              {status === "rejected" && (
                                <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                                  Rejected
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {[
                        ...(requestsData.subject_titles.pending || []),
                        ...(requestsData.subject_titles.approved || []),
                        ...(requestsData.subject_titles.rejected || []),
                      ].length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                          No subject title requests
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default SubjectRequests;

