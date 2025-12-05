import React, { useEffect, useState } from "react";
import { getAllPapers, getPapersByUserId } from "../services/paperService";
import { usePaper } from "../context/PaperContext";
import PaperCard from "../components/Cards/PaperCard";
import { useAuth } from "../context/AuthContext";
import { Filter, Calendar, FileText, Clock, Search } from "lucide-react";
import { useLocation } from "react-router-dom";

const History = () => {
  const { papers, refreshPapers, loading } = usePaper();
  const location = useLocation();
  const [filters, setFilters] = useState({
    type: "all",
    dateFrom: "",
    dateTo: "",
    searchQuery: "",
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  let allPapers = Array.isArray(papers) ? papers : papers?.papers || [];

  // Apply all filters
  const filteredPapers = allPapers.filter((paper) => {
    // Filter by type
    const typeMatch = filters.type === "all" || paper.type === filters.type;

    // Filter by date range
    let dateMatch = true;
    if (filters.dateFrom || filters.dateTo) {
      const paperDate = new Date(paper.created_at || paper.date);
      const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

      if (fromDate && paperDate < fromDate) dateMatch = false;
      if (toDate && paperDate > toDate) dateMatch = false;
    }

    // Filter by search query
    const searchMatch = filters.searchQuery
      ? paper.title
          ?.toLowerCase()
          .includes(filters.searchQuery.toLowerCase()) ||
        paper.subject
          ?.toLowerCase()
          .includes(filters.searchQuery.toLowerCase()) ||
        paper.type?.toLowerCase().includes(filters.searchQuery.toLowerCase())
      : true;

    return typeMatch && dateMatch && searchMatch;
  });

  const clearFilters = () => {
    setFilters({
      type: "all",
      dateFrom: "",
      dateTo: "",
      searchQuery: "",
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  // Refresh papers when component mounts or location changes
  useEffect(() => {
    const refreshData = async () => {
      if (refreshPapers) {
        setIsRefreshing(true);
        await refreshPapers();
        setIsRefreshing(false);
      }
    };
    
    refreshData();
  }, [location.pathname]);
  
  // Also refresh when location state indicates a refresh is needed
  useEffect(() => {
    if (location.state?.refresh) {
      const refreshData = async () => {
        if (refreshPapers) {
          setIsRefreshing(true);
          await refreshPapers();
          setIsRefreshing(false);
        }
      };
      refreshData();
      // Clear the refresh flag
      window.history.replaceState({}, document.title);
    }
  }, [location.state, refreshPapers]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Paper History
              </h1>
              <p className="text-gray-600 mt-1">
                View and manage all your generated papers
              </p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Filter Papers</h2>
          </div>

          <div className="space-y-6">
            {/* Search Bar */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-600" />
                Search Papers
              </label>
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) =>
                  handleFilterChange("searchQuery", e.target.value)
                }
                placeholder="Search by title, subject, or type..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
              />
            </div>

            {/* Type and Date Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Paper Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Paper Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="default">Pre-Built Papers</option>
                  <option value="custom">Custom Papers</option>
                </select>
              </div>

              {/* Date From Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    handleFilterChange("dateFrom", e.target.value)
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition outline-none"
                />
              </div>

              {/* Date To Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition outline-none"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-gray-600">
              Showing{" "}
              <span className="font-bold text-gray-800">
                {filteredPapers.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-gray-800">
                {allPapers.length}
              </span>{" "}
              paper{allPapers.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Active Filters Display */}
          {(filters.type !== "all" ||
            filters.dateFrom ||
            filters.dateTo ||
            filters.searchQuery) && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.type !== "all" && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  {filters.type === "default" ? "Pre-Built" : "Custom"}
                </span>
              )}
              {filters.dateFrom && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  From: {new Date(filters.dateFrom).toLocaleDateString()}
                </span>
              )}
              {filters.dateTo && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                  To: {new Date(filters.dateTo).toLocaleDateString()}
                </span>
              )}
              {filters.searchQuery && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                  Search: {filters.searchQuery}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Loading Indicator */}
        {(loading || isRefreshing) && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading papers...</p>
          </div>
        )}

        {/* Papers Grid */}
        {!loading && !isRefreshing && filteredPapers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPapers.map((paper, index) => (
              <PaperCard key={paper.id || index} {...paper} />
            ))}
          </div>
        ) : !loading && !isRefreshing ? (
          <div className="text-center py-20">
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-600 mb-2">
              No Papers Found
            </p>
            <p className="text-gray-500 mb-6">
              {allPapers.length === 0
                ? "You haven't created any papers yet"
                : "Try adjusting your filters to see more results"}
            </p>
            {allPapers.length === 0 && (
              <button
                onClick={() => (window.location.href = "/dashboard")}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition"
              >
                Create Your First Paper
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default History;
