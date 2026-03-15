import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUserTeaching } from "../context/UserTeachingContext";
import apiClient from "../services/apiClient";
import { getChaptersBySubjectTitle } from "../services/adminService";
import { getAllStandards } from "../services/adminService";
import { suggestMcq, saveQuiz } from "../services/quizService";
import {
  ArrowLeft,
  Check,
  FileText,
  Loader,
  Sparkles,
  ClipboardList,
  Info,
} from "lucide-react";

const CreateQuiz = () => {
  const { user } = useAuth();
  const { contextSelection } = useUserTeaching();
  const navigate = useNavigate();
  const [approvedSubjectTitles, setApprovedSubjectTitles] = useState([]);
  const [boards, setBoards] = useState([]);
  const [standards, setStandards] = useState([]);
  const [chapters, setChapters] = useState([]);

  const [subjectTitleId, setSubjectTitleId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [standard, setStandard] = useState("");
  const [boardId, setBoardId] = useState("");
  const [count, setCount] = useState(10);
  const [contextPreFilled, setContextPreFilled] = useState(false);

  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [paperTitle, setPaperTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [timing, setTiming] = useState("");

  // Pre-fill filters from dashboard context (Mathematics | workbook | Std 6 | NCERT)
  useEffect(() => {
    if (contextPreFilled || !contextSelection) return;
    const ctx = contextSelection;
    if (ctx.subject_title_id != null && ctx.subject_title_id !== "") {
      setSubjectTitleId(String(ctx.subject_title_id));
    }
    if (ctx.standard != null && ctx.standard !== "") {
      setStandard(String(ctx.standard));
    }
    if (ctx.board_id != null && ctx.board_id !== "") {
      setBoardId(String(ctx.board_id));
    }
    setContextPreFilled(true);
  }, [contextSelection, contextPreFilled]);

  // Approved selections (teacher)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await apiClient.get("/auth/my-selections/approved");
        const data = res.data?.approved_selections || {};
        const titles = [];
        (data.subject_titles || []).forEach((item) => {
          const titleId = item.subject_title_id ?? item.subjectTitle?.subject_title_id ?? item.id;
          const titleName = item.subjectTitle?.title_name ?? item.title_name ?? item.name;
          const subId = item.subject_id ?? item.subject?.subject_id;
          const subName = item.subject?.subject_name ?? item.subject_name;
          if (titleId && titleName) {
            titles.push({ id: titleId, name: titleName, subject_id: subId, subject_name: subName });
          }
        });
        if (!cancelled) setApprovedSubjectTitles(titles);
      } catch (e) {
        if (!cancelled) setApprovedSubjectTitles([]);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        const [boardsRes, standardsRes] = await Promise.all([
          apiClient.get("/boards"),
          getAllStandards(),
        ]);
        const boardsData = boardsRes.data ?? [];
        setBoards(Array.isArray(boardsData) ? boardsData : []);
        setStandards(Array.isArray(standardsRes) ? standardsRes : []);
      } catch (e) {
        setBoards([]);
        setStandards([]);
      }
    };
    run();
  }, []);

  const effectiveSubjectTitleId = contextSelection?.subject_title_id ?? subjectTitleId;
  useEffect(() => {
    if (!effectiveSubjectTitleId) {
      setChapters([]);
      return;
    }
    let cancelled = false;
    getChaptersBySubjectTitle(effectiveSubjectTitleId)
      .then((list) => { if (!cancelled) setChapters(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setChapters([]); });
    return () => { cancelled = true; };
  }, [effectiveSubjectTitleId]);

  const selectedTitle = approvedSubjectTitles.find((t) => String(t.id) === String(subjectTitleId));

  const handleSuggest = async () => {
    setSuggestLoading(true);
    setSuggestedQuestions([]);
    setSelectedIds(new Set());
    try {
      const params = {
        count: Math.min(100, Math.max(1, Number(count) || 10)),
      };
      if (contextSelection) {
        if (contextSelection.subject_id != null && contextSelection.subject_id !== "") params.subject_id = contextSelection.subject_id;
        if (contextSelection.subject_title_id != null && contextSelection.subject_title_id !== "") params.subject_title_id = contextSelection.subject_title_id;
        if (contextSelection.standard != null && contextSelection.standard !== "") params.standard = String(contextSelection.standard);
        if (contextSelection.board_id != null && contextSelection.board_id !== "") params.board_id = contextSelection.board_id;
      } else {
        if (selectedTitle?.subject_id) params.subject_id = selectedTitle.subject_id;
        if (subjectTitleId) params.subject_title_id = subjectTitleId;
        if (standard !== "") params.standard = standard;
        if (boardId) params.board_id = boardId;
      }
      if (chapterId) params.chapter_id = chapterId;
      const list = await suggestMcq(params);
      setSuggestedQuestions(Array.isArray(list) ? list : []);
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || err.message || "Failed to suggest MCQs" });
    } finally {
      setSuggestLoading(false);
    }
  };

  const toggleQuestion = (questionId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(suggestedQuestions.map((q) => q.question_id).filter(Boolean)));
  };
  const clearSelection = () => setSelectedIds(new Set());

  const getOptions = (q) => {
    try {
      const o = q.options;
      const arr = typeof o === "string" ? JSON.parse(o) : o;
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const handleSave = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      setToast({ type: "error", message: "Select at least one question" });
      return;
    }
    if (!paperTitle.trim()) {
      setToast({ type: "error", message: "Enter a quiz title" });
      return;
    }
    setSaveLoading(true);
    setToast(null);
    try {
      const metadata = {
        user: { id: user.id },
        paper_title: paperTitle.trim(),
        date: date || new Date().toISOString().split("T")[0],
        timing: timing.trim() || undefined,
        standard: contextSelection ? (contextSelection.standard ?? undefined) : (standard || undefined),
        subject: contextSelection ? (contextSelection.subject_name ?? "") : (selectedTitle?.subject_name || ""),
        subject_id: contextSelection ? (contextSelection.subject_id ?? undefined) : (selectedTitle?.subject_id),
        board: contextSelection ? (contextSelection.board_name ?? undefined) : (boardId ? boards.find((b) => String(b.board_id ?? b.id) === String(boardId))?.board_name : undefined),
        board_id: contextSelection ? (contextSelection.board_id ?? undefined) : (boardId || undefined),
        subject_title_id: contextSelection ? (contextSelection.subject_title_id ?? undefined) : (subjectTitleId || undefined),
        chapter_id: chapterId || undefined,
      };
      const result = await saveQuiz(metadata, ids);
      const newId = result?.data?.id ?? result?.id ?? result?.paper_id;
      setToast({ type: "success", message: "Quiz saved successfully" });
      if (newId) navigate(`/dashboard/quizzes/${newId}`);
      else navigate("/dashboard/quizzes");
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || err.message || "Failed to save quiz",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/dashboard/quizzes")}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Quizzes
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Quiz</h1>
        <p className="text-gray-600 mb-8">Set filters, suggest MCQs, pick questions, and save.</p>

        {toast && (
          <div
            className={`mb-6 p-4 rounded-lg ${toast.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
          >
            {toast.message}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-500" />
            Filters
          </h2>

          {contextSelection ? (
            <>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  <strong>Using your context:</strong>{" "}
                  {contextSelection.subject_name || `Subject ${contextSelection.subject_id}`}
                  <span className="mx-1.5 text-blue-600">|</span>
                  {contextSelection.subject_title_name || `Title ${contextSelection.subject_title_id}`}
                  <span className="mx-1.5 text-blue-600">|</span>
                  Std {contextSelection.standard_name ?? contextSelection.standard ?? "—"}
                  {contextSelection.board_name && (
                    <>
                      <span className="mx-1.5 text-blue-600">|</span>
                      {contextSelection.board_name}
                    </>
                  )}
                  . Change context via the bar above if needed.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chapter (optional)</label>
                  <select
                    value={chapterId}
                    onChange={(e) => setChapterId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">All chapters</option>
                    {chapters.map((ch) => (
                      <option key={ch.chapter_id} value={ch.chapter_id}>
                        {ch.chapter_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of MCQs to suggest</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value) || 10)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Title</label>
                <select
                  value={subjectTitleId}
                  onChange={(e) => {
                    setSubjectTitleId(e.target.value);
                    setChapterId("");
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select subject title</option>
                  {approvedSubjectTitles.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.subject_name ? `(${t.subject_name})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chapter (optional)</label>
                <select
                  value={chapterId}
                  onChange={(e) => setChapterId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">All chapters</option>
                  {chapters.map((ch) => (
                    <option key={ch.chapter_id} value={ch.chapter_id}>
                      {ch.chapter_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Standard</label>
                <select
                  value={standard}
                  onChange={(e) => setStandard(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Any</option>
                  {standards.map((s) => (
                    <option key={s.standard_id ?? s.id} value={s.standard ?? s.standard_id ?? s.id}>
                      {s.standard_name ?? `Standard ${s.standard ?? s.standard_id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
                <select
                  value={boardId}
                  onChange={(e) => setBoardId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Any</option>
                  {boards.map((b) => (
                    <option key={b.board_id ?? b.id} value={b.board_id ?? b.id}>
                      {b.board_name ?? b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of MCQs to suggest</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value) || 10)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          )}
          <button
            onClick={handleSuggest}
            disabled={suggestLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium disabled:opacity-50"
          >
            {suggestLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {suggestLoading ? "Loading..." : "Suggest MCQs"}
          </button>
        </div>

        {/* Question picker */}
        {suggestedQuestions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Select questions (do not show answer to students)</h2>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-sm text-amber-600 hover:underline">
                  Select all
                </button>
                <button onClick={clearSelection} className="text-sm text-gray-600 hover:underline">
                  Clear
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">Selected: {selectedIds.size}</p>
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {suggestedQuestions.map((q) => {
                const opts = getOptions(q);
                const id = q.question_id ?? q.id;
                const checked = selectedIds.has(id);
                return (
                  <li
                    key={id}
                    className={`border rounded-lg p-4 cursor-pointer ${checked ? "border-amber-500 bg-amber-50" : "border-gray-200"}`}
                    onClick={() => toggleQuestion(id)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${checked ? "bg-amber-500 border-amber-500" : "border-gray-400"}`}
                        >
                          {checked && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800">{q.question || "—"}</p>
                        {opts.length > 0 && (
                          <ul className="mt-2 text-sm text-gray-600 space-y-1">
                            {opts.slice(0, 10).map((o, i) => (
                              <li key={i}>
                                {String.fromCharCode(65 + i)}. {typeof o === "object" ? (o.option ?? o.text ?? "") : o}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex gap-2">
              <label className="block text-sm font-medium text-gray-700">Quiz title</label>
              <input
                type="text"
                value={paperTitle}
                onChange={(e) => setPaperTitle(e.target.value)}
                placeholder="e.g. Unit 1 MCQ Test"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timing (optional)</label>
                <input
                  type="text"
                  value={timing}
                  onChange={(e) => setTiming(e.target.value)}
                  placeholder="e.g. 45 min"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={handleSave}
                disabled={saveLoading || selectedIds.size === 0}
                className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
              >
                {saveLoading ? <Loader className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                {saveLoading ? "Saving..." : "Save Quiz"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateQuiz;
