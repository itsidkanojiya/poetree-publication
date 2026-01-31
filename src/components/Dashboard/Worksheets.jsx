import { useEffect, useState } from "react";
import { Eye, FileText } from "lucide-react";
import PDFModal from "../Common/Modals/PDFModal";
import apiClient from "../../services/apiClient";
import Loader from "../Common/loader/loader";
import { useUserTeaching } from "../../context/UserTeachingContext";

const Worksheets = () => {
  const { contextSelection } = useUserTeaching();
  const [loading, setLoading] = useState(true);
  const [worksheets, setWorksheets] = useState([]);
  const [filteredWorksheets, setFilteredWorksheets] = useState([]);

  const [selectedPDF, setSelectedPDF] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const worksheetRes = await apiClient.get("/worksheets");
        setWorksheets(worksheetRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter by selected teaching context
  useEffect(() => {
    if (!contextSelection) {
      setFilteredWorksheets(worksheets);
      return;
    }
    const filtered = worksheets.filter((ws) => {
      const subjectMatch = !contextSelection.subject_name || ws.subject === contextSelection.subject_name;
      const standardMatch = contextSelection.standard == null || parseInt(ws.standard) === parseInt(contextSelection.standard);
      return subjectMatch && standardMatch;
    });
    setFilteredWorksheets(filtered);
  }, [contextSelection, worksheets]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Worksheets Collection
              </h1>
              <p className="text-gray-600 mt-1">
                Browse and download practice worksheets for all standards
              </p>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing{" "}
            <span className="font-bold text-gray-800">
              {filteredWorksheets.length}
            </span>{" "}
            worksheet
            {filteredWorksheets.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Worksheets Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader />
          </div>
        ) : filteredWorksheets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredWorksheets.map((sheet) => (
              <div
                key={sheet.worksheet_id}
                onClick={() => {
                  setSelectedPDF(sheet.worksheet_url);
                  setSelectedTitle(
                    sheet.subject_title || sheet.subject || "Worksheet"
                  );
                  setIsModalOpen(true);
                }}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 overflow-hidden border border-gray-200"
              >
                {/* Subject Badge */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center py-2 font-semibold">
                  {sheet.subject || "Untitled"}
                </div>

                {/* Image Container */}
                <div className="relative p-4">
                  <div className="relative rounded-xl overflow-hidden shadow-md">
                    <img
                      src={sheet.worksheet_coverlink}
                      className="w-full h-48 object-cover"
                      alt={`Worksheet cover for ${
                        sheet.subject_title || sheet.subject
                      }`}
                    />

                    {/* Overlay on Hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Eye className="w-12 h-12 mx-auto mb-2" />
                        <p className="font-semibold">View Worksheet</p>
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
                    {sheet.subject_title || "Worksheet"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-600 mb-2">
              No Worksheets Found
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

export default Worksheets;
