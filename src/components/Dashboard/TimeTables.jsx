import { useEffect, useState } from "react";
import { Eye, CalendarClock } from "lucide-react";
import PDFModal from "../Common/Modals/PDFModal";
import apiClient from "../../services/apiClient";
import Loader from "../Common/loader/loader";
import { useUserTeaching } from "../../context/UserTeachingContext";

const TimeTables = () => {
  const { contextSelection } = useUserTeaching();
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get("/timetables");
        setItems(res.data || []);
      } catch (error) {
        console.error("Error loading time tables:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!contextSelection) {
      setFiltered(items);
      return;
    }
    const result = items.filter((p) => {
      const subjectMatch =
        (!contextSelection.subject_id && !contextSelection.subject_name) ||
        String(p.subject_id ?? "") === String(contextSelection.subject_id) ||
        (contextSelection.subject_name && p.subject === contextSelection.subject_name);
      const boardMatch =
        (!contextSelection.board_id && !contextSelection.board_name) ||
        String(p.board_id ?? "") === String(contextSelection.board_id) ||
        (contextSelection.board_name && (p.board_name || p.board) === contextSelection.board_name);
      const stds = Array.isArray(p.standard)
        ? p.standard
        : (p.standards?.map((s) => s.standard_id) ?? []);
      const standardMatch =
        contextSelection.standard == null ||
        stds.map(Number).includes(parseInt(contextSelection.standard));
      return subjectMatch && boardMatch && standardMatch;
    });
    setFiltered(result);
  }, [contextSelection, items]);

  const openPdf = (p) => {
    if (!p.timetable_pdf_url) return;
    setSelectedPDF(p.timetable_pdf_url);
    setSelectedTitle(p.title || "Time Table");
    setIsModalOpen(true);
  };

  const stdLabel = (p) =>
    (Array.isArray(p.standards) && p.standards.length
      ? p.standards.map((s) => s.name ?? s.standard_id)
      : (Array.isArray(p.standard) ? p.standard : [])
    ).join(", ");

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <CalendarClock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                Time Tables
              </h1>
              <p className="text-gray-600 mt-1">Download time tables for your class</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-bold text-gray-800">{filtered.length}</span> time table
            {filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((p) => (
              <div
                key={p.timetable_id}
                onClick={() => openPdf(p)}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 cursor-pointer flex flex-col"
              >
                <div className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-center py-2 font-semibold">
                  {p.subject || "Time Table"}
                </div>
                <div className="relative p-4">
                  <div className="relative rounded-xl overflow-hidden shadow-md bg-gray-50 h-40 flex items-center justify-center">
                    <CalendarClock className="w-14 h-14 text-indigo-300" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Eye className="w-10 h-10 mx-auto mb-2" />
                        <p className="font-semibold">View PDF</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-between items-center mt-3 gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                      {p.board || "N/A"}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                      Std {stdLabel(p) || "—"}
                    </span>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <p className="text-sm font-semibold text-gray-800 text-center truncate">{p.title || "Time Table"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <CalendarClock className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-600 mb-2">No Time Tables Found</p>
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

export default TimeTables;
