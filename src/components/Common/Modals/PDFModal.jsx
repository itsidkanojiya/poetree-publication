import { useState } from "react";
import { IoCloseOutline } from "react-icons/io5";
import { Download } from "lucide-react";

/**
 * PDF modal: tries to show the document in-page (iframe).
 * If the server blocks embedding (X-Frame-Options), the iframe stays blank.
 * We always show a fallback "Open in new tab" so the user is never stuck.
 *
 * Optional: worksheetId + onDownload for personalized PDF download (school logo/name).
 * Optional: loading + errorMessage for personalized fetch state.
 */
export default function PDFModal({
  isOpen,
  onClose,
  pdfUrl,
  title,
  loading = false,
  errorMessage = null,
  worksheetId = null,
  onDownload = null,
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (worksheetId == null || typeof onDownload !== "function") return;
    setDownloading(true);
    try {
      await onDownload(worksheetId);
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center bg-gray-800 p-4 shrink-0">
        <h1 className="text-base pe-8 text-white font-semibold tracking-wide truncate">
          {title}
        </h1>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-white hover:bg-white/10 rounded-lg p-1 transition-colors"
        >
          <IoCloseOutline className="text-3xl" />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col bg-gray-100">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p className="text-sm">Loading your personalized worksheet…</p>
          </div>
        ) : pdfUrl ? (
          <>
            {errorMessage && (
              <div className="shrink-0 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
                {errorMessage}
              </div>
            )}
            <iframe
              key={pdfUrl}
              src={pdfUrl}
              title={title}
              className="w-full flex-1 min-h-0 border-0"
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p className="text-sm">Unable to load the document.</p>
          </div>
        )}

        {/* Footer: open in new tab + optional download */}
        <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {pdfUrl
              ? "If the document doesn't appear above, the server may be blocking in-page viewing."
              : "Use the buttons below to open or download."}
          </p>
          <div className="flex items-center gap-2">
            {worksheetId != null && typeof onDownload === "function" && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={loading || downloading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {downloading ? "Downloading…" : "Download PDF"}
              </button>
            )}
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open in new tab
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
