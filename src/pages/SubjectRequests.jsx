import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import Toast from "../components/Common/Toast";
import {
  CheckCircle2,
  Clock,
  Plus,
  BookOpen,
  FileText,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const SubjectRequests = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // New request state
  const [newRequestSubjects, setNewRequestSubjects] = useState([]);
  const [activeTab, setActiveTab] = useState("view"); // "view" or "create"
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [pendingRes, approvedRes, subjectsRes] = await Promise.all([
        apiClient.get("/auth/my-selections/pending"),
        apiClient.get("/auth/my-selections/approved"),
        apiClient.get("/subjects"),
      ]);

      // Log response structure for debugging
      console.log("Pending response:", pendingRes.data);
      console.log("Approved response:", approvedRes.data);
      console.log("Subjects response:", subjectsRes.data);

      // Handle different response structures
      let pendingData = pendingRes.data;
      let approvedData = approvedRes.data;
      let subjectsData = subjectsRes.data;

      // Transform pending data structure
      // API returns: { pending_selections: { subjects: [], subject_titles: [] } }
      if (pendingData && pendingData.pending_selections) {
        const pendingSelections = pendingData.pending_selections;
        // Transform into array format expected by UI
        const transformedPending = [
          {
            subjects: (pendingSelections.subjects || []).map((sub) => ({
              subject_id: sub.subject_id || sub.subject?.subject_id,
              subject_name: sub.subject?.subject_name || "Unknown Subject",
            })),
            subject_titles: (pendingSelections.subject_titles || []).map(
              (st) => ({
                subject_id: st.subject_id || st.subject?.subject_id,
                subject_title_id:
                  st.subject_title_id || st.subjectTitle?.subject_title_id,
                title_name: st.subjectTitle?.title_name || "Unknown Title",
                subject_name: st.subject?.subject_name || "Unknown Subject",
              })
            ),
          },
        ];
        pendingData = transformedPending;
      } else if (
        pendingData &&
        pendingData.data &&
        Array.isArray(pendingData.data)
      ) {
        pendingData = pendingData.data;
      } else if (!Array.isArray(pendingData)) {
        pendingData = [];
      }

      // Transform approved data structure (same format)
      if (approvedData && approvedData.approved_selections) {
        const approvedSelections = approvedData.approved_selections;
        const transformedApproved = [
          {
            subjects: (approvedSelections.subjects || []).map((sub) => ({
              subject_id: sub.subject_id || sub.subject?.subject_id,
              subject_name: sub.subject?.subject_name || "Unknown Subject",
            })),
            subject_titles: (approvedSelections.subject_titles || []).map(
              (st) => ({
                subject_id: st.subject_id || st.subject?.subject_id,
                subject_title_id:
                  st.subject_title_id || st.subjectTitle?.subject_title_id,
                title_name: st.subjectTitle?.title_name || "Unknown Title",
                subject_name: st.subject?.subject_name || "Unknown Subject",
              })
            ),
          },
        ];
        approvedData = transformedApproved;
      } else if (
        approvedData &&
        approvedData.data &&
        Array.isArray(approvedData.data)
      ) {
        approvedData = approvedData.data;
      } else if (!Array.isArray(approvedData)) {
        approvedData = [];
      }

      // Handle subjects data
      if (
        subjectsData &&
        subjectsData.data &&
        Array.isArray(subjectsData.data)
      ) {
        subjectsData = subjectsData.data;
      } else if (!Array.isArray(subjectsData)) {
        subjectsData = [];
      }

      // Ensure we always have arrays
      const finalPending = Array.isArray(pendingData) ? pendingData : [];
      const finalApproved = Array.isArray(approvedData) ? approvedData : [];

      // Log transformed data for debugging
      console.log("Transformed Pending Requests:", finalPending);
      console.log("Transformed Approved Requests:", finalApproved);

      setPendingRequests(finalPending);
      setApprovedRequests(finalApproved);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      console.error("Error response:", error.response?.data);
      setToast({
        show: true,
        message:
          error.response?.data?.message ||
          "Failed to load data. Please try again.",
        type: "error",
      });
      // Set empty arrays on error to prevent map errors
      setPendingRequests([]);
      setApprovedRequests([]);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Add new subject selection for request
  const addSubjectSelection = () => {
    setNewRequestSubjects([
      ...newRequestSubjects,
      {
        id: Date.now(),
        subjectId: "",
        subjectName: "",
        titles: [],
        selectedTitles: [],
      },
    ]);
  };

  // Remove subject selection
  const removeSubjectSelection = (id) => {
    setNewRequestSubjects(newRequestSubjects.filter((s) => s.id !== id));
  };

  // Handle subject change
  const handleSubjectChange = async (id, subjectId) => {
    const subject = subjects.find((s) => s.subject_id === parseInt(subjectId));

    try {
      const response = await apiClient.get(`/subject/${subjectId}/titles`);
      const titlesData = response.data || [];
      const titles = titlesData.map((title) => ({
        id: title.subject_title_id,
        name: title.title_name,
      }));

      setNewRequestSubjects(
        newRequestSubjects.map((s) =>
          s.id === id
            ? {
                ...s,
                subjectId,
                subjectName: subject?.subject_name || "",
                titles,
                selectedTitles: [],
              }
            : s
        )
      );
    } catch (error) {
      console.error("Error fetching subject titles:", error);
      setToast({
        show: true,
        message: "Failed to load subject titles.",
        type: "error",
      });
    }
  };

  // Handle title toggle
  const handleTitleToggle = (id, titleId) => {
    setNewRequestSubjects(
      newRequestSubjects.map((s) => {
        if (s.id === id) {
          const selected = s.selectedTitles.includes(titleId)
            ? s.selectedTitles.filter((t) => t !== titleId)
            : [...s.selectedTitles, titleId];
          return { ...s, selectedTitles: selected };
        }
        return s;
      })
    );
  };

  // Submit new request
  const handleSubmitRequest = async () => {
    if (newRequestSubjects.length === 0) {
      setToast({
        show: true,
        message: "Please add at least one subject.",
        type: "warning",
      });
      return;
    }

    const isValid = newRequestSubjects.every(
      (s) => s.subjectId && s.selectedTitles.length > 0
    );

    if (!isValid) {
      setToast({
        show: true,
        message:
          "Please complete all subject selections with at least one title.",
        type: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Extract unique subject IDs
      const subjectsArray = [
        ...new Set(newRequestSubjects.map((s) => parseInt(s.subjectId))),
      ];

      // Format subject_titles
      const subject_titles = newRequestSubjects.flatMap((s) =>
        s.selectedTitles.map((titleId) => ({
          subject_id: parseInt(s.subjectId),
          subject_title_id: parseInt(titleId),
        }))
      );

      // Prepare the request payload
      const payload = {
        subjects: subjectsArray,
        subject_titles,
      };

      // Log the request payload for debugging
      console.log("Submitting request to /api/auth/my-selections");
      console.log("Payload:", JSON.stringify(payload, null, 2));

      await apiClient.put("/auth/my-selections", payload);

      setToast({
        show: true,
        message:
          "Request submitted successfully! It will be reviewed by admin.",
        type: "success",
      });

      // Reset form
      setNewRequestSubjects([]);
      setIsSubmitting(false);

      // Refresh data
      fetchAllData();
    } catch (error) {
      console.error("Error submitting request:", error);
      setToast({
        show: true,
        message:
          error.response?.data?.message ||
          "Failed to submit request. Please try again.",
        type: "error",
      });
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Subject Requests
              </h1>
              <p className="text-gray-600">
                Manage your subject and subject title requests
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("view")}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === "view"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            View Requests
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === "create"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Create New Request
          </button>
        </div>

        {/* Content */}
        {activeTab === "view" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Requests */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-amber-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Clock size={24} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Pending Requests
                  </h2>
                  <p className="text-sm text-gray-600">
                    {pendingRequests.length} request(s) awaiting approval
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <AlertCircle
                      size={48}
                      className="mx-auto text-gray-400 mb-4"
                    />
                    <p className="text-gray-600 font-medium">
                      No pending requests
                    </p>
                  </div>
                ) : (
                  pendingRequests.map((request, index) => (
                    <div
                      key={index}
                      className="p-4 bg-amber-50 rounded-xl border border-amber-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock size={18} className="text-amber-600" />
                          <span className="font-semibold text-gray-800">
                            Request #{index + 1}
                          </span>
                        </div>
                        <span className="px-3 py-1 bg-amber-200 text-amber-800 text-xs font-semibold rounded-full">
                          Pending
                        </span>
                      </div>
                      <div className="space-y-3">
                        {request.subjects &&
                          Array.isArray(request.subjects) &&
                          request.subjects.length > 0 && (
                            <div>
                              <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <BookOpen
                                  size={16}
                                  className="text-amber-600"
                                />
                                Subjects ({request.subjects.length}):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {request.subjects.map((sub, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-2 bg-white text-gray-800 text-sm font-semibold rounded-lg border-2 border-amber-400 shadow-sm hover:shadow-md transition-shadow"
                                  >
                                    {sub.subject_name ||
                                      `Subject ${sub.subject_id}`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        {request.subject_titles &&
                          Array.isArray(request.subject_titles) &&
                          request.subject_titles.length > 0 && (
                            <div>
                              <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <FileText
                                  size={16}
                                  className="text-amber-600"
                                />
                                Subject Titles ({request.subject_titles.length}
                                ):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {request.subject_titles.map((st, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-2 bg-white text-gray-800 text-sm font-medium rounded-lg border-2 border-amber-400 shadow-sm hover:shadow-md transition-shadow"
                                    title={`${st.subject_name || "Subject"} - ${
                                      st.title_name || "Title"
                                    }`}
                                  >
                                    <span className="font-bold text-amber-700">
                                      {st.subject_name || "Subject"}
                                    </span>
                                    <span className="mx-1 text-gray-400">
                                      •
                                    </span>
                                    <span>
                                      {st.title_name ||
                                        `Title ${st.subject_title_id}`}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        {(!request.subjects || request.subjects.length === 0) &&
                          (!request.subject_titles ||
                            request.subject_titles.length === 0) && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              No details available
                            </div>
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Approved Requests */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle2 size={24} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Approved Requests
                  </h2>
                  <p className="text-sm text-gray-600">
                    {approvedRequests.length} request(s) approved
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {approvedRequests.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <CheckCircle2
                      size={48}
                      className="mx-auto text-gray-400 mb-4"
                    />
                    <p className="text-gray-600 font-medium">
                      No approved requests yet
                    </p>
                  </div>
                ) : (
                  approvedRequests.map((request, index) => (
                    <div
                      key={index}
                      className="p-4 bg-green-50 rounded-xl border border-green-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={18} className="text-green-600" />
                          <span className="font-semibold text-gray-800">
                            Request #{index + 1}
                          </span>
                        </div>
                        <span className="px-3 py-1 bg-green-200 text-green-800 text-xs font-semibold rounded-full">
                          Approved
                        </span>
                      </div>
                      <div className="space-y-3">
                        {request.subjects &&
                          Array.isArray(request.subjects) &&
                          request.subjects.length > 0 && (
                            <div>
                              <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <BookOpen
                                  size={16}
                                  className="text-green-600"
                                />
                                Subjects ({request.subjects.length}):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {request.subjects.map((sub, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-2 bg-white text-gray-800 text-sm font-semibold rounded-lg border-2 border-green-400 shadow-sm hover:shadow-md transition-shadow"
                                  >
                                    {sub.subject_name ||
                                      `Subject ${sub.subject_id}`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        {request.subject_titles &&
                          Array.isArray(request.subject_titles) &&
                          request.subject_titles.length > 0 && (
                            <div>
                              <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <FileText
                                  size={16}
                                  className="text-green-600"
                                />
                                Subject Titles ({request.subject_titles.length}
                                ):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {request.subject_titles.map((st, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-2 bg-white text-gray-800 text-sm font-medium rounded-lg border-2 border-green-400 shadow-sm hover:shadow-md transition-shadow"
                                    title={`${st.subject_name || "Subject"} - ${
                                      st.title_name || "Title"
                                    }`}
                                  >
                                    <span className="font-bold text-green-700">
                                      {st.subject_name || "Subject"}
                                    </span>
                                    <span className="mx-1 text-gray-400">
                                      •
                                    </span>
                                    <span>
                                      {st.title_name ||
                                        `Title ${st.subject_title_id}`}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        {(!request.subjects || request.subjects.length === 0) &&
                          (!request.subject_titles ||
                            request.subject_titles.length === 0) && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              No details available
                            </div>
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Create New Request Form */
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <Plus size={28} className="text-blue-600" />
                  Create New Request
                </h2>
                <p className="text-gray-600">
                  Request new subjects and subject titles
                </p>
              </div>
              <button
                onClick={addSubjectSelection}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus size={20} />
                Add Subject
              </button>
            </div>

            {newRequestSubjects.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <BookOpen size={64} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium mb-4">
                  No subjects added yet
                </p>
                <button
                  onClick={addSubjectSelection}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
                >
                  Add Your First Subject
                </button>
              </div>
            ) : (
              <div className="space-y-6 mb-6">
                {newRequestSubjects.map((selection, index) => (
                  <div
                    key={selection.id}
                    className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">
                        Subject {index + 1}
                      </h3>
                      <button
                        onClick={() => removeSubjectSelection(selection.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Subject Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Select Subject *
                        </label>
                        <select
                          value={selection.subjectId}
                          onChange={(e) =>
                            handleSubjectChange(selection.id, e.target.value)
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800 font-semibold bg-white"
                        >
                          <option value="">Choose a subject...</option>
                          {subjects.map((sub) => (
                            <option key={sub.subject_id} value={sub.subject_id}>
                              {sub.subject_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Title Selection */}
                      {selection.titles.length > 0 && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Select Subject Titles * (Multiple selection allowed)
                          </label>
                          <div className="flex flex-wrap gap-2 p-4 bg-white rounded-xl border-2 border-gray-200 min-h-[100px]">
                            {selection.titles.map((title) => (
                              <button
                                key={title.id}
                                type="button"
                                onClick={() =>
                                  handleTitleToggle(selection.id, title.id)
                                }
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                  selection.selectedTitles.includes(title.id)
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105"
                                    : "bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-500 hover:shadow-md"
                                }`}
                              >
                                {selection.selectedTitles.includes(
                                  title.id
                                ) && (
                                  <CheckCircle2
                                    size={16}
                                    className="inline mr-1"
                                  />
                                )}
                                {title.name}
                              </button>
                            ))}
                          </div>
                          {selection.selectedTitles.length > 0 && (
                            <p className="mt-2 text-xs text-blue-600 font-semibold">
                              {selection.selectedTitles.length} title(s)
                              selected
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Submit Button */}
            {newRequestSubjects.length > 0 && (
              <div className="flex gap-4">
                <button
                  onClick={handleSubmitRequest}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-95"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    "Submit Request"
                  )}
                </button>
                <button
                  onClick={() => setNewRequestSubjects([])}
                  className="px-6 py-4 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-xl font-bold transition-all"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectRequests;
