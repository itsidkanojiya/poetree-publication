import React, { useState } from "react";
import { Eye, Trash2, Edit, Calendar, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PaperCard = ({
  id,
  title,
  type,
  subject,
  created_at,
  date,
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

  const handleView = () => {
    // Navigate to view paper
    console.log("View paper:", id);
  };

  const handleEdit = () => {
    // Navigate to edit paper based on type
    if (type === "custom") {
      navigate("/dashboard/generate/custompaper", {
        state: {
          paperId: id,
          editMode: true,
          paperData: { id, title, type, subject, ...paper },
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
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 min-h-[3.5rem]">
            {title || "Untitled Paper"}
          </h3>

          {/* Subject Badge */}
          {subject && (
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full mb-4">
              {subject}
            </span>
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
              Are you sure you want to delete "{title || "this paper"}"? This
              action cannot be undone.
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
