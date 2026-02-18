import { useState, useEffect } from "react";
import { BookOpen, CheckCircle } from "lucide-react";
import Loader from "../Common/loader/loader";
import { useUserTeaching } from "../../context/UserTeachingContext";
import { getAllSubjects, getAllSubjectTitles, getAllBoards, getAllStandards, getSubjectTitlesBySubjectAndContext } from "../../services/adminService";

const ChooseContext = () => {
  const { approvedSelections, setContextSelection, loading } = useUserTeaching();
  const [subjectId, setSubjectId] = useState("");
  const [subjectTitleId, setSubjectTitleId] = useState("");
  const [standard, setStandard] = useState("");
  const [boardId, setBoardId] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [allSubjects, setAllSubjects] = useState([]);
  const [allSubjectTitles, setAllSubjectTitles] = useState([]);
  const [boards, setBoards] = useState([]);
  const [standards, setStandards] = useState([]);
  const [contextSubjectTitles, setContextSubjectTitles] = useState([]);

  const { subjects, subject_titles } = approvedSelections;

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const [subsRes, titlesRes, boardsRes, standardsRes] = await Promise.all([
          getAllSubjects(),
          getAllSubjectTitles(),
          getAllBoards(),
          getAllStandards(),
        ]);
        if (!cancelled) {
          setAllSubjects(Array.isArray(subsRes) ? subsRes : subsRes?.subjects ?? []);
          setAllSubjectTitles(Array.isArray(titlesRes) ? titlesRes : titlesRes?.subject_titles ?? titlesRes?.data ?? []);
          setBoards(Array.isArray(boardsRes) ? boardsRes : boardsRes?.boards ?? boardsRes?.data ?? []);
          const stdList = Array.isArray(standardsRes) ? standardsRes : [];
          setStandards(stdList.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
        }
      } catch {
        if (!cancelled) {
          setAllSubjects([]);
          setAllSubjectTitles([]);
          setBoards([]);
          setStandards([]);
        }
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [subjects.length, subject_titles.length]);

  const subjectOptions = subjects.map((s) => {
    const id = s.subject_id ?? s.subject?.subject_id ?? s.id;
    const fromList = allSubjects.find(
      (x) => (x.subject_id ?? x.id) === id || String(x.subject_id ?? x.id) === String(id)
    );
    const name =
      s.subject_name ?? s.subject?.name ?? s.name
      ?? fromList?.subject_name ?? fromList?.name
      ?? `Subject (ID: ${id})`;
    return { id, name };
  });

  const titleOptions = subject_titles.map((t) => {
    const id = t.subject_title_id ?? t.id;
    const fromList = allSubjectTitles.find(
      (x) => (x.subject_title_id ?? x.id) === id || String(x.subject_title_id ?? x.id) === String(id)
    );
    const name =
      t.subject_title_name ?? t.title_name ?? t.name ?? t.subject_title?.name
      ?? fromList?.subject_title_name ?? fromList?.title_name ?? fromList?.name ?? fromList?.title
      ?? `Subject title (ID: ${id})`;
    const subjectIdForTitle = t.subject_id ?? t.subject?.subject_id ?? fromList?.subject_id;
    const subjectName =
      t.subject_name ?? t.subject?.subject_name ?? t.subject?.name
      ?? allSubjects.find((x) => String(x.subject_id ?? x.id) === String(subjectIdForTitle))?.subject_name
      ?? allSubjects.find((x) => String(x.subject_id ?? x.id) === String(subjectIdForTitle))?.name
      ?? fromList?.subject_name ?? "";
    return { id, name, subjectName };
  });

  // Fetch subject titles when Subject, Standard, and Board are set (same flow as elsewhere)
  useEffect(() => {
    if (!subjectId || !standard || !boardId) {
      setContextSubjectTitles([]);
      return;
    }
    let cancelled = false;
    getSubjectTitlesBySubjectAndContext(subjectId, { board_id: boardId, standard })
      .then((list) => {
        if (!cancelled) setContextSubjectTitles(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setContextSubjectTitles([]);
      });
    return () => { cancelled = true; };
  }, [subjectId, standard, boardId]);

  const effectiveSubjectId = subjectId || subjectOptions[0]?.id;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!effectiveSubjectId || !subjectTitleId || standard === "" || !boardId) {
      setSubmitError("Please select Subject, Standard, Board, and Subject Title.");
      return;
    }
    const sub = subjectOptions.find((o) => String(o.id) === String(effectiveSubjectId));
    const tit = contextSubjectTitles.find((t) => String(t.subject_title_id ?? t.id) === String(subjectTitleId))
      || titleOptions.find((o) => String(o.id) === String(subjectTitleId));
    const board = boards.find((b) => String(b.board_id ?? b.id) === String(boardId));
    const std = standards.find((s) => String(s.standard_id) === String(standard));
    setContextSelection({
      subject_id: Number(effectiveSubjectId) || effectiveSubjectId,
      subject_title_id: Number(subjectTitleId) || subjectTitleId,
      standard: standard === "" ? null : Number(standard) || standard,
      board_id: Number(boardId) || boardId,
      subject_name: sub?.name ?? "",
      subject_title_name: tit?.title_name ?? tit?.subject_title_name ?? tit?.name ?? "",
      standard_name: std?.name ?? "",
      board_name: board?.board_name ?? board?.name ?? "",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-8">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
          <p className="text-gray-600">Loading your approved options...</p>
        </div>
      </div>
    );
  }

  if (subjectOptions.length === 0 && subject_titles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg text-center border border-amber-200">
          <BookOpen className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">No Approved Subjects Yet</h1>
          <p className="text-gray-600 mb-6">
            Request subjects and subject titles from your admin. Once approved, you can choose your teaching context here.
          </p>
          <a
            href="/dashboard/subject-requests"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
          >
            Go to Subject Requests
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Choose Your Teaching Context</h1>
            <p className="text-gray-600 text-sm">Select subject, standard, board, then subject title. This will filter your dashboard.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject <span className="text-red-500">*</span></label>
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setSubjectTitleId("");
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            >
              <option value="">Select subject</option>
              {subjectOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Standard <span className="text-red-500">*</span></label>
            <select
              value={standard}
              onChange={(e) => {
                setStandard(e.target.value);
                setSubjectTitleId("");
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            >
              <option value="">Select standard</option>
              {standards.map((s) => (
                <option key={s.standard_id} value={s.standard_id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Board <span className="text-red-500">*</span></label>
            <select
              value={boardId}
              onChange={(e) => {
                setBoardId(e.target.value);
                setSubjectTitleId("");
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            >
              <option value="">Select board</option>
              {boards.map((b) => {
                const id = b.board_id ?? b.id;
                const name = b.board_name ?? b.name ?? `Board ${id}`;
                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject Title <span className="text-red-500">*</span></label>
            <select
              value={subjectTitleId}
              onChange={(e) => setSubjectTitleId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100"
              required
              disabled={!subjectId || !standard || !boardId}
            >
              <option value="">
                {subjectId && standard && boardId ? "Select subject title" : "Select subject, standard and board first"}
              </option>
              {contextSubjectTitles.map((t) => {
                const id = t.subject_title_id ?? t.id;
                const name = t.title_name ?? t.subject_title_name ?? t.name ?? `Title ${id}`;
                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          {submitError && (
            <p className="text-sm text-red-600">{submitError}</p>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            <CheckCircle className="w-5 h-5" />
            Save & continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChooseContext;
