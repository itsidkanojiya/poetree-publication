import { useEffect, useState } from "react";
import { Eye, Download, FileText } from "lucide-react";
import PDFModal from "../Common/Modals/PDFModal";
import apiClient from "../../services/apiClient";
import Loader from "../Common/loader/loader";
import { useUserTeaching } from "../../context/UserTeachingContext";

const ReadymadePapers = () => {
  const { contextSelection } = useUserTeaching();
  const [papers, setPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get("/readymade-papers");
        setPapers(res.data || []);
      } catch (error) {
        console.error("Error loading readymade papers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter by selected teaching context (subject, subject title, standard, board)
  useEffect(() => {
    if (!contextSelection) {
      setFilteredPapers(papers);
      return;
    }
    const filtered = papers.filter((p) => {
      const subjectMatch =
        (!contextSelection.subject_id && !contextSelection.subject_name) ||
        String(p.subject_id ?? "") === String(contextSelection.subject_id) ||
        (contextSelection.subject_name && p.subject === contextSelection.subject_name);
      const titleMatch =
        (!contextSelection.subject_title_id && !contextSelection.subject_title_name) ||
        String(p.subject_title_id ?? "") === String(contextSelection.subject_title_id) ||
        (contextSelection.subject_title_name &&
          (p.subject_title_name || p.subject_title) === contextSelection.subject_title_name);
      const standardMatch =
        contextSelection.standard == null ||
        parseInt(p.standard) === parseInt(contextSelection.standard);
      const boardMatch =
        (!contextSelection.board_id && !contextSelection.board_name) ||
        String(p.board_id ?? "") === String(contextSelection.board_id) ||
        (contextSelection.board_name && (p.board_name || p.board) === contextSelection.board_name);
      return subjectMatch && titleMatch && standardMatch && boardMatch;
    });
    setFilteredPapers(filtered);
  }, [contextSelection, papers]);

  const openPdf = (paper) => {
    if (!paper.paper_pdf_url) return;
    setSelectedPDF(paper.paper_pdf_url);
    setSelectedTitle(paper.subject_title || paper.subject || "Readymade Paper");
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                Readymade Papers
              </h1>
              <p className="text-gray-600 mt-1">Download ready-to-use exam papers (PDF / Word)</p>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-bold text-gray-800">{filteredPapers.length}</span> paper
            {filteredPapers.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader />
          </div>
        ) : filteredPapers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPapers.map((paper) => (
              <div
                key={paper.readymade_paper_id}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 flex flex-col"
              >
                {/* Subject Badge */}
                <div className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-center py-2 font-semibold">
                  {paper.subject || "Untitled"}
                </div>

                {/* Icon area */}
                <div
                  onClick={() => openPdf(paper)}
                  className={`relative p-4 ${paper.paper_pdf_url ? "cursor-pointer" : ""}`}
                >
                  <div className="relative rounded-xl overflow-hidden shadow-md bg-gray-50 h-40 flex items-center justify-center">
                    <FileText className="w-14 h-14 text-indigo-300" />
                    {paper.paper_pdf_url && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="text-white text-center">
                          <Eye className="w-10 h-10 mx-auto mb-2" />
                          <p className="font-semibold">View PDF</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info Badges */}
                  <div className="flex flex-wrap justify-between items-center mt-3 gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                      {paper.board || "N/A"}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                      Std {paper.standard_name ?? paper.standard}
                    </span>
                    {paper.total_marks != null && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                        {paper.total_marks} Marks
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="px-4">
                  <p className="text-sm font-semibold text-gray-800 text-center truncate">
                    {paper.subject_title || "Readymade Paper"}
                  </p>
                </div>

                {/* Actions */}
                <div className="px-4 py-4 mt-auto flex items-center gap-2">
                  {paper.paper_pdf_url && (
                    <button
                      onClick={() => openPdf(paper)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View PDF</span>
                    </button>
                  )}
                  {paper.paper_word_url && (
                    <a
                      href={paper.paper_word_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      <span>Word</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-600 mb-2">No Readymade Papers Found</p>
            <p className="text-gray-500">Nothing available for your selected context yet</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
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

export default ReadymadePapers;
