import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { XCircle, FileText } from "lucide-react";
import { useHeader } from "../../context/HeaderContext";
import HeaderCard from "../Cards/HeaderCard";
import EditHeaderCard from "../Cards/EditHeaderCard";

const EditHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const fromWhere = location.state?.from;

  const { headers } = useHeader();
  const header = headers.find((h) => h.id == id);

  // State to store editable values - Initialize with empty object first
  const [editedHeader, setEditedHeader] = useState(null);

  // Set the edited header once we have the data
  useEffect(() => {
    if (header) {
      // Initialize board and subjectTitle fields if they don't exist
      setEditedHeader({ 
        ...header,
        board: header.board || "",
        subjectTitle: header.subjectTitle || "",
      });
    }
  }, [header]);

  // Handle input changes
  const handleInputChange = (e, field) => {
    setEditedHeader({ ...editedHeader, [field]: e.target.value });
  };

  const handleClear = () => {
    setEditedHeader({ ...header });
  };

  // Show loading state while header is being loaded
  if (!header || !editedHeader) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading header...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      {/* Header Title */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Edit Header
        </h1>
        <p className="text-gray-600 text-lg">
          Customize your school paper header
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Live Preview
            </h2>

            {/* Header Preview */}
            <HeaderCard
              header={editedHeader}
              disableHover={true}
              width="full"
            />

            {/* Info Card */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-gray-700">
                <strong className="text-blue-700">💡 Tip:</strong> Changes are
                reflected in real-time. Leave the logo field empty to use
                default initials badge.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Edit Form */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Header Details
            </h2>

            <EditHeaderCard
              editedHeader={editedHeader}
              handleInputChange={handleInputChange}
            />

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleClear}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Clear
              </button>
              <button
                onClick={() => {
                  // Always navigate to custom paper creation page
                  navigate("/dashboard/generate/custompaper", {
                    state: { header: editedHeader, headerId: id },
                  });
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Add Questions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditHeader;
