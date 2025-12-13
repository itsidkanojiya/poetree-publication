import { useState, useEffect } from "react";
import { getTeacherAnalysis, getQuestionAnalysis } from "../../services/adminService";
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  FileText,
  BarChart3,
} from "lucide-react";

const AnalysisDashboard = () => {
  const [teacherData, setTeacherData] = useState(null);
  const [questionData, setQuestionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teacherAnalysis, questionAnalysis] = await Promise.all([
        getTeacherAnalysis(),
        getQuestionAnalysis(),
      ]);
      setTeacherData(teacherAnalysis);
      setQuestionData(questionAnalysis);
    } catch (err) {
      console.error("Error fetching analysis data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <div className="text-center">
            <div className="p-4 bg-red-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <UserX size={40} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchData}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data for monthly users
  const chartData = teacherData?.chart || {};
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const maxValue = Math.max(...Object.values(chartData), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Overview of system statistics and analytics</p>
        </div>

        {/* Stats Cards - Teacher Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Teachers */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100 hover:border-green-300 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {teacherData?.active || 0}
            </h3>
            <p className="text-gray-600 font-medium">Active Teachers</p>
            <p className="text-xs text-gray-500 mt-2">Currently active users</p>
          </div>

          {/* Pending Teachers */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100 hover:border-amber-300 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                <UserX className="w-8 h-8 text-white" />
              </div>
              <div className="flex items-center gap-1 text-amber-600 text-sm font-semibold">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {teacherData?.pending || 0}
            </h3>
            <p className="text-gray-600 font-medium">Pending Teachers</p>
            <p className="text-xs text-gray-500 mt-2">Awaiting approval</p>
          </div>

          {/* Monthly Users */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 hover:border-blue-300 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="flex items-center gap-1 text-blue-600 text-sm font-semibold">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {teacherData?.monthly_users || 0}
            </h3>
            <p className="text-gray-600 font-medium">Monthly Users</p>
            <p className="text-xs text-gray-500 mt-2">This month's total</p>
          </div>

          {/* Daily Users */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100 hover:border-purple-300 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="flex items-center gap-1 text-purple-600 text-sm font-semibold">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {teacherData?.daily_users || 0}
            </h3>
            <p className="text-gray-600 font-medium">Daily Users</p>
            <p className="text-xs text-gray-500 mt-2">Today's active users</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Users Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Monthly Users Growth
                </h2>
                <p className="text-gray-600 text-sm">User registration over time</p>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between gap-2">
              {months.map((month, index) => {
                const value = chartData[index + 1] || 0;
                const height = (value / maxValue) * 100;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end h-full">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-indigo-600 rounded-t-lg transition-all hover:from-blue-600 hover:to-indigo-700"
                        style={{ height: `${height}%`, minHeight: "4px" }}
                        title={`${month}: ${value}`}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 mt-2">{month}</span>
                    <span className="text-xs font-semibold text-gray-800 mt-1">
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question Statistics */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Question Statistics
                </h2>
                <p className="text-gray-600 text-sm">Questions by type</p>
              </div>
            </div>
            <div className="space-y-4">
              {questionData && (
                <>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-gray-700">Total Questions</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {questionData.total || 0}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">MCQ</span>
                      <p className="text-xl font-bold text-gray-800">
                        {questionData.mcq || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Short Answer</span>
                      <p className="text-xl font-bold text-gray-800">
                        {questionData.short || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Long Answer</span>
                      <p className="text-xl font-bold text-gray-800">
                        {questionData.long || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">True & False</span>
                      <p className="text-xl font-bold text-gray-800">
                        {questionData["true&false"] || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Fill in Blanks</span>
                      <p className="text-xl font-bold text-gray-800">
                        {questionData.blank || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">One Two</span>
                      <p className="text-xl font-bold text-gray-800">
                        {questionData.onetwo || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Passage</span>
                      <p className="text-xl font-bold text-gray-800">
                        {questionData.passage || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Match</span>
                      <p className="text-xl font-bold text-gray-800">
                        {questionData.match || 0}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;

