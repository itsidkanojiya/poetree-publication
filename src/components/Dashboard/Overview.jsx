import { useState, useEffect } from "react";
import {
  FileText,
  FilePlus,
  ClipboardCheck,
  TrendingUp,
  BookOpen,
  FileCheck,
  Sparkles,
  ArrowRight,
  XCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import Toast from "../Common/Toast";

const Overview = () => {
  const navigate = useNavigate();
  const [stats] = useState({
    papers: 12,
    worksheets: 10,
    answerSheets: 5,
  });
  const [approvedSubjectIds, setApprovedSubjectIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "error",
  });

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

  const handlePrebuildNavigate = () => {
    if (approvedSubjectIds.length === 0) {
      setToast({
        show: true,
        message:
          "You need approved subjects to access Question Papers. Please request subjects from admin.",
        type: "error",
      });
      setTimeout(() => {
        navigate("/dashboard/subject-requests");
      }, 2000);
      return;
    }
    navigate("/dashboard/generate/header", { state: { from: "prebuild" } });
  };

  const handleCustomNavigate = () => {
    if (approvedSubjectIds.length === 0) {
      setToast({
        show: true,
        message:
          "You need approved subjects to access Question Papers. Please request subjects from admin.",
        type: "error",
      });
      setTimeout(() => {
        navigate("/dashboard/subject-requests");
      }, 2000);
      return;
    }
    navigate("/dashboard/generate/header", { state: { from: "custom" } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <p className="text-gray-600">Good evening,</p>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Siddharth Kanojiya!
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back to your exam paper builder dashboard
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Papers Card */}
          <Link to="/dashboard/history">
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-blue-100 hover:border-blue-300 cursor-pointer transform hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-blue-300 transition-shadow">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  <span>+12%</span>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">
                {stats.papers}
              </h3>
              <p className="text-gray-600 font-medium">Question Papers</p>
              <p className="text-xs text-gray-500 mt-2">
                Total papers generated
              </p>
            </div>
          </Link>

          {/* Worksheets Card */}
          <Link to="/dashboard/generate/worksheets">
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-green-100 hover:border-green-300 cursor-pointer transform hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:shadow-green-300 transition-shadow">
                  <FilePlus className="w-8 h-8 text-white" />
                </div>
                <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  <span>+8%</span>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">
                {stats.worksheets}
              </h3>
              <p className="text-gray-600 font-medium">Practice Worksheets</p>
              <p className="text-xs text-gray-500 mt-2">
                Active worksheets created
              </p>
            </div>
          </Link>

          {/* Answer Sheets Card */}
          <Link to="/dashboard/generate/answersheets">
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-red-100 hover:border-red-300 cursor-pointer transform hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg group-hover:shadow-red-300 transition-shadow">
                  <ClipboardCheck className="w-8 h-8 text-white" />
                </div>
                <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  <span>+5%</span>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">
                {stats.answerSheets}
              </h3>
              <p className="text-gray-600 font-medium">Answer Sheets</p>
              <p className="text-xs text-gray-500 mt-2">
                Assessment solutions ready
              </p>
            </div>
          </Link>
        </div>

        {/* Exam Paper Builder Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Exam Paper Builder
              </h2>
              <p className="text-gray-600 text-sm">
                Create professional question papers instantly
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pre-Built Papers */}
            <div
              onClick={handlePrebuildNavigate}
              className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 cursor-pointer transform hover:-translate-y-2 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

              <div className="relative z-10">
                <div className="p-3 bg-white/20 rounded-xl w-fit mb-4 backdrop-blur-sm">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Pre-Built Question Papers
                </h3>
                <p className="text-blue-100 mb-6">
                  Choose from ready-made templates with curated questions
                </p>
                <div className="flex items-center gap-2 text-white font-semibold group-hover:gap-4 transition-all">
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Custom Papers */}
            <div
              onClick={handleCustomNavigate}
              className="group relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 cursor-pointer transform hover:-translate-y-2 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

              <div className="relative z-10">
                <div className="p-3 bg-white/20 rounded-xl w-fit mb-4 backdrop-blur-sm">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Personalized Paper Generator
                </h3>
                <p className="text-green-100 mb-6">
                  Create custom papers tailored to your specific requirements
                </p>
                <div className="flex items-center gap-2 text-white font-semibold group-hover:gap-4 transition-all">
                  <span>Create Now</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Materials Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Assessment Materials
              </h2>
              <p className="text-gray-600 text-sm">
                Additional resources for teaching and evaluation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Practice Worksheets */}
            <Link to="/dashboard/generate/worksheets">
              <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-200 hover:border-gray-300 cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg flex-shrink-0">
                    <FilePlus className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Practice Worksheets
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Generate practice exercises for students to reinforce
                      learning concepts
                    </p>
                    <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm group-hover:text-gray-800 group-hover:gap-3 transition-all">
                      <span>Create Worksheet</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Assessment Answers */}
            <Link to="/dashboard/generate/answersheets">
              <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-200 hover:border-gray-300 cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg flex-shrink-0">
                    <ClipboardCheck className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Assessment Answers
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Create comprehensive answer sheets and marking schemes
                    </p>
                    <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm group-hover:text-gray-800 group-hover:gap-3 transition-all">
                      <span>Generate Answers</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Quick Tips Card */}
        <div className="mt-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                💡 Quick Tip
              </h3>
              <p className="text-gray-700 text-sm">
                Use the personalized paper generator to create custom questions
                based on difficulty level, topics, and question types. Save time
                and create better assessments!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
