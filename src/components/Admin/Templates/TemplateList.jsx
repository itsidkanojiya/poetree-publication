import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Eye, Search, Filter } from "lucide-react";
import Toast from "../../Common/Toast";
import apiClient from "../../../services/apiClient";

const TemplateList = () => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    subject: "",
    standard: "",
    board: "",
  });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [searchTerm, filters, templates]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.subject) params.append("subject", filters.subject);
      if (filters.standard) params.append("standard", filters.standard);
      if (filters.board) params.append("board", filters.board);
      
      const queryString = params.toString();
      const url = `/papers/templates${queryString ? `?${queryString}` : ""}`;
      const response = await apiClient.get(url);
      
      // Handle different response structures
      let templatesData = [];
      if (response?.data) {
        // Check various possible response structures
        if (Array.isArray(response.data)) {
          templatesData = response.data;
        } else if (Array.isArray(response.data.templates)) {
          templatesData = response.data.templates;
        } else if (Array.isArray(response.data.data)) {
          templatesData = response.data.data;
        } else if (response.data.success && Array.isArray(response.data.data)) {
          templatesData = response.data.data;
        } else if (response.data.success && Array.isArray(response.data.templates)) {
          templatesData = response.data.templates;
        }
      }
      
      // Filter to only show templates (is_template: true)
      const filteredTemplatesData = Array.isArray(templatesData) 
        ? templatesData.filter(t => t.is_template === true || t.is_template === "true" || t.is_template === 1)
        : [];
      
      console.log("Templates fetched:", filteredTemplatesData);
      setTemplates(filteredTemplatesData);
      setFilteredTemplates(filteredTemplatesData);
    } catch (error) {
      console.error("Error fetching templates:", error);
      console.error("Error response:", error.response?.data);
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to load templates",
        type: "error",
      });
      setTemplates([]);
      setFilteredTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.subject) {
      filtered = filtered.filter((t) => t.subject === filters.subject);
    }

    if (filters.standard) {
      filtered = filtered.filter((t) => String(t.standard) === String(filters.standard));
    }

    if (filters.board) {
      filtered = filtered.filter((t) => t.board === filters.board);
    }

    setFilteredTemplates(filtered);
  };

  const handleViewTemplate = (id) => {
    navigate(`/admin/templates/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Paper Templates</h1>
            <p className="text-gray-600 mt-1">Manage default paper templates</p>
          </div>
          <button
            onClick={() => navigate("/admin/templates/create")}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Create Template</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
              >
                <option value="">All Subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="English">English</option>
                <option value="Social Studies">Social Studies</option>
              </select>
              <select
                value={filters.standard}
                onChange={(e) => setFilters({ ...filters, standard: e.target.value })}
                className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
              >
                <option value="">All Standards</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((std) => (
                  <option key={std} value={std}>
                    Std {std}
                  </option>
                ))}
              </select>
              <select
                value={filters.board}
                onChange={(e) => setFilters({ ...filters, board: e.target.value })}
                className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
              >
                <option value="">All Boards</option>
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="State Board">State Board</option>
              </select>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Templates Found</h3>
            <p className="text-gray-500 mb-6">Create your first template to get started</p>
            <button
              onClick={() => navigate("/admin/templates/create")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Create Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      {template.paper_title || template.title || "Untitled Template"}
                    </h3>
                    <p className="text-sm text-gray-600">{template.subject}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Standard:</span>
                    <span className="font-semibold text-gray-800">Std {template.standard}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Board:</span>
                    <span className="font-semibold text-gray-800">{template.board}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Marks:</span>
                    <span className="font-semibold text-gray-800">{template.total_marks || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Questions:</span>
                    <span className="font-semibold text-gray-800">
                      {template.question_count || 0}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleViewTemplate(template.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default TemplateList;




