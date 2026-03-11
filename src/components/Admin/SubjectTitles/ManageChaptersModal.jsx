import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { getChaptersBySubjectTitle, createChapter, deleteChapter } from "../../../services/adminService";

const ManageChaptersModal = ({ subjectTitleId, titleName, onClose }) => {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newChapterName, setNewChapterName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

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
      });
      const created = res?.chapter || res;
      if (created?.chapter_id) {
        setChapters((prev) => [
          ...prev,
          {
            chapter_id: created.chapter_id,
            chapter_name: created.chapter_name,
            subject_title_id: created.subject_title_id,
          },
        ]);
        setNewChapterName("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create chapter");
    } finally {
      setCreating(false);
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
          {/* Add chapter form */}
          <form onSubmit={handleCreate} className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Add new chapter
            </label>
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
                {chapters.map((ch, index) => {
                  const isDeleting = deletingId === ch.chapter_id;
                  return (
                    <li
                      key={ch.chapter_id}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-gray-800"
                    >
                      <span className="font-medium">
                        <span className="text-gray-500 font-normal mr-2">{index + 1}.</span>
                        {ch.chapter_name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(ch)}
                        disabled={!!deletingId}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        title="Delete chapter"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
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
