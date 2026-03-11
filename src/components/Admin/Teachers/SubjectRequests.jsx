import { useState, useEffect } from "react";
import {
  getSubjectRequests,
  approveUserSelections,
  rejectSubjectRequest,
} from "../../../services/adminService";
import {
  CheckCircle,
  XCircle,
  Search,
  User,
  Mail,
  Eye,
  Phone,
  School,
  X,
} from "lucide-react";
import Toast from "../../Common/Toast";
import Loader from "../../Common/loader/loader";

const SubjectRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [actionLoadingKey, setActionLoadingKey] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);

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
      const rawRequests = data?.requests || [];
      // Sort so users with more pending items appear first
      const sorted = [...rawRequests].sort((a, b) => {
        const sa = a.summary || {};
        const sb = b.summary || {};
        const pendingA =
          (sa.pending_subjects || 0) + (sa.pending_subject_titles || 0);
        const pendingB =
          (sb.pending_subjects || 0) + (sb.pending_subject_titles || 0);
        if (pendingA !== pendingB) return pendingB - pendingA;
        // Fallback: alphabetical by name
        const nameA = (a.user?.name || "").toLowerCase();
        const nameB = (b.user?.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setRequests(sorted);
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
        req.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredRequests(filtered);
  };

  const handleApprove = async (userId, type, item, requestsData) => {
    const loadingKey = `${type}-${item.id}`;
    setActionLoadingKey(loadingKey);
    try {
      const approvedSubjectIds = (requestsData.subjects?.approved || []).map(
        (s) => s.subject_id ?? s.id,
      );
      const approvedTitleIds = (
        requestsData.subject_titles?.approved || []
      ).map((t) => t.subject_title_id ?? t.id);

      let subject_ids =
        type === "subject"
          ? [...approvedSubjectIds, item.subject_id ?? item.id]
          : approvedSubjectIds;

      let subject_title_ids = approvedTitleIds;

      if (type === "subject") {
        // Auto-include all titles that belong to this subject
        const allTitles = [
          ...(requestsData.subject_titles?.pending || []),
          ...(requestsData.subject_titles?.approved || []),
          ...(requestsData.subject_titles?.rejected || []),
        ];
        const titlesForSubject = allTitles.filter(
          (title) =>
            (title.subject_id &&
              item.subject_id &&
              title.subject_id === item.subject_id) ||
            title.subject_name === item.subject_name,
        );
        const titlesForSubjectIds = titlesForSubject.map(
          (t) => t.subject_title_id ?? t.id,
        );
        subject_title_ids = Array.from(
          new Set([...approvedTitleIds, ...titlesForSubjectIds]),
        );
      } else if (type === "subject_title") {
        subject_title_ids = [
          ...approvedTitleIds,
          item.subject_title_id ?? item.id,
        ];
      }

      await approveUserSelections(userId, {
        subject_ids: Array.from(new Set(subject_ids)),
        subject_title_ids,
        reject_others: false,
      });
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
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleReject = async (requestId, type, item) => {
    const loadingKey = `${type}-${item.id}`;
    setActionLoadingKey(loadingKey);
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
    } finally {
      setActionLoadingKey(null);
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
        <Loader size="md" />
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

            const isExpanded = expandedUserId === user.id;

            return (
              <div
                key={user.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                {/* User Header */}
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white cursor-pointer"
                  onClick={() =>
                    setExpandedUserId(isExpanded ? null : user.id)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-lg">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          {user.name || "N/A"}
                        </h3>
                        <p className="text-blue-100 flex items-center gap-2 mt-1">
                          <Mail className="w-4 h-4 shrink-0" />
                          {user.email || "N/A"}
                        </p>
                        {(user.phone_number || user.phone || user.mobile) && (
                          <p className="text-blue-100 flex items-center gap-2 mt-1">
                            <Phone className="w-4 h-4 shrink-0" />
                            {user.phone_number || user.phone || user.mobile}
                          </p>
                        )}
                        {(user.school_name || user.school) && (
                          <p className="text-blue-100 flex items-center gap-2 mt-1">
                            <School className="w-4 h-4 shrink-0" />
                            {user.school_name || user.school}
                          </p>
                        )}
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

                {isExpanded && (
                  <>
                {/* Summary Stats */}
                <div className="p-6 border-b border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        {summary.pending_subjects || 0}
                      </div>
                      <div className="text-sm text-gray-600">
                        Pending Subjects
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {summary.approved_subjects || 0}
                      </div>
                      <div className="text-sm text-gray-600">
                        Approved Subjects
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {summary.rejected_subjects || 0}
                      </div>
                      <div className="text-sm text-gray-600">
                        Rejected Subjects
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        {summary.pending_subject_titles || 0}
                      </div>
                      <div className="text-sm text-gray-600">
                        Pending Titles
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {summary.approved_subject_titles || 0}
                      </div>
                      <div className="text-sm text-gray-600">
                        Approved Titles
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {summary.rejected_subject_titles || 0}
                      </div>
                      <div className="text-sm text-gray-600">
                        Rejected Titles
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subjects Section */}
                {requestsData.subjects && (
                  <div className="p-6 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                      Subject Requests
                    </h4>
                    <div className="space-y-3">
                      {[
                        ...(requestsData.subjects.pending || []),
                        ...(requestsData.subjects.approved || []),
                        ...(requestsData.subjects.rejected || []),
                      ].map((subject) => {
                        const status = getRequestStatus(subject);
                        const loadingKey = `subject-${subject.id}`;
                        // Titles that belong to this subject (for display only)
                        const allTitles = [
                          ...(requestsData.subject_titles?.pending || []),
                          ...(requestsData.subject_titles?.approved || []),
                          ...(requestsData.subject_titles?.rejected || []),
                        ];
                        const titlesForSubject = allTitles.filter(
                          (title) =>
                            (title.subject_id &&
                              subject.subject_id &&
                              title.subject_id === subject.subject_id) ||
                            title.subject_name === subject.subject_name,
                        );
                        return (
                          <div
                            key={subject.id}
                            onClick={() =>
                              setDetailModal({
                                user,
                                summary,
                                requestType: "subject",
                                item: subject,
                                requestsData,
                              })
                            }
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
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
                              {titlesForSubject.length > 0 && (
                                <div className="mt-1 text-xs text-gray-500">
                                  Titles:{" "}
                                  {titlesForSubject
                                    .map(
                                      (t) =>
                                        t.title_name ||
                                        t.subject_title_name ||
                                        "N/A",
                                    )
                                    .join(", ")}
                                </div>
                              )}
                            </div>
                            <div
                              className="flex items-center gap-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {status === "pending" && (
                                <>
                                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                                    Pending
                                  </span>
                                  <button
                                    disabled={actionLoadingKey === loadingKey}
                                    onClick={() =>
                                      handleApprove(
                                        user.id,
                                        "subject",
                                        subject,
                                        requestsData,
                                      )
                                    }
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Approve"
                                  >
                                    {actionLoadingKey === loadingKey ? (
                                      <Loader size="sm" className="w-4 h-4" />
                                    ) : (
                                      <CheckCircle className="w-5 h-5" />
                                    )}
                                  </button>
                                  <button
                                    disabled={actionLoadingKey === loadingKey}
                                    onClick={() =>
                                      handleReject(
                                        subject.id,
                                        "subject",
                                        subject,
                                      )
                                    }
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Reject"
                                  >
                                    {actionLoadingKey === loadingKey ? (
                                      <Loader size="sm" className="w-4 h-4" />
                                    ) : (
                                      <XCircle className="w-5 h-5" />
                                    )}
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
                        <p className="text-gray-500 text-center py-4">
                          No subject requests
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Subject Titles Section (flat list) */}
                {/* We now show titles grouped under each subject above.
                    Keep this section only for titles that are not present
                    in any grouped entry (edge cases). */}
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
                      ]
                        .filter((title) => {
                          // If grouped structure exists and already contains this title, skip
                          const grouped = requestsData.grouped || {};
                          const groups = [
                            ...(grouped.pending || []),
                            ...(grouped.approved || []),
                            ...(grouped.rejected || []),
                          ];
                          return !groups.some((g) =>
                            (g.subject_titles || []).some(
                              (st) => st.id === title.id,
                            ),
                          );
                        })
                        .map((title) => {
                          const status = getRequestStatus(title);
                          const loadingKey = `subject_title-${title.id}`;
                          return (
                            <div
                              key={title.id}
                              onClick={() =>
                                setDetailModal({
                                  user,
                                  summary,
                                  requestType: "subject_title",
                                  item: title,
                                  requestsData,
                                })
                              }
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                              <div>
                                <div className="font-medium text-gray-800">
                                  {title.title_name ||
                                    title.subject_title_name ||
                                    "N/A"}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Subject: {title.subject_name || "N/A"}
                                  {title.standard &&
                                    ` | Standard: ${title.standard}`}
                                </div>
                              </div>
                              <div
                                className="flex items-center gap-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {status === "pending" && (
                                  <>
                                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                                      Pending
                                    </span>
                                    <button
                                      disabled={actionLoadingKey === loadingKey}
                                      onClick={() =>
                                        handleApprove(
                                          user.id,
                                          "subject_title",
                                          title,
                                          requestsData,
                                        )
                                      }
                                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Approve"
                                    >
                                      {actionLoadingKey === loadingKey ? (
                                        <Loader
                                          size="sm"
                                          className="w-4 h-4"
                                        />
                                      ) : (
                                        <CheckCircle className="w-5 h-5" />
                                      )}
                                    </button>
                                    <button
                                      disabled={actionLoadingKey === loadingKey}
                                      onClick={() =>
                                        handleReject(
                                          title.id,
                                          "subject_title",
                                          title,
                                        )
                                      }
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Reject"
                                    >
                                      {actionLoadingKey === loadingKey ? (
                                        <Loader
                                          size="sm"
                                          className="w-4 h-4"
                                        />
                                      ) : (
                                        <XCircle className="w-5 h-5" />
                                      )}
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
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Detail popup when clicking a subject request */}
      {detailModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setDetailModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                Request details
              </h3>
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Teacher / User details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Teacher details
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-800">Name:</span>
                    <span>{detailModal.user?.name || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-800">Email:</span>
                    <span>{detailModal.user?.email || "N/A"}</span>
                  </div>
                  {(detailModal.user?.phone_number ||
                    detailModal.user?.phone ||
                    detailModal.user?.mobile) && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-800">Mobile:</span>
                      <span>
                        {detailModal.user.phone_number ||
                          detailModal.user.phone ||
                          detailModal.user.mobile}
                      </span>
                    </div>
                  )}
                  {(detailModal.user?.school_name ||
                    detailModal.user?.school) && (
                    <div className="flex items-center gap-2">
                      <School className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-800">School:</span>
                      <span>
                        {detailModal.user.school_name ||
                          detailModal.user.school}
                      </span>
                    </div>
                  )}
                  {detailModal.user?.username && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">
                        Username:
                      </span>
                      <span>{detailModal.user.username}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Request item details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {detailModal.requestType === "subject"
                    ? "Subject request"
                    : "Subject title request"}
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  {detailModal.requestType === "subject" ? (
                    <>
                      <div>
                        <span className="font-medium text-gray-800">
                          Subject:{" "}
                        </span>
                        {detailModal.item?.subject_name || "N/A"}
                      </div>
                      {detailModal.item?.standard && (
                        <div>
                          <span className="font-medium text-gray-800">
                            Standard:{" "}
                          </span>
                          {detailModal.item.standard}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="font-medium text-gray-800">
                          Title:{" "}
                        </span>
                        {detailModal.item?.subject_title_name || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">
                          Subject:{" "}
                        </span>
                        {detailModal.item?.subject_name || "N/A"}
                      </div>
                      {detailModal.item?.standard && (
                        <div>
                          <span className="font-medium text-gray-800">
                            Standard:{" "}
                          </span>
                          {detailModal.item.standard}
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <span className="font-medium text-gray-800">Status: </span>
                    <span
                      className={
                        getRequestStatus(detailModal.item) === "approved"
                          ? "text-green-600 font-medium"
                          : getRequestStatus(detailModal.item) === "rejected"
                            ? "text-red-600 font-medium"
                            : "text-amber-600 font-medium"
                      }
                    >
                      {getRequestStatus(detailModal.item) === "approved"
                        ? "Approved"
                        : getRequestStatus(detailModal.item) === "rejected"
                          ? "Rejected"
                          : "Pending"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubjectRequests;
