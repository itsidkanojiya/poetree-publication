import { IoCloseOutline } from "react-icons/io5";

/**
 * PDF modal: tries to show the document in-page (iframe).
 * If the server blocks embedding (X-Frame-Options), the iframe stays blank.
 * We always show a fallback "Open in new tab" so the user is never stuck.
 */
export default function PDFModal({ isOpen, onClose, pdfUrl, title }) {
  if (!pdfUrl) return null;

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
        {/* Iframe may render blank if server sends X-Frame-Options blocking embedding */}
        <iframe
          key={pdfUrl}
          src={pdfUrl}
          title={title}
          className="w-full flex-1 min-h-0 border-0"
        />
        {/* Fallback: always visible so user is never stuck with a blank modal */}
        <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            If the document doesn’t appear above, the server may be blocking in-page viewing.
          </p>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Open in new tab
          </a>
        </div>
      </div>
    </div>
  );
}
