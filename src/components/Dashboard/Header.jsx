import { useHeader } from "../../context/HeaderContext";
import HeaderCard from "../Cards/HeaderCard";
import { useLocation } from "react-router-dom";
import { FileText, Sparkles, ArrowLeft, XCircle, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import apiClient from "../../services/apiClient";

const Header = () => {
  const { headers } = useHeader();
  const location = useLocation();
  const navigate = useNavigate();
  const typeOfPaper = location.state?.from;
  const [approvedSubjectIds, setApprovedSubjectIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch approved subjects on component mount
  useEffect(() => {
    const fetchApprovedSubjects = async () => {
      try {
        const response = await apiClient.get("/auth/my-selections/approved");
        const responseData = response.data;

        // Extract unique subject IDs from approved selections
        const subjectIds = new Set();

        // Handle new response structure: { approved_selections: { subjects: [], subject_titles: [] } }
        if (responseData?.approved_selections) {
          const { subjects, subject_titles } = responseData.approved_selections;

          // Extract subject IDs from subjects array
          if (Array.isArray(subjects)) {
            subjects.forEach((item) => {
              if (item.subject_id) {
                subjectIds.add(item.subject_id);
              }
              // Also check nested subject object
              if (item.subject?.subject_id) {
                subjectIds.add(item.subject.subject_id);
              }
            });
          }

          // Extract subject IDs from subject_titles array
          if (Array.isArray(subject_titles)) {
            subject_titles.forEach((item) => {
              if (item.subject_id) {
                subjectIds.add(item.subject_id);
              }
              // Also check nested subject object
              if (item.subject?.subject_id) {
                subjectIds.add(item.subject.subject_id);
              }
            });
          }
        }
        // Handle old response structure: { data: [...] } or direct array
        else if (responseData?.data && Array.isArray(responseData.data)) {
          responseData.data.forEach((request) => {
            if (request.subjects && Array.isArray(request.subjects)) {
              request.subjects.forEach((subject) => {
                if (subject.subject_id) {
                  subjectIds.add(subject.subject_id);
                }
              });
            }
          });
        }
        // Handle direct array response
        else if (Array.isArray(responseData)) {
          responseData.forEach((request) => {
            if (request.subjects && Array.isArray(request.subjects)) {
              request.subjects.forEach((subject) => {
                if (subject.subject_id) {
                  subjectIds.add(subject.subject_id);
                }
              });
            }
          });
        }

        setApprovedSubjectIds(Array.from(subjectIds));
      } catch (error) {
        console.error("Error fetching approved subjects:", error);
        setApprovedSubjectIds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedSubjects();
  }, []);

  // Show access denied message if no approved subjects
  if (!loading && approvedSubjectIds.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-amber-300">
            <div className="text-center">
              <div className="p-4 bg-amber-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <XCircle size={40} className="text-amber-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                No Approved Subjects
              </h1>
              <p className="text-gray-600 text-lg mb-2">
                You need to select and request subjects first before accessing
                the Question Paper section.
              </p>
              <p className="text-amber-600 text-sm font-semibold mb-6">
                Please go to Subject Requests to request your teaching subjects
                from the admin.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/dashboard/subject-requests")}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all font-semibold shadow-lg flex items-center justify-center gap-2"
                >
                  <BookOpen size={20} />
                  Go to Subject Requests
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Paper Header
              </h1>
              <p className="text-gray-600 mt-1">
                Customize your paper header below
              </p>
            </div>
          </div>

          {/* Info Card - COMMENTED OUT: No longer showing multiple styles */}
          {/* <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">
                <strong className="text-blue-700">💡 Tip:</strong> Each header
                style is designed for different grade levels. Choose the one
                that best matches your students' standards.
              </p>
            </div>
          </div> */}
        </div>

        {/* Headers Grid - COMMENTED OUT: Only showing one header design */}
        {/* 
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {headers.map((header, index) => (
            <div
              key={header.id}
              className="transform transition-all duration-300 hover:scale-105"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-full">
                  Style {index + 1}
                </div>
                <span className="text-gray-600 text-sm">
                  {header.layoutType === "primary" && "Standards 1-5"}
                  {header.layoutType === "middle" && "Standards 6-8"}
                  {header.layoutType === "high" && "Standards 9-10"}
                  {header.layoutType === "senior" && "Standards 11-12"}
                </span>
              </div>

              <HeaderCard
                header={header}
                typeOfPaper={typeOfPaper}
                width="full"
              />
            </div>
          ))}
        </div>
        */}

        {/* Single Header Design */}
        <div className="max-w-2xl mx-auto">
          <HeaderCard
            header={headers[0]}
            typeOfPaper={typeOfPaper}
            width="full"
          />
        </div>

        {/* Bottom Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 text-sm">
            Click on the header to customize and use it in your paper
          </p>
        </div>
      </div>
    </div>
  );
};

export default Header;
