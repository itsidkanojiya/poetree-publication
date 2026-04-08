import { useState, useEffect, useRef } from "react";
import { BookOpen, ChevronLeft } from "lucide-react";
import { useUserTeaching } from "../../context/UserTeachingContext";
import {
  getAllSubjects,
  getAllSubjectTitles,
  getAllBoards,
  getAllStandards,
  getSubjectTitlesBySubjectAndContext,
} from "../../services/adminService";

/**
 * Step 2 of Smart paper wizard: subject, standard, board, subject title (approved selections only).
 */
export default function SmartPaperWizardSubjectForm({
  paperHeader,
  setPaperHeader,
  onBack,
  onContinue,
}) {
  const { approvedSelections, setContextSelection, contextSelection } = useUserTeaching();
  const seededRef = useRef(false);
  const { subjects, subject_titles } = approvedSelections;

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
          setAllSubjectTitles(
            Array.isArray(titlesRes) ? titlesRes : titlesRes?.subject_titles ?? titlesRes?.data ?? []
          );
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
    return () => {
      cancelled = true;
    };
  }, [subjects.length, subject_titles.length]);

  const subjectOptions = subjects.map((s) => {
    const id = s.subject_id ?? s.subject?.subject_id ?? s.id;
    const fromList = allSubjects.find(
      (x) => (x.subject_id ?? x.id) === id || String(x.subject_id ?? x.id) === String(id)
    );
    const name =
      s.subject_name ??
      s.subject?.name ??
      s.name ??
      fromList?.subject_name ??
      fromList?.name ??
      `Subject (ID: ${id})`;
    return { id, name };
  });

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
    return () => {
      cancelled = true;
    };
  }, [subjectId, standard, boardId]);

  // One-time seed: prefer saved paper header (e.g. user went back from step 3), else teaching context
  useEffect(() => {
    if (seededRef.current || subjectOptions.length === 0) return;
    const h = paperHeader;
    if (
      h?.subjectTitle != null &&
      h?.subjectTitle !== "" &&
      h?.board != null &&
      h?.board !== "" &&
      h?.standard != null &&
      h?.standard !== ""
    ) {
      seededRef.current = true;
      setBoardId(String(h.board));
      setStandard(String(h.standard));
      setSubjectTitleId(String(h.subjectTitle));
      const match = subjectOptions.find((o) => o.name === h.subject);
      if (match) setSubjectId(String(match.id));
      return;
    }
    const cs = contextSelection;
    if (
      cs &&
      cs.subject_id != null &&
      cs.board_id != null &&
      cs.standard != null &&
      cs.subject_title_id != null
    ) {
      seededRef.current = true;
      setSubjectId(String(cs.subject_id));
      setBoardId(String(cs.board_id));
      setStandard(String(cs.standard));
      setSubjectTitleId(String(cs.subject_title_id));
    }
  }, [subjectOptions.length, paperHeader, contextSelection]);

  const effectiveSubjectId = subjectId || subjectOptions[0]?.id;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!effectiveSubjectId || !subjectTitleId || standard === "" || !boardId) {
      setSubmitError("Please select Subject, Standard, Board, and Subject Title.");
      return;
    }
    const sub = subjectOptions.find((o) => String(o.id) === String(effectiveSubjectId));
    const tit = contextSubjectTitles.find((t) => String(t.subject_title_id ?? t.id) === String(subjectTitleId));
    const board = boards.find((b) => String(b.board_id ?? b.id) === String(boardId));
    const std = standards.find((s) => String(s.standard_id) === String(standard));
    const titleName = tit?.title_name ?? tit?.subject_title_name ?? tit?.name ?? "";

    const classLabel = std?.name ?? (standard ? `Standard ${standard}` : "");

    setPaperHeader((prev) => ({
      ...prev,
      subject: sub?.name ?? "",
      board: boardId,
      subjectTitle: subjectTitleId,
      standard: standard === "" ? "" : Number(standard) || standard,
      class: classLabel,
    }));

    setContextSelection({
      subject_id: Number(effectiveSubjectId) || effectiveSubjectId,
      subject_title_id: Number(subjectTitleId) || subjectTitleId,
      standard: standard === "" ? null : Number(standard) || standard,
      board_id: Number(boardId) || boardId,
      subject_name: sub?.name ?? "",
      subject_title_name: titleName,
      standard_name: std?.name ?? "",
      board_name: board?.board_name ?? board?.name ?? "",
    });

    onContinue();
  };

  if (subjectOptions.length === 0 && subject_titles.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <BookOpen className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <p className="font-semibold text-amber-900">No approved subjects</p>
        <p className="text-sm text-amber-800 mt-1 mb-4">Request subjects from your admin first.</p>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-indigo-600 hover:underline"
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Subject <span className="text-red-500">*</span>
        </label>
        <select
          value={subjectId}
          onChange={(e) => {
            setSubjectId(e.target.value);
            setSubjectTitleId("");
          }}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Standard <span className="text-red-500">*</span>
        </label>
        <select
          value={standard}
          onChange={(e) => {
            setStandard(e.target.value);
            setSubjectTitleId("");
          }}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Board <span className="text-red-500">*</span>
        </label>
        <select
          value={boardId}
          onChange={(e) => {
            setBoardId(e.target.value);
            setSubjectTitleId("");
          }}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Subject title <span className="text-red-500">*</span>
        </label>
        <select
          value={subjectTitleId}
          onChange={(e) => setSubjectTitleId(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white disabled:bg-gray-100"
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

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-50"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <button
          type="submit"
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg"
        >
          Continue to smart settings
        </button>
      </div>
    </form>
  );
}
