import { useState, useEffect } from "react";
import {
  getSubjectRequests,
  approveUserSelections,
  rejectSubjectRequest,
  removeUserApprovedSelections,
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
  Trash2,
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
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [removingId, setRemovingId] = useState(null);

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

      const approve_by_subject_ids =
        type === "subject"
          ? [...approvedSubjectIds, item.subject_id ?? item.id]
          : approvedSubjectIds;

      let approve_by_subject_title_ids =
        type === "subject_title"
          ? [...approvedTitleIds, item.subject_title_id ?? item.id]
          : [...approvedTitleIds];

      // When approving a subject, also include all titles under that subject so backend approves subject + its titles
      if (type === "subject") {
        const groups = getSubjectTitleGroups(requestsData);
        const subjectId = item.subject_id ?? item.id;
        const subjectKey = item.id ?? item.user_subject_id ?? subjectId ?? item.subject_name;
        const group = groups.find(
          (g) =>
            (g.subject.subject_id != null && g.subject.subject_id === subjectId) ||
            g.subject.id === subjectKey ||
            g.subject.user_subject_id === subjectKey ||
            g.subject.subject_name === item.subject_name
        );
        if (group?.subject_titles?.length) {
          const titleIds = group.subject_titles.map(
            (t) => t.subject_title_id ?? t.id
          );
          approve_by_subject_title_ids = [
            ...new Set([...approve_by_subject_title_ids, ...titleIds]),
          ];
        }
      }

      await approveUserSelections(userId, {
        approve_by_subject_ids: Array.from(new Set(approve_by_subject_ids)),
        approve_by_subject_title_ids: Array.from(new Set(approve_by_subject_title_ids)),
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

  const getSubjectRowId = (s) =>
    s.id ??
    s.user_subject_id ??
    s.user_subjects_id ??
    s.user_subjects?.id ??
    s.UserSubject?.id;
  const getTitleRowId = (t) =>
    t.id ??
    t.user_subject_title_id ??
    t.user_subject_titles_id ??
    t.user_subject_titles?.id ??
    t.UserSubjectTitle?.id;

  /**
   * Normalize API data into one list of { subject, subject_titles } per subject.
   * Uses grouped when available; otherwise builds from flat subjects + subject_titles.
   */
  const getSubjectTitleGroups = (requestsData) => {
    const resultMap = new Map();
    const keyFor = (s) =>
      s.id ?? s.user_subject_id ?? s.subject_id ?? s.subject_name ?? "unknown";

    function addGroup(g) {
      const sub = g.subject || {};
      const key = keyFor(sub);
      const titles = g.subject_titles || [];
      if (!resultMap.has(key)) {
        resultMap.set(key, { subject: { ...sub }, subject_titles: [] });
      }
      const entry = resultMap.get(key);
      if ((sub.id ?? sub.user_subject_id) && !(entry.subject.id ?? entry.subject.user_subject_id)) {
        entry.subject = { ...entry.subject, ...sub };
      } else {
        entry.subject = { ...entry.subject, ...sub };
      }
      titles.forEach((t) => {
        const tid = t.id ?? t.user_subject_title_id;
        if (!entry.subject_titles.some((ex) => (ex.id ?? ex.user_subject_title_id) === tid)) {
          entry.subject_titles.push({ ...t });
        }
      });
    }

    const grouped = requestsData.grouped;
    if (grouped) {
      (grouped.pending || []).forEach(addGroup);
      (grouped.approved || []).forEach(addGroup);
      (grouped.rejected || []).forEach(addGroup);
    } else {
      const subjects = [
        ...(requestsData.subjects?.pending || []),
        ...(requestsData.subjects?.approved || []),
        ...(requestsData.subjects?.rejected || []),
      ];
      const allTitles = [
        ...(requestsData.subject_titles?.pending || []),
        ...(requestsData.subject_titles?.approved || []),
        ...(requestsData.subject_titles?.rejected || []),
      ];
      subjects.forEach((sub) => {
        const key = keyFor(sub);
        if (!resultMap.has(key)) {
          resultMap.set(key, { subject: { ...sub }, subject_titles: [] });
        }
        const entry = resultMap.get(key);
        const titlesForSubject = allTitles.filter(
          (t) =>
            (t.subject_id != null &&
              sub.subject_id != null &&
              t.subject_id === sub.subject_id) ||
            t.subject_name === sub.subject_name
        );
        titlesForSubject.forEach((t) => {
          const tid = t.id ?? t.user_subject_title_id;
          if (!entry.subject_titles.some((ex) => (ex.id ?? ex.user_subject_title_id) === tid)) {
            entry.subject_titles.push({ ...t });
          }
        });
      });
    }
    return Array.from(resultMap.values());
  };

  const handleRemoveApprovedClick = (userId, type, item) => {
    const rowId =
      type === "subject" ? getSubjectRowId(item) : getTitleRowId(item);
    if (userId == null) return;
    if (rowId == null) {
      setToast({
        show: true,
        message:
          "Cannot remove: backend did not return row id. Ensure GET /api/admin/subject-requests includes 'id' for each approved item.",
        type: "error",
      });
      return;
    }
    setConfirmRemove({
      type,
      userId,
      rowId,
      name:
        type === "subject"
          ? item.subject_name || "this subject"
          : item.subject_title_name || item.title_name || "this title",
    });
  };

  const handleRemoveConfirm = async () => {
    if (!confirmRemove) return;
    const { type, userId, rowId } = confirmRemove;
    setConfirmRemove(null);
    setDetailModal(null);
    setRemovingId(`${type}-${userId}-${rowId}`);
    try {
      if (type === "subject") {
        await removeUserApprovedSelections(userId, {
          user_subject_ids: [Number(rowId)],
        });
        setToast({
          show: true,
          message: "Approved subject removed.",
          type: "success",
        });
      } else {
        await removeUserApprovedSelections(userId, {
          user_subject_title_ids: [Number(rowId)],
        });
        setToast({
          show: true,
          message: "Approved subject title removed.",
          type: "success",
        });
      }
      fetchRequests();
    } catch (err) {
      setToast({
        show: true,
        message: err.response?.data?.message || "Failed to remove selection",
        type: "error",
      });
    } finally {
      setRemovingId(null);
    }
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
                  onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
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

                    {/* Subject Requests: one card per subject, titles as chips with per-title actions */}
                    {(requestsData.subjects || requestsData.grouped) && (
                      <div className="p-6 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">
                          Subject Requests
                        </h4>
                        <div className="space-y-4">
                          {getSubjectTitleGroups(requestsData).map((group) => {
                            const subject = group.subject;
                            const subjectTitles = group.subject_titles || [];
                            const subjectStatus = getRequestStatus(subject);
                            const subjectLoadingKey = `subject-${subject.id ?? getSubjectRowId(subject)}`;
                            const subjectKey = getSubjectRowId(subject) ?? subject.subject_id ?? subject.subject_name ?? "s";

                            return (
                              <div
                                key={subjectKey}
                                className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden"
                              >
                                {/* Subject row */}
                                <div
                                  onClick={() =>
                                    setDetailModal({
                                      user,
                                      summary,
                                      requestType: "subject",
                                      item: subject,
                                      requestsData,
                                    })
                                  }
                                  className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white/60 cursor-pointer hover:bg-gray-100 transition-colors"
                                >
                                  <div>
                                    <div className="font-semibold text-gray-800">
                                      {subject.subject_name || "N/A"}
                                    </div>
                                    {subject.standard && (
                                      <div className="text-sm text-gray-600">
                                        Standard: {subject.standard}
                                      </div>
                                    )}
                                  </div>
                                  <div
                                    className="flex items-center gap-3"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {subjectStatus === "pending" && (
                                      <>
                                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                                          Pending
                                        </span>
                                        <button
                                          disabled={
                                            actionLoadingKey === subjectLoadingKey
                                          }
                                          onClick={() =>
                                            handleApprove(
                                              user.id,
                                              "subject",
                                              subject,
                                              requestsData,
                                            )
                                          }
                                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                          title="Approve subject"
                                          aria-label="Approve subject"
                                        >
                                          {actionLoadingKey === subjectLoadingKey ? (
                                            <Loader size="sm" className="w-4 h-4" />
                                          ) : (
                                            <CheckCircle className="w-5 h-5" />
                                          )}
                                        </button>
                                        <button
                                          disabled={
                                            actionLoadingKey === subjectLoadingKey
                                          }
                                          onClick={() =>
                                            handleReject(
                                              subject.id,
                                              "subject",
                                              subject,
                                            )
                                          }
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                          title="Reject subject"
                                          aria-label="Reject subject"
                                        >
                                          {actionLoadingKey === subjectLoadingKey ? (
                                            <Loader size="sm" className="w-4 h-4" />
                                          ) : (
                                            <XCircle className="w-5 h-5" />
                                          )}
                                        </button>
                                      </>
                                    )}
                                    {subjectStatus === "approved" && (
                                      <>
                                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                                          Approved
                                        </span>
                                        <button
                                          type="button"
                                          disabled={!!removingId}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveApprovedClick(
                                              user.id,
                                              "subject",
                                              subject,
                                            );
                                          }}
                                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                          title="Remove from approved"
                                          aria-label="Remove subject from approved"
                                        >
                                          <Trash2 className="w-5 h-5" />
                                        </button>
                                      </>
                                    )}
                                    {subjectStatus === "rejected" && (
                                      <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                                        Rejected
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Title chips */}
                                {subjectTitles.length > 0 && (
                                  <div className="px-4 py-3 flex flex-wrap gap-2">
                                    {subjectTitles.map((title) => {
                                      const titleStatus = getRequestStatus(title);
                                      const titleLoadingKey = `subject_title-${title.id ?? getTitleRowId(title)}`;
                                      const titleKey = getTitleRowId(title) ?? title.id ?? title.subject_title_id ?? "t";
                                      const titleName =
                                        title.title_name ||
                                        title.subject_title_name ||
                                        "N/A";

                                      return (
                                        <div
                                          key={titleKey}
                                          onClick={() =>
                                            setDetailModal({
                                              user,
                                              summary,
                                              requestType: "subject_title",
                                              item: title,
                                              requestsData,
                                            })
                                          }
                                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                          <span className="font-medium text-gray-700 max-w-[180px] truncate">
                                            {titleName}
                                          </span>
                                          <span
                                            className={
                                              titleStatus === "approved"
                                                ? "px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium shrink-0"
                                                : titleStatus === "rejected"
                                                  ? "px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium shrink-0"
                                                  : "px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium shrink-0"
                                            }
                                          >
                                            {titleStatus === "approved"
                                              ? "Approved"
                                              : titleStatus === "rejected"
                                                ? "Rejected"
                                                : "Pending"}
                                          </span>
                                          <div
                                            className="flex items-center gap-0.5 shrink-0"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {titleStatus === "pending" && (
                                              <>
                                                <button
                                                  disabled={
                                                    actionLoadingKey === titleLoadingKey
                                                  }
                                                  onClick={() =>
                                                    handleApprove(
                                                      user.id,
                                                      "subject_title",
                                                      title,
                                                      requestsData,
                                                    )
                                                  }
                                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded transition disabled:opacity-50"
                                                  title="Approve this title"
                                                  aria-label={`Approve ${titleName}`}
                                                >
                                                  {actionLoadingKey === titleLoadingKey ? (
                                                    <Loader size="sm" className="w-4 h-4" />
                                                  ) : (
                                                    <CheckCircle className="w-4 h-4" />
                                                  )}
                                                </button>
                                                <button
                                                  disabled={
                                                    actionLoadingKey === titleLoadingKey
                                                  }
                                                  onClick={() =>
                                                    handleReject(
                                                      title.id,
                                                      "subject_title",
                                                      title,
                                                    )
                                                  }
                                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                                                  title="Reject this title"
                                                  aria-label={`Reject ${titleName}`}
                                                >
                                                  {actionLoadingKey === titleLoadingKey ? (
                                                    <Loader size="sm" className="w-4 h-4" />
                                                  ) : (
                                                    <XCircle className="w-4 h-4" />
                                                  )}
                                                </button>
                                              </>
                                            )}
                                            {titleStatus === "approved" && (
                                              <button
                                                type="button"
                                                disabled={!!removingId}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleRemoveApprovedClick(
                                                    user.id,
                                                    "subject_title",
                                                    title,
                                                  );
                                                }}
                                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                                                title="Remove this title from approved"
                                                aria-label={`Remove ${titleName} from approved`}
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {getSubjectTitleGroups(requestsData).length === 0 && (
                            <p className="text-gray-500 text-center py-4">
                              No subject requests
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
                        {detailModal.item?.title_name ||
                          detailModal.item?.subject_title_name ||
                          "N/A"}
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
                  {getRequestStatus(detailModal.item) === "approved" && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          handleRemoveApprovedClick(
                            detailModal.user?.id,
                            detailModal.requestType,
                            detailModal.item,
                          );
                        }}
                        disabled={!!removingId}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl font-medium hover:bg-red-100 transition disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove from approved
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm remove modal */}
      {confirmRemove && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-2">
              Remove approved selection?
            </h4>
            <p className="text-gray-600 text-sm mb-6">
              Remove &ldquo;{confirmRemove.name}&rdquo; from this teacher&apos;s
              selections. They can request it again later.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveConfirm}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubjectRequests;
