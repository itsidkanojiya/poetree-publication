import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPapersByUserId } from "../services/paperService";
import { deletePaperById } from "../services/paperService";
import {
  getQuizPaperPdf,
  getQuizAnswerKey,
  getQuizOmrSheet,
} from "../services/quizService";
import {
  ClipboardList,
  Plus,
  Eye,
  Edit,
  Trash2,
  FileDown,
  ChevronDown,
  Calendar,
  FileText,
  Loader,
} from "lucide-react";

const QuizzesList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportDropdownId, setExportDropdownId] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchQuizzes = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getPapersByUserId(user.id, { type: "quiz" });
      const list = Array.isArray(data) ? data : data?.papers || [];
      setQuizzes(list);
    } catch (err) {
      console.error("Error fetching quizzes:", err);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [user?.id]);

  const handleDownload = async (quizId, type) => {
    setDownloading(quizId);
    setExportDropdownId(null);
    try {
      if (type === "student") await getQuizPaperPdf(quizId, "quiz-student.pdf");
      else if (type === "answer-key") await getQuizAnswerKey(quizId, "quiz-answer-key.pdf");
      else if (type === "omr") await getQuizOmrSheet(quizId, "quiz-omr-sheet.pdf");
    } catch (err) {
      console.error("Download failed:", err);
      alert(err.message || "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deletePaperById(deleteConfirm);
      setQuizzes((prev) => prev.filter((q) => q.id !== deleteConfirm && q.paper_id !== deleteConfirm));
      setDeleteConfirm(null);
    } catch (err) {
      alert(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const getPaperId = (q) => q.id ?? q.paper_id;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                My Quizzes
              </h1>
              <p className="text-gray-600 mt-1">Create and manage printable quizzes</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard/quizzes/new")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition"
          >
            <Plus className="w-5 h-5" />
            New Quiz
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-12 h-12 text-amber-500 mb-4 animate-spin" />
            <p className="text-gray-600">Loading quizzes...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-xl border border-gray-100">
            <ClipboardList className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-600 mb-2">No quizzes yet</p>
            <p className="text-gray-500 mb-6">Create your first quiz and get MCQs, answer key, and OMR sheet.</p>
            <button
              onClick={() => navigate("/dashboard/quizzes/new")}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition"
            >
              Create Quiz
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const id = getPaperId(quiz);
              const title = quiz.paper_title || quiz.title || "Untitled Quiz";
              const date = quiz.date || quiz.created_at;
              const questionCount = Array.isArray(quiz.body)
                ? quiz.body.length
                : (typeof quiz.body === "string" ? (() => { try { return JSON.parse(quiz.body).length; } catch { return 0; } })() : 0);
              const isExportOpen = exportDropdownId === id;
              const isDownloading = downloading === id;

              return (
                <div
                  key={id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-200 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-3 flex items-center justify-between">
                    <span className="font-semibold">Quiz</span>
                    {date && (
                      <span className="text-sm flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-2 mb-2">{title}</h3>
                    {quiz.subject && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Subject:</span> {quiz.subject}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mb-4">{questionCount} question(s)</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => navigate(`/dashboard/quizzes/${id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/quizzes/${id}/edit`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setExportDropdownId(isExportOpen ? null : id)}
                          disabled={!!downloading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium disabled:opacity-50"
                        >
                          <FileDown className="w-4 h-4" />
                          Export {isDownloading ? "..." : ""}
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        {isExportOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setExportDropdownId(null)} />
                            <div className="absolute left-0 top-full mt-1 py-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                              <button
                                onClick={() => handleDownload(id, "student")}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <FileText className="w-4 h-4" />
                                Student PDF
                              </button>
                              <button
                                onClick={() => handleDownload(id, "answer-key")}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <FileText className="w-4 h-4" />
                                Answer Key
                              </button>
                              <button
                                onClick={() => handleDownload(id, "omr")}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <FileText className="w-4 h-4" />
                                OMR Sheet
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => setDeleteConfirm(id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
              <p className="text-gray-800 font-medium mb-4">Delete this quiz? This cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizzesList;
