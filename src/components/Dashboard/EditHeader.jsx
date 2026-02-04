import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { XCircle, FileText } from "lucide-react";
import { useHeader } from "../../context/HeaderContext";
import { useUserTeaching } from "../../context/UserTeachingContext";
import HeaderCard from "../Cards/HeaderCard";
import EditHeaderCard from "../Cards/EditHeaderCard";
import { getPaperById } from "../../services/paperService";
import Loader from "../Common/loader/loader";

const EditHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const fromWhere = location.state?.from;
  const { paperId, paperData, headerData, fromPaper } = location.state || {};

  const { headers } = useHeader();
  const { contextSelection } = useUserTeaching();
  const header = id && id !== "new" ? headers.find((h) => h.id == id) : null;
  const isNewPaper = !fromPaper && !headerData && !header;

  // State to store editable values - Initialize with empty object first
  const [editedHeader, setEditedHeader] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load paper data if editing from paper
  useEffect(() => {
    const loadPaperHeader = async () => {
      // Always get user data from localStorage for school info
      const user = JSON.parse(localStorage.getItem("user") || "null");
      // Always use user profile values for school info (not editable in paper form)
      const userSchoolName = user?.school_name || "";
      const userAddress =
        user?.address ||
        (user?.school_address_city && user?.school_address_state
          ? `${user.school_address_city}, ${user.school_address_state}`
          : user?.school_address || "");
      const userLogo = user?.logo || user?.logo_url || null;

      if (fromPaper && paperId) {
        setLoading(true);
        try {
          const response = await getPaperById(paperId);
          const paper = response.data || response;

          if (paper) {
            const headerFromPaper = {
              // Always use user profile values for school info
              schoolName: userSchoolName,
              address: userAddress,
              image: userLogo,
              // Paper-specific fields
              standard: paper.standard || "",
              timing: paper.timing || "",
              date: paper.date ? paper.date.split("T")[0] : "",
              division: paper.division || "",
              subject: paper.subject || "",
              board: paper.board || "",
              subjectTitle: paper.subject_title_id || null,
              documentTitle: paper.paper_title || "",
              class: paper.standard ? `Standard ${paper.standard}` : "",
            };
            setEditedHeader(headerFromPaper);
          }
        } catch (error) {
          console.error("Error loading paper:", error);
        } finally {
          setLoading(false);
        }
      } else if (headerData) {
        // Use header data from location state, but always use user profile for school info
        setEditedHeader({
          ...headerData,
          schoolName: userSchoolName,
          address: userAddress,
          image: userLogo,
          board: headerData.board || "",
          subjectTitle: headerData.subjectTitle || null,
        });
      } else if (header) {
        // Use header from context, but always use user profile for school info
        setEditedHeader({
          ...header,
          schoolName: userSchoolName,
          address: userAddress,
          image: userLogo,
          board: header.board || "",
          subjectTitle: header.subjectTitle || "",
        });
      } else {
        // New header - pre-fill from teaching context when available (no need to ask again)
        const ctx = contextSelection;
        setEditedHeader({
          image: userLogo,
          schoolName: userSchoolName,
          address: userAddress,
          subject: ctx?.subject_name ?? "",
          subjectTitle: ctx?.subject_title_id ?? null,
          board: ctx?.board_id ?? "",
          class: ctx?.standard ?? "",
          documentTitle: "",
          studentName: "",
          rollNo: "",
          section: "",
          date: "",
          timing: "",
          standard: ctx?.standard ?? "",
          division: "",
        });
      }
    };

    loadPaperHeader();
  }, [header, fromPaper, paperId, headerData, contextSelection]);

  // Handle input changes
  // Note: schoolName, address, and image (logo) cannot be changed here - they come from user profile
  const handleInputChange = (e, field) => {
    // Prevent editing school info fields
    if (["schoolName", "address", "image"].includes(field)) {
      return;
    }
    setEditedHeader({ ...editedHeader, [field]: e.target.value });
  };

  const handleClear = () => {
    setEditedHeader({ ...header });
  };

  // Show loading state while header is being loaded
  if (
    loading ||
    (!header && !headerData && !fromPaper && id !== "new") ||
    !editedHeader
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
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
          {fromPaper ? "Edit Paper Header" : "Edit Header"}
        </h1>
        <p className="text-gray-600 text-lg">
          {fromPaper
            ? "Update your paper header details, then continue to edit questions"
            : "Customize your school paper header"}
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
                <strong className="text-blue-700">💡 Tip:</strong> School name,
                address, and logo are automatically taken from your profile.
                Update them in{" "}
                <a
                  href="/dashboard/profile"
                  className="underline font-semibold text-blue-600"
                >
                  Profile Settings
                </a>
                .
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
              lockContextFields={isNewPaper && !!contextSelection}
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
                  // Navigate to custom paper page
                  if (fromPaper && paperId) {
                    // Editing existing paper - go to CustomPaper with edit mode
                    navigate("/dashboard/generate/custompaper", {
                      state: {
                        header: editedHeader,
                        headerId: id,
                        paperId: paperId,
                        editMode: true,
                        paperData: paperData,
                      },
                    });
                  } else {
                    // Creating new paper or editing header only
                    navigate("/dashboard/generate/custompaper", {
                      state: { header: editedHeader, headerId: id },
                    });
                  }
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                {fromPaper ? "Continue to Edit Questions" : "Add Questions"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditHeader;
