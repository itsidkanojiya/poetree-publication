import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Film, X, Filter, Sparkles, BookOpen, GraduationCap } from "lucide-react";
import { getAnimations } from "../services/adminService";
import Loader from "../components/Common/loader/loader";
import { useUserTeaching } from "../context/UserTeachingContext";

const getThumbnailUrl = (videoId) => {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};
const getThumbnailFallbackUrl = (videoId) => {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

const Animations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { contextSelection } = useUserTeaching();
  const isPublicRoute = location.pathname === "/animations";
  const [animations, setAnimations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterSubjectTitleId, setFilterSubjectTitleId] = useState("");
  const [filterChapterId, setFilterChapterId] = useState("");
  const [filterBoardId, setFilterBoardId] = useState("");
  const [filterStandardId, setFilterStandardId] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = filterChapterId ? { chapter_id: filterChapterId } : {};
    getAnimations(params)
      .then((list) => {
        if (!cancelled) setAnimations(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setAnimations([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [filterChapterId]);

  const videoId = selected?.video_id || (selected?.youtube_url && selected.youtube_url.match(/(?:v=|\/)([\w-]{11})(?:\?|&|$)/)?.[1]);
  const embedUrl = selected?.embed_url || (videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null);

  const filtered = animations.filter((a) => {
    if (contextSelection) {
      if (contextSelection.subject_id != null && String(a.subject_id ?? a.subject?.subject_id) !== String(contextSelection.subject_id)) return false;
      if (contextSelection.subject_title_id != null && String(a.subject_title_id ?? a.subject_title?.subject_title_id) !== String(contextSelection.subject_title_id)) return false;
      if (contextSelection.board_id != null && String(a.board_id ?? a.board?.board_id) !== String(contextSelection.board_id)) return false;
      if (contextSelection.standard != null && String(a.standard_id ?? a.standard?.standard_id ?? a.standard) !== String(contextSelection.standard)) return false;
    }
    if (filterSubjectId && String(a.subject_id ?? a.subject?.subject_id) !== filterSubjectId) return false;
    if (filterSubjectTitleId && String(a.subject_title_id ?? a.subject_title?.subject_title_id) !== filterSubjectTitleId) return false;
    if (filterChapterId && String(a.chapter_id ?? a.chapter?.chapter_id) !== String(filterChapterId)) return false;
    if (filterBoardId && String(a.board_id ?? a.board?.board_id) !== filterBoardId) return false;
    if (filterStandardId && String(a.standard_id ?? a.standard?.standard_id ?? a.standard) !== filterStandardId) return false;
    return true;
  });

  const uniqueSubjects = [...new Map(animations.filter((a) => a.subject_id ?? a.subject?.subject_id).map((a) => {
    const id = a.subject_id ?? a.subject?.subject_id;
    return [String(id), { id: String(id), name: a.subject?.subject_name || "—" }];
  })).values()];
  const uniqueTitles = [...new Map(animations.filter((a) => a.subject_title_id ?? a.subject_title?.subject_title_id).map((a) => {
    const id = a.subject_title_id ?? a.subject_title?.subject_title_id;
    return [String(id), { id: String(id), name: a.subject_title?.title_name || "—" }];
  })).values()];
  const uniqueBoards = [...new Map(animations.filter((a) => a.board_id ?? a.board?.board_id).map((a) => {
    const id = a.board_id ?? a.board?.board_id;
    return [String(id), { id: String(id), name: a.board?.board_name || "—" }];
  })).values()];
  const uniqueStandards = [...new Map(animations.filter((a) => a.standard_id ?? a.standard?.standard_id).map((a) => {
    const id = a.standard_id ?? a.standard?.standard_id;
    return [String(id), { id: String(id), name: a.standard?.name || "—" }];
  })).values()];
  const uniqueChapters = [...new Map(animations.filter((a) => a.chapter_id ?? a.chapter?.chapter_id).map((a) => {
    const id = a.chapter_id ?? a.chapter?.chapter_id;
    return [String(id), { id: String(id), name: a.chapter?.chapter_name || "—" }];
  })).values()];

  const hasActiveFilters = filterSubjectId || filterSubjectTitleId || filterChapterId || filterBoardId || filterStandardId;
  const clearFilters = () => {
    setFilterSubjectId("");
    setFilterSubjectTitleId("");
    setFilterChapterId("");
    setFilterBoardId("");
    setFilterStandardId("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-violet-50/30 to-fuchsia-50/40">
      {/* Hero section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 px-6 pt-8 pb-12 md:pb-16">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-400/30 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <button
            onClick={() => navigate(isPublicRoute ? "/" : "/dashboard")}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors group mb-8"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">{isPublicRoute ? "Back to Home" : "Back to Dashboard"}</span>
          </button>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row md:items-center gap-6"
          >
            <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-xl border border-white/20">
              <Film size={40} className="text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white/95 text-sm font-medium mb-3">
                <Sparkles className="w-4 h-4" />
                For Students & Teachers
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                Learning Animations
              </h1>
              <p className="mt-2 text-lg text-white/90 max-w-xl">
                Watch fun videos and animations by subject, board & standard. Click any video to play full screen—no login required.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-white/80 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> By subject
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" /> By standard
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-20 pb-16">
        {/* Filter bar - card style */}
        {!loading && animations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-xl shadow-violet-500/10 border border-violet-100/80 p-5 mb-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <div className="p-1.5 rounded-lg bg-violet-100">
                  <Filter className="w-4 h-4 text-violet-600" />
                </div>
                Filter videos
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-violet-600 hover:text-violet-800 hover:bg-violet-50 px-3 py-1.5 rounded-lg transition"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={filterSubjectId}
                onChange={(e) => setFilterSubjectId(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none transition min-w-[160px]"
              >
                <option value="">All subjects</option>
                {uniqueSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <select
                value={filterSubjectTitleId}
                onChange={(e) => setFilterSubjectTitleId(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none transition min-w-[180px]"
              >
                <option value="">All subject titles</option>
                {uniqueTitles.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <select
                value={filterChapterId}
                onChange={(e) => setFilterChapterId(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none transition min-w-[160px]"
              >
                <option value="">All chapters</option>
                {uniqueChapters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={filterBoardId}
                onChange={(e) => setFilterBoardId(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none transition min-w-[140px]"
              >
                <option value="">All boards</option>
                {uniqueBoards.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <select
                value={filterStandardId}
                onChange={(e) => setFilterStandardId(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none transition min-w-[140px]"
              >
                <option value="">All standards</option>
                {uniqueStandards.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl border border-violet-100 p-12 md:p-16 text-center"
          >
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center mx-auto mb-6">
              <Film className="w-12 h-12 text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No videos yet</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              {animations.length === 0
                ? "Animations will show up here soon. Check back later or try from your dashboard."
                : "No animations match your filters. Try changing or clearing filters."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 px-6 py-3 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600 transition"
              >
                Clear filters
              </button>
            )}
          </motion.div>
        ) : (
          <>
            <p className="text-slate-600 mb-6">
              <span className="font-semibold text-slate-800">{filtered.length}</span> video{filtered.length !== 1 ? "s" : ""} to watch
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((item, index) => {
                const vid = item.video_id || (item.youtube_url && item.youtube_url.match(/(?:v=|\/)([\w-]{11})(?:\?|&|$)/)?.[1]);
                const thumb = vid ? getThumbnailUrl(vid) : null;
                const thumbFb = vid ? getThumbnailFallbackUrl(vid) : null;
                const meta = [item.subject?.subject_name, item.chapter?.chapter_name, item.standard?.name].filter(Boolean);
                return (
                  <motion.button
                    key={item.animation_id}
                    type="button"
                    onClick={() => setSelected(item)}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.05 }}
                    className="group text-left rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-violet-500/15 hover:border-violet-200 hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
                  >
                    <div className="relative aspect-video bg-slate-900">
                      {thumb ? (
                        <>
                          <img
                            src={thumb}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              if (thumbFb && e.target.src !== thumbFb) e.target.src = thumbFb;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-white/95 shadow-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white transition-all duration-300 ring-4 ring-white/30">
                              <Play className="w-7 h-7 text-violet-600 ml-1" fill="currentColor" />
                            </div>
                          </div>
                          {meta.length > 0 && (
                            <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5">
                              {meta.slice(0, 2).map((m) => (
                                <span
                                  key={m}
                                  className="px-2 py-0.5 rounded-md bg-black/50 text-white/95 text-xs font-medium backdrop-blur"
                                >
                                  {m}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-900 to-fuchsia-900">
                          <Play className="w-14 h-14 text-white/80" fill="currentColor" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-800 line-clamp-2 group-hover:text-violet-700 transition-colors text-base">
                        {item.title || "Video"}
                      </h3>
                      {meta.length > 0 && (
                        <p className="text-sm text-slate-500 mt-1.5 truncate">
                          {meta.join(" • ")}
                        </p>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {selected && embedUrl && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                  onClick={() => setSelected(null)}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Video player"
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="absolute top-4 right-4 z-10 p-2.5 rounded-xl bg-black/70 hover:bg-black/90 text-white transition backdrop-blur"
                      aria-label="Close"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <iframe
                      src={embedUrl}
                      title={selected.title || "Video"}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    {selected.title && (
                      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 to-transparent text-white">
                        <p className="font-semibold text-lg">{selected.title}</p>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};

export default Animations;
