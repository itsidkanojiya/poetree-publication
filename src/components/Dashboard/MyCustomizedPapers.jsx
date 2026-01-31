import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Eye, Edit, Search } from "lucide-react";
import { getMyCustomizedPapers } from "../../services/paperService";
import Toast from "../Common/Toast";
import Loader from "../Common/loader/loader";

const MyCustomizedPapers = () => {
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    fetchPapers();
  }, []);

  useEffect(() => {
    filterPapers();
  }, [searchTerm, papers]);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const response = await getMyCustomizedPapers();
      const papersData = response?.papers || response?.data || response || [];
      setPapers(Array.isArray(papersData) ? papersData : []);
      setFilteredPapers(Array.isArray(papersData) ? papersData : []);
    } catch (error) {
      console.error("Error fetching papers:", error);
      setToast({
        show: true,
        message: "Failed to load customized papers",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPapers = () => {
    let filtered = [...papers];

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPapers(filtered);
  };

  const handleViewPaper = (id) => {
    navigate(`/dashboard/papers/${id}/customize`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Customized Papers</h1>
          <p className="text-gray-600 mt-1">Papers you customized from templates</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search papers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
            />
          </div>
        </div>

        {/* Papers Grid */}
        {filteredPapers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Customized Papers</h3>
            <p className="text-gray-500 mb-6">You haven't customized any templates yet</p>
            <button
              onClick={() => navigate("/dashboard/templates")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Browse Templates
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      {paper.title || "Untitled Paper"}
                    </h3>
                    <p className="text-sm text-gray-600">{paper.subject || paper.template_subject}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Standard:</span>
                    <span className="font-semibold text-gray-800">Std {paper.standard}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Marks:</span>
                    <span className="font-semibold text-gray-800">{paper.total_marks || 0}</span>
                  </div>
                  {paper.customizations_count !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Customizations:</span>
                      <span className="font-semibold text-gray-800">
                        {paper.customizations_count} questions
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleViewPaper(paper.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Paper</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyCustomizedPapers;















