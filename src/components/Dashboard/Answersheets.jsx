import { useEffect, useState } from "react";
import {
  Eye,
  Filter,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
} from "lucide-react";
import PDFModal from "../Common/Modals/PDFModal";
import apiClient from "../../services/apiClient";
import Loader from "../Common/loader/loader";

const Answersheets = () => {
  const [answerSheets, setAnswerSheets] = useState([]);
  const [filteredAnswerSheets, setFilteredAnswerSheets] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [boards, setBoards] = useState([]);

  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    board: "",
    subject: "",
    subject_title: "",
    standard: "",
  });

  const [selectedPDF, setSelectedPDF] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sheetRes, subjectRes, boardRes] = await Promise.all([
          apiClient.get("/answersheets"),
          apiClient.get("/subjects"),
          apiClient.get("/boards"),
        ]);
        setAnswerSheets(sheetRes.data);
        setFilteredAnswerSheets(sheetRes.data);
        setSubjects(subjectRes.data);
        setBoards(boardRes.data);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter answer sheets
  useEffect(() => {
    const filtered = answerSheets.filter((as) => {
      return (
        (filters.subject === "" || as.subject === filters.subject) &&
        (filters.subject_title === "" ||
          as.subject_title === filters.subject_title) &&
        (filters.board === "" || as.board === filters.board) &&
        (filters.standard === "" ||
          parseInt(as.standard) === parseInt(filters.standard))
      );
    });

    setFilteredAnswerSheets(filtered);
  }, [filters, answerSheets]);

  const clearFilters = () => {
    setFilters({ board: "", subject: "", subject_title: "", standard: "" });
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
              <ClipboardCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
                Answer Sheets Collection
              </h1>
              <p className="text-gray-600 mt-1">
                Access comprehensive answer keys and solutions
              </p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">
              Filter Answer Sheets
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Board Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Select Board
              </label>
              <select
                value={filters.board}
                onChange={(e) =>
                  setFilters({ ...filters, board: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
              >
                <option value="">All Boards</option>
                {boards.map((board) => (
                  <option key={board.board_id} value={board.board_name}>
                    {board.board_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-green-600" />
                Select Subject
              </label>
              <select
                value={filters.subject}
                onChange={(e) =>
                  setFilters({ ...filters, subject: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition outline-none"
              >
                <option value="">All Subjects</option>
                {subjects.map((sub) => (
                  <option key={sub.subject_id} value={sub.subject_name}>
                    {sub.subject_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Standard Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                Select Standard
              </label>
              <select
                value={filters.standard}
                onChange={(e) =>
                  setFilters({ ...filters, standard: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition outline-none"
              >
                <option value="">All Standards</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Standard {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing{" "}
            <span className="font-bold text-gray-800">
              {filteredAnswerSheets.length}
            </span>{" "}
            answer sheet
            {filteredAnswerSheets.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Answer Sheets Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader />
          </div>
        ) : filteredAnswerSheets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAnswerSheets.map((sheet) => (
              <div
                key={sheet.worksheet_id}
                onClick={() => {
                  setSelectedPDF(sheet.worksheet_url);
                  setSelectedTitle(
                    sheet.subject_title || sheet.subject || "Answer Sheet"
                  );
                  setIsModalOpen(true);
                }}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 overflow-hidden border border-gray-200"
              >
                {/* Subject Badge */}
                <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-center py-2 font-semibold">
                  {sheet.subject || "Untitled"}
                </div>

                {/* Image Container */}
                <div className="relative p-4">
                  <div className="relative rounded-xl overflow-hidden shadow-md">
                    <img
                      src={sheet.worksheet_coverlink}
                      className="w-full h-48 object-cover"
                      alt={`Answer sheet cover for ${
                        sheet.subject_title || sheet.subject
                      }`}
                    />

                    {/* Overlay on Hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Eye className="w-12 h-12 mx-auto mb-2" />
                        <p className="font-semibold">View Answer Sheet</p>
                      </div>
                    </div>
                  </div>

                  {/* Info Badges */}
                  <div className="flex justify-between items-center mt-3 gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                      {sheet.board || "N/A"}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                      Std {sheet.standard}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div className="px-4 pb-4">
                  <p className="text-sm font-semibold text-gray-800 text-center truncate">
                    {sheet.subject_title || "Answer Sheet"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <ClipboardCheck className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-600 mb-2">
              No Answer Sheets Found
            </p>
            <p className="text-gray-500">
              Try adjusting your filters to see more results
            </p>
          </div>
        )}
      </div>

      {/* PDF Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl overflow-hidden shadow-2xl">
            <PDFModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              pdfUrl={selectedPDF}
              title={selectedTitle}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Answersheets;
