import { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2, Loader2, Pencil, Check, Download, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import {
  getChaptersBySubjectTitle,
  createChapter,
  updateChapter,
  deleteChapter,
  getAllStandards,
} from "../../../services/adminService";

const ManageChaptersModal = ({ subjectTitleId, titleName, subjectId, subjectName, onClose }) => {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newChapterName, setNewChapterName] = useState("");
  const [newChapterNumber, setNewChapterNumber] = useState("");
  const [newChapterStandard, setNewChapterStandard] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editStandard, setEditStandard] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [standards, setStandards] = useState([]);
  // Bulk upload state
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadResult, setUploadResult] = useState(null); // { added, failed, errors: [] }

  useEffect(() => {
    let cancelled = false;
    getAllStandards()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        if (!cancelled) {
          setStandards(list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
        }
      })
      .catch(() => {
        if (!cancelled) setStandards([]);
      });
    return () => { cancelled = true; };
  }, []);

  const getStandardName = (id) => {
    if (id == null || id === "") return "";
    return standards.find((s) => String(s.standard_id) === String(id))?.name ?? `Std ${id}`;
  };

  useEffect(() => {
    if (!subjectTitleId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getChaptersBySubjectTitle(subjectTitleId)
      .then((list) => {
        if (!cancelled) setChapters(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || "Failed to load chapters");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [subjectTitleId]);

  // Sort: numbered chapters first (ascending), then unnumbered by name.
  const sortChapters = (list) =>
    [...list].sort((a, b) => {
      const an = a.chapter_number;
      const bn = b.chapter_number;
      if (an != null && bn != null) return an - bn;
      if (an != null) return -1;
      if (bn != null) return 1;
      return (a.chapter_name || "").localeCompare(b.chapter_name || "");
    });

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newChapterName.trim();
    if (!name || !subjectTitleId) return;
    setCreating(true);
    setError(null);
    try {
      const res = await createChapter({
        chapter_name: name,
        subject_title_id: Number(subjectTitleId),
        chapter_number: newChapterNumber === "" ? null : Number(newChapterNumber),
        standard: newChapterStandard === "" ? null : Number(newChapterStandard),
      });
      const created = res?.chapter || res;
      if (created?.chapter_id) {
        setChapters((prev) =>
          sortChapters([
            ...prev,
            {
              chapter_id: created.chapter_id,
              chapter_name: created.chapter_name,
              chapter_number: created.chapter_number ?? null,
              standard: created.standard ?? null,
              subject_title_id: created.subject_title_id,
            },
          ])
        );
        setNewChapterName("");
        setNewChapterNumber("");
        setNewChapterStandard("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create chapter");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (ch) => {
    setEditingId(ch.chapter_id);
    setEditName(ch.chapter_name || "");
    setEditNumber(ch.chapter_number != null ? String(ch.chapter_number) : "");
    setEditStandard(ch.standard != null ? String(ch.standard) : "");
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditNumber("");
    setEditStandard("");
  };

  const handleEditSave = async () => {
    const name = editName.trim();
    if (!name || editingId == null) return;
    setSavingEdit(true);
    setError(null);
    try {
      const res = await updateChapter(editingId, {
        chapter_name: name,
        chapter_number: editNumber === "" ? null : Number(editNumber),
        standard: editStandard === "" ? null : Number(editStandard),
      });
      const updated = res?.chapter || res;
      setChapters((prev) =>
        sortChapters(
          prev.map((ch) =>
            ch.chapter_id === editingId
              ? {
                  ...ch,
                  chapter_name: updated?.chapter_name ?? name,
                  chapter_number:
                    updated?.chapter_number !== undefined
                      ? updated.chapter_number
                      : editNumber === ""
                      ? null
                      : Number(editNumber),
                  standard:
                    updated?.standard !== undefined
                      ? updated.standard
                      : editStandard === ""
                      ? null
                      : Number(editStandard),
                }
              : ch
          )
        )
      );
      cancelEdit();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update chapter");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteClick = (chapter) => {
    setConfirmDelete({ chapterId: chapter.chapter_id, chapterName: chapter.chapter_name });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete?.chapterId) return;
    const chapterId = confirmDelete.chapterId;
    setConfirmDelete(null);
    setDeletingId(chapterId);
    setError(null);
    try {
      await deleteChapter(chapterId);
      setChapters((prev) => prev.filter((ch) => ch.chapter_id !== chapterId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete chapter");
    } finally {
      setDeletingId(null);
    }
  };

  // ---- Bulk download / upload (Excel) ----
  const EXCEL_HEADERS = [
    "Chapter Number",
    "Chapter Name",
    "Standard ID",
    "Standard",
    "Subject ID",
    "Subject Name",
    "Subject Title",
  ];

  const handleDownloadExcel = () => {
    const rows = chapters.map((ch) => [
      ch.chapter_number ?? "",
      ch.chapter_name ?? "",
      ch.standard ?? "",
      ch.standard != null ? getStandardName(ch.standard) : "",
      subjectId ?? "",
      subjectName ?? "",
      titleName ?? "",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([EXCEL_HEADERS, ...rows]);
    ws["!cols"] = [
      { wch: 15 },
      { wch: 45 },
      { wch: 12 },
      { wch: 18 },
      { wch: 12 },
      { wch: 24 },
      { wch: 30 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chapters");

    // Instructions sheet — this file doubles as the bulk-upload template
    const info = [
      ["CHAPTERS — DOWNLOAD / BULK UPLOAD"],
      [""],
      ["Re-upload this file (the 'Chapters' sheet) to bulk-add chapters to this subject title."],
      [""],
      ["Columns:"],
      ["  Chapter Name", "required — the chapter title"],
      ["  Chapter Number", "optional — non-negative whole number (used for ordering)"],
      ["  Standard ID", "optional — the numeric standard id (preferred)"],
      ["  Standard", "optional — standard name; used only when Standard ID is empty"],
      ["  Subject ID", "informational only — ignored on upload"],
      ["  Subject Name", "informational only — ignored on upload"],
      ["  Subject Title", "informational only — ignored on upload"],
      [""],
      ["Notes:"],
      ["  * Upload ADDS new chapters. Existing chapters are not updated or removed."],
      ["  * Rows with an empty Chapter Name are skipped."],
      ["  * Uploaded chapters always attach to the subject title this file was downloaded from."],
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(info);
    wsInfo["!cols"] = [{ wch: 18 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, "Instructions");

    const safeTitle = String(titleName || `SubjectTitle_${subjectTitleId}`).replace(/[\\/:*?"<>|]/g, "_");
    XLSX.writeFile(wb, `Chapters_${safeTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Resolve a standard id from either the "Standard ID" or the "Standard" name column
  const resolveStandardId = (row) => {
    const rawId = row["Standard ID"];
    if (rawId != null && String(rawId).trim() !== "") {
      const n = parseInt(rawId, 10);
      if (!isNaN(n)) return n;
    }
    const name = row["Standard"];
    if (name != null && String(name).trim() !== "") {
      const match = standards.find(
        (s) => String(s.name).trim().toLowerCase() === String(name).trim().toLowerCase()
      );
      if (match) return Number(match.standard_id);
    }
    return null;
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file || !subjectTitleId) return;

    setError(null);
    setUploadResult(null);
    setUploading(true);
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const wb = XLSX.read(data, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const valid = rows
        .map((r) => ({
          chapter_name: String(r["Chapter Name"] ?? "").trim(),
          chapter_number: r["Chapter Number"],
          standard: resolveStandardId(r),
        }))
        .filter((r) => r.chapter_name);

      if (valid.length === 0) {
        setError("No rows with a 'Chapter Name' were found. Check the column headings.");
        return;
      }

      setUploadProgress({ current: 0, total: valid.length });
      const created = [];
      const errors = [];

      for (let i = 0; i < valid.length; i++) {
        const row = valid[i];
        try {
          const res = await createChapter({
            chapter_name: row.chapter_name,
            subject_title_id: Number(subjectTitleId),
            chapter_number:
              row.chapter_number === "" || row.chapter_number == null ? null : Number(row.chapter_number),
            standard: row.standard,
          });
          const ch = res?.chapter || res;
          if (ch?.chapter_id) {
            created.push({
              chapter_id: ch.chapter_id,
              chapter_name: ch.chapter_name,
              chapter_number: ch.chapter_number ?? null,
              standard: ch.standard ?? null,
              subject_title_id: ch.subject_title_id,
            });
          }
        } catch (err) {
          errors.push(
            `${row.chapter_name}: ${err.response?.data?.error || err.response?.data?.message || "failed"}`
          );
        }
        setUploadProgress({ current: i + 1, total: valid.length });
      }

      if (created.length) setChapters((prev) => sortChapters([...prev, ...created]));
      setUploadResult({ added: created.length, failed: errors.length, errors: errors.slice(0, 5) });
    } catch (err) {
      setError("Could not read the Excel file. Make sure it is a valid .xlsx file.");
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Manage Chapters</h3>
            <p className="text-sm text-gray-600 mt-1">
              {titleName || `Subject Title #${subjectTitleId}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Bulk actions */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition"
              title="Download all chapters of this subject title as Excel"
            >
              <Download className="w-4 h-4" />
              Download Excel
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition disabled:opacity-50"
              title="Bulk add chapters from an Excel file"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? `Uploading ${uploadProgress.current}/${uploadProgress.total}` : "Bulk Upload"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleBulkUpload}
              className="hidden"
            />
          </div>

          {uploadResult && (
            <div className="mb-4 text-sm rounded-lg px-3 py-2 bg-gray-50 border border-gray-200">
              <p className="font-medium text-gray-800">
                Added {uploadResult.added} chapter(s)
                {uploadResult.failed ? `, ${uploadResult.failed} failed` : ""}.
              </p>
              {uploadResult.errors?.length > 0 && (
                <ul className="mt-1 list-disc list-inside text-red-600">
                  {uploadResult.errors.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Add chapter form */}
          <form onSubmit={handleCreate} className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Add new chapter
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                min="0"
                value={newChapterNumber}
                onChange={(e) => setNewChapterNumber(e.target.value)}
                placeholder="No."
                title="Chapter number (optional)"
                className="w-1/2 px-3 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
              <select
                value={newChapterStandard}
                onChange={(e) => setNewChapterStandard(e.target.value)}
                title="Standard (optional)"
                className="w-1/2 px-3 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
              >
                <option value="">Standard</option>
                {standards.map((s) => (
                  <option key={s.standard_id} value={s.standard_id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newChapterName}
                onChange={(e) => setNewChapterName(e.target.value)}
                placeholder="Chapter name (max 200 chars)"
                maxLength={200}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
              <button
                type="submit"
                disabled={!newChapterName.trim() || creating}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                {creating ? "..." : <Plus className="w-5 h-5" />}
                Add
              </button>
            </div>
          </form>

          {error && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Chapters list */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Chapters ({chapters.length})
            </h4>
            {loading ? (
              <p className="text-gray-500 text-sm">Loading chapters...</p>
            ) : chapters.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">
                No chapters yet. Add one above.
              </p>
            ) : (
              <ul className="space-y-2">
                {chapters.map((ch) => {
                  const isDeleting = deletingId === ch.chapter_id;
                  const isEditing = editingId === ch.chapter_id;
                  return (
                    <li
                      key={ch.chapter_id}
                      className="flex items-center justify-between gap-2 py-2 px-3 bg-gray-50 rounded-lg text-gray-800"
                    >
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            min="0"
                            value={editNumber}
                            onChange={(e) => setEditNumber(e.target.value)}
                            placeholder="No."
                            title="Chapter number"
                            className="w-14 px-2 py-1.5 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500"
                          />
                          <select
                            value={editStandard}
                            onChange={(e) => setEditStandard(e.target.value)}
                            title="Standard"
                            className="w-24 px-2 py-1.5 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                          >
                            <option value="">Std</option>
                            {standards.map((s) => (
                              <option key={s.standard_id} value={s.standard_id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            maxLength={200}
                            className="flex-1 px-3 py-1.5 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={handleEditSave}
                            disabled={!editName.trim() || savingEdit}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                            title="Save"
                          >
                            {savingEdit ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={savingEdit}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="font-medium flex-1 truncate">
                            <span className="text-gray-500 font-normal mr-2">
                              {ch.chapter_number != null ? `${ch.chapter_number}.` : "—"}
                            </span>
                            {ch.chapter_name}
                          </span>
                          {ch.standard != null && (
                            <span className="shrink-0 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-0.5">
                              {getStandardName(ch.standard)}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => startEdit(ch)}
                            disabled={!!deletingId || !!editingId}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                            title="Edit chapter"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(ch)}
                            disabled={!!deletingId || !!editingId}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Delete chapter"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>

    {/* Custom delete confirmation modal */}
    {confirmDelete && (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6">
          <h4 className="text-lg font-bold text-gray-800 mb-2">Delete chapter?</h4>
          <p className="text-gray-600 text-sm mb-1">
            &ldquo;{confirmDelete.chapterName}&rdquo; will be removed.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Questions or other data linked to it may become unassigned.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default ManageChaptersModal;
