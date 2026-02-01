import React, { useState } from "react";
import { Eye, Trash2, Edit, Calendar, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_ORIGIN } from "../../config/api";

const PaperCard = ({
  id,
  title,
  type,
  subject,
  created_at,
  date,
  school_name,
  logo,
  logo_url,
  subject_title,
  subject_title_id,
  subject_title_name,
  total_marks,
  ...paper
}) => {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const paperDate = created_at || date;
  const formattedDate = paperDate
    ? new Date(paperDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

  // Get logo URL (prioritize logo_url, then logo)
  const logoUrl = logo_url || logo || null;

  // Get API base URL for logo
  const getLogoUrl = () => {
    if (!logoUrl) return null;
    if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) {
      return logoUrl;
    }
    // If relative path, prepend API origin (from single config)
    const baseUrl = API_ORIGIN;
    // Handle both absolute and relative paths
    if (logoUrl.startsWith("/")) {
      return `${baseUrl}${logoUrl}`;
    }
    return `${baseUrl}/${logoUrl}`;
  };

  const handleView = () => {
    // Navigate to view paper
    console.log("View paper:", id);
  };

  const handleEdit = () => {
    // Navigate to edit header first, then to paper editing
    if (type === "custom") {
      // Navigate to edit header with paper data
      // We'll create a header from paper data or use existing header
      const headerData = {
        schoolName: school_name || "",
        standard: paper.standard || "",
        timing: paper.timing || "",
        date: paper.date || "",
        division: paper.division || "",
        address: paper.address || "",
        subject: subject || "",
        board: paper.board || "",
        logo: logo || null,
        logoUrl: logo_url || null,
        subjectTitle: paper.subject_title_id || null,
      };

      navigate("/dashboard/generate/edit-header/new", {
        state: {
          paperId: id,
          editMode: true,
          paperData: { id, title, type, subject, ...paper },
          headerData: headerData,
          fromPaper: true,
        },
      });
    } else {
      navigate("/dashboard/generate/edit-paper", {
        state: {
          paperId: id,
          editMode: true,
          paperData: { id, title, type, subject, ...paper },
        },
      });
    }
  };

  const handleDelete = () => {
    // Delete paper logic
    console.log("Delete paper:", id);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 transform hover:-translate-y-1">
        {/* Header with Type Badge */}
        <div
          className={`${
            type === "custom"
              ? "bg-gradient-to-r from-green-500 to-emerald-600"
              : "bg-gradient-to-r from-blue-500 to-indigo-600"
          } text-white px-4 py-3 flex items-center justify-between`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <span className="font-semibold">
              {type === "custom" ? "Custom Paper" : "Pre-Built Paper"}
            </span>
          </div>
          {paperDate && (
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* School Logo and Name */}
          <div className="flex items-center gap-3 mb-4">
            {getLogoUrl() && (
              <div className="flex-shrink-0">
                <img
                  src={getLogoUrl()}
                  alt="School Logo"
                  className="w-12 h-12 object-contain rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-800 line-clamp-2">
                {school_name || "School Name"}
              </h3>
            </div>
          </div>

          {/* Subject and Subject Title */}
          <div className="space-y-2 mb-4">
            {subject && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">
                  Subject:
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                  {subject}
                </span>
              </div>
            )}
            {(subject_title_name || subject_title || subject_title_id) && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">
                  Title:
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                  {subject_title_name ||
                    subject_title ||
                    `Title ${subject_title_id}`}
                </span>
              </div>
            )}
          </div>

          {/* Total Marks */}
          {total_marks !== undefined && total_marks !== null && (
            <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  Total Marks:
                </span>
                <span className="text-lg font-bold text-emerald-600">
                  {total_marks}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleView}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg transition"
            >
              <Eye className="w-4 h-4" />
              View
            </button>

            <button
              onClick={handleEdit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 font-semibold rounded-lg transition"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-center px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Delete Paper?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "
              {school_name || title || "this paper"}"? This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaperCard;
