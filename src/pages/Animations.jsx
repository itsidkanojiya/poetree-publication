import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Film, X } from "lucide-react";
import { getAnimations } from "../services/adminService";
import Loader from "../components/Common/loader/loader";
import { useUserTeaching } from "../context/UserTeachingContext";

// YouTube thumbnail: maxresdefault (HD), fallback hqdefault
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
  const { contextSelection } = useUserTeaching();
  const [animations, setAnimations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterSubjectTitleId, setFilterSubjectTitleId] = useState("");
  const [filterBoardId, setFilterBoardId] = useState("");
  const [filterStandardId, setFilterStandardId] = useState("");

  useEffect(() => {
    let cancelled = false;
    getAnimations()
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
  }, []);

  const videoId = selected?.video_id || (selected?.youtube_url && selected.youtube_url.match(/(?:v=|\/)([\w-]{11})(?:\?|&|$)/)?.[1]);
  const embedUrl = selected?.embed_url || (videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null);

  const filtered = animations.filter((a) => {
    // Apply chosen teaching context first (subject, subject title, standard, board)
    if (contextSelection) {
      if (contextSelection.subject_id != null && String(a.subject_id ?? a.subject?.subject_id) !== String(contextSelection.subject_id)) return false;
      if (contextSelection.subject_title_id != null && String(a.subject_title_id ?? a.subject_title?.subject_title_id) !== String(contextSelection.subject_title_id)) return false;
      if (contextSelection.board_id != null && String(a.board_id ?? a.board?.board_id) !== String(contextSelection.board_id)) return false;
      if (contextSelection.standard != null && String(a.standard_id ?? a.standard?.standard_id ?? a.standard) !== String(contextSelection.standard)) return false;
    }
    // Then apply manual filter dropdowns if any
    if (filterSubjectId && String(a.subject_id ?? a.subject?.subject_id) !== filterSubjectId) return false;
    if (filterSubjectTitleId && String(a.subject_title_id ?? a.subject_title?.subject_title_id) !== filterSubjectTitleId) return false;
    if (filterBoardId && String(a.board_id ?? a.board?.board_id) !== filterBoardId) return false;
    if (filterStandardId && String(a.standard_id ?? a.standard?.standard_id) !== filterStandardId) return false;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group mb-6"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl shadow-lg">
            <Film size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
              Animations
            </h1>
            <p className="text-gray-600 mt-1">Watch videos right here. Click a card to play on a bigger screen.</p>
          </div>
        </div>

        {!loading && animations.length > 0 && (uniqueSubjects.length > 1 || uniqueTitles.length > 1 || uniqueBoards.length > 1 || uniqueStandards.length > 1) && (
          <div className="flex flex-wrap gap-3 mb-6">
            <select
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none text-sm"
            >
              <option value="">All subjects</option>
              {uniqueSubjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={filterSubjectTitleId}
              onChange={(e) => setFilterSubjectTitleId(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none text-sm"
            >
              <option value="">All subject titles</option>
              {uniqueTitles.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <select
              value={filterBoardId}
              onChange={(e) => setFilterBoardId(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none text-sm"
            >
              <option value="">All boards</option>
              {uniqueBoards.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <select
              value={filterStandardId}
              onChange={(e) => setFilterStandardId(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none text-sm"
            >
              <option value="">All standards</option>
              {uniqueStandards.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-12 text-center border border-purple-100">
            <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">{animations.length === 0 ? "No animations yet. Check back later." : "No animations match the selected filters."}</p>
          </div>
        ) : (
          <>
            {/* Grid: responsive, larger on big screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((item) => {
                const vid = item.video_id || (item.youtube_url && item.youtube_url.match(/(?:v=|\/)([\w-]{11})(?:\?|&|$)/)?.[1]);
                const thumb = vid ? getThumbnailUrl(vid) : null;
                const thumbFb = vid ? getThumbnailFallbackUrl(vid) : null;
                return (
                  <button
                    key={item.animation_id}
                    type="button"
                    onClick={() => setSelected(item)}
                    className="group text-left bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:border-purple-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    <div className="relative aspect-video bg-gray-900">
                      {thumb ? (
                        <>
                          <img
                            src={thumb}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              if (thumbFb && e.target.src !== thumbFb) e.target.src = thumbFb;
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Play className="w-7 h-7 text-purple-600 ml-1" fill="currentColor" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                          <Play className="w-12 h-12 text-white/70" fill="currentColor" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-purple-700 transition-colors">
                        {item.title || "Video"}
                      </h3>
                      {(item.subject?.subject_name || item.standard?.name) && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {[item.subject?.subject_name, item.standard?.name].filter(Boolean).join(" • ")}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Modal: big screen embed */}
            {selected && embedUrl && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => setSelected(null)}
                role="dialog"
                aria-modal="true"
                aria-label="Video player"
              >
                <div
                  className="relative w-full max-w-6xl 2xl:max-w-7xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
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
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white font-medium">
                      {selected.title}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Animations;
