import { useEffect, useRef, useState } from "react";
import { Sigma, X } from "lucide-react";

/**
 * A small "Insert formula" button that opens a MathLive visual equation editor.
 * The admin builds a formula visually (no LaTeX typing); on Insert it returns
 * the LaTeX via onInsert(latex). MathLive is loaded lazily so it does not bloat
 * bundles that never use it.
 */
const MathFieldPopover = ({ onInsert, initialLatex = "", buttonClassName = "" }) => {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const mfRef = useRef(null);

  // Lazy-load MathLive when the editor is first opened
  useEffect(() => {
    if (!open || ready) return;
    let cancelled = false;
    import("mathlive")
      .then((ml) => {
        try {
          if (ml.MathfieldElement) {
            // Disable click sounds (avoids fetching sound assets)
            ml.MathfieldElement.soundsDirectory = null;
          }
        } catch {
          /* noop */
        }
        if (!cancelled) setReady(true);
      })
      .catch((e) => console.error("Failed to load math editor:", e));
    return () => {
      cancelled = true;
    };
  }, [open, ready]);

  // Seed value + focus once the editor is mounted
  useEffect(() => {
    if (open && ready && mfRef.current) {
      try {
        mfRef.current.value = initialLatex || "";
      } catch {
        /* noop */
      }
      const t = setTimeout(() => {
        try {
          mfRef.current?.focus?.();
        } catch {
          /* noop */
        }
      }, 60);
      return () => clearTimeout(t);
    }
  }, [open, ready, initialLatex]);

  const handleInsert = () => {
    const el = mfRef.current;
    let latex = "";
    try {
      latex = el?.getValue ? el.getValue("latex") : el?.value || "";
    } catch {
      latex = el?.value || "";
    }
    if (latex && latex.trim()) onInsert(latex.trim());
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Insert formula"
        className={
          buttonClassName ||
          "shrink-0 inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition text-sm"
        }
      >
        <Sigma className="w-4 h-4" />
        <span className="hidden sm:inline">fx</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-bold text-gray-800">Insert formula</h4>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Build your formula below (use the on-screen keyboard for symbols), then Insert.
            </p>
            {ready ? (
              <math-field
                ref={mfRef}
                style={{
                  display: "block",
                  width: "100%",
                  minHeight: "56px",
                  fontSize: "20px",
                  padding: "10px 12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "10px",
                }}
              />
            ) : (
              <div className="h-16 flex items-center justify-center text-gray-500 text-sm border-2 border-gray-200 rounded-lg">
                Loading editor…
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsert}
                disabled={!ready}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition font-medium disabled:opacity-50"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MathFieldPopover;
