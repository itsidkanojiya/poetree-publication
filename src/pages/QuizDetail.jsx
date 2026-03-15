import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuizWithQuestions } from "../services/quizService";
import {
  getQuizPaperPdf,
  getQuizAnswerKey,
  getQuizOmrSheet,
} from "../services/quizService";
import {
  ArrowLeft,
  FileDown,
  FileText,
  Loader,
  ClipboardList,
} from "lucide-react";

const QuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getQuizWithQuestions(id);
        if (cancelled) return;
        const paper = data?.paper ?? data;
        setQuiz(paper);
        const qs = data?.questions ?? data?.question ?? paper?.questions ?? [];
        setQuestions(Array.isArray(qs) ? qs : []);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.status === 404 ? "Quiz not found" : err.message || "Failed to load quiz");
          setQuiz(null);
          setQuestions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleDownload = async (type) => {
    setDownloading(type);
    try {
      if (type === "student") await getQuizPaperPdf(id, "quiz-student.pdf");
      else if (type === "answer-key") await getQuizAnswerKey(id, "quiz-answer-key.pdf");
      else if (type === "omr") await getQuizOmrSheet(id, "quiz-omr-sheet.pdf");
    } catch (err) {
      alert(err.message || "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const title = quiz?.paper_title || quiz?.title || "Quiz";
  const optionsList = (q) => {
    if (!q.options) return [];
    try {
      const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
      return Array.isArray(opts) ? opts : [];
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <p className="text-red-600 mb-4">{error || "Quiz not found"}</p>
        <button
          onClick={() => navigate("/dashboard/quizzes")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={() => navigate("/dashboard/quizzes")}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Quizzes
          </button>
          <button
            onClick={() => navigate(`/dashboard/quizzes/${id}/edit`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium"
          >
            Edit Quiz
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-4">
            <h1 className="text-2xl font-bold">{title}</h1>
            {quiz.subject && <p className="text-amber-100 mt-1">Subject: {quiz.subject}</p>}
            {quiz.date && <p className="text-amber-100 text-sm mt-1">Date: {new Date(quiz.date).toLocaleDateString()}</p>}
            <p className="text-amber-100 text-sm">{questions.length} question(s)</p>
          </div>

          <div className="p-6 border-b border-gray-200 flex flex-wrap gap-3">
            <button
              onClick={() => handleDownload("student")}
              disabled={!!downloading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium disabled:opacity-50"
            >
              <FileDown className="w-5 h-5" />
              {downloading === "student" ? "Downloading..." : "Download Student PDF"}
            </button>
            <button
              onClick={() => handleDownload("answer-key")}
              disabled={!!downloading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
            >
              <FileText className="w-5 h-5" />
              {downloading === "answer-key" ? "Downloading..." : "Download Answer Key"}
            </button>
            <button
              onClick={() => handleDownload("omr")}
              disabled={!!downloading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              <ClipboardList className="w-5 h-5" />
              {downloading === "omr" ? "Downloading..." : "Download OMR Sheet"}
            </button>
          </div>

          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Questions (preview)</h2>
            <ol className="space-y-4 list-decimal list-inside">
              {questions.map((q, idx) => {
                const opts = optionsList(q);
                return (
                  <li key={q.question_id || idx} className="text-gray-700">
                    <span className="font-medium">{q.question || "—"}</span>
                    {opts.length > 0 && (
                      <ul className="mt-2 ml-4 space-y-1 text-sm text-gray-600">
                        {opts.map((o, i) => (
                          <li key={i}>
                            {String.fromCharCode(65 + i)}. {typeof o === "object" ? (o.option ?? o.text ?? JSON.stringify(o)) : o}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizDetail;
