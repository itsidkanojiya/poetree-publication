import { useState, useEffect } from "react";
import { getTeacherAnalysis, getQuestionAnalysis } from "../../services/adminService";
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  FileText,
  BarChart3,
  Activity,
} from "lucide-react";

const Analysis = () => {
  const [teacherData, setTeacherData] = useState(null);
  const [questionData, setQuestionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teacherAnalysis, questionAnalysis] = await Promise.all([
        getTeacherAnalysis(),
        getQuestionAnalysis(),
      ]);
      setTeacherData(teacherAnalysis);
      setQuestionData(questionAnalysis);
      setError(null);
    } catch (err) {
      console.error("Error fetching analysis data:", err);
      setError("Failed to load analysis data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading analysis data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <p className="text-red-800 font-semibold">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data for monthly users
  const chartData = teacherData?.chart || {};
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const chartValues = months.map((_, index) => chartData[String(index + 1)] || 0);
  const maxValue = Math.max(...chartValues, 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Overview of teachers, students, and questions</p>
        </div>

        {/* Teacher Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Teachers */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {teacherData?.active || 0}
            </h3>
            <p className="text-gray-600 font-medium">Active Teachers</p>
          </div>

          {/* Pending Teachers */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                <UserX className="w-8 h-8 text-white" />
              </div>
              <Activity className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {teacherData?.pending || 0}
            </h3>
            <p className="text-gray-600 font-medium">Pending Teachers</p>
          </div>

          {/* Monthly Users */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Users className="w-8 h-8 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {teacherData?.monthly_users || 0}
            </h3>
            <p className="text-gray-600 font-medium">Monthly Users</p>
          </div>

          {/* Daily Users */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {teacherData?.daily_users || 0}
            </h3>
            <p className="text-gray-600 font-medium">Daily Users</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Users Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">Monthly Users Growth</h2>
            </div>
            <div className="space-y-2">
              {months.map((month, index) => {
                const value = chartValues[index];
                const percentage = (value / maxValue) * 100;
                return (
                  <div key={month} className="flex items-center gap-4">
                    <div className="w-12 text-sm font-medium text-gray-600">{month}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${percentage}%` }}
                      >
                        {value > 0 && (
                          <span className="text-white text-xs font-semibold">{value}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question Statistics */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-800">Question Statistics</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-gray-700">Total Questions</span>
                <span className="text-2xl font-bold text-blue-600">
                  {questionData?.total || 0}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">MCQ</div>
                  <div className="text-xl font-bold text-green-600">
                    {questionData?.mcq || 0}
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Long Answer</div>
                  <div className="text-xl font-bold text-purple-600">
                    {questionData?.long || 0}
                  </div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Short Answer</div>
                  <div className="text-xl font-bold text-orange-600">
                    {questionData?.short || 0}
                  </div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">True & False</div>
                  <div className="text-xl font-bold text-red-600">
                    {questionData?.["true&false"] || 0}
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Fill in Blanks</div>
                  <div className="text-xl font-bold text-yellow-600">
                    {questionData?.blank || 0}
                  </div>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">One Two</div>
                  <div className="text-xl font-bold text-indigo-600">
                    {questionData?.onetwo || 0}
                  </div>
                </div>
                <div className="p-3 bg-pink-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Passage</div>
                  <div className="text-xl font-bold text-pink-600">
                    {questionData?.passage || 0}
                  </div>
                </div>
                <div className="p-3 bg-teal-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Match</div>
                  <div className="text-xl font-bold text-teal-600">
                    {questionData?.match || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;

