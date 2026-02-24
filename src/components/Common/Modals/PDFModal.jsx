import { IoCloseOutline } from "react-icons/io5";
import { useState } from "react";

/**
 * PDF modal that shows the document inside the website using an iframe.
 * Keeps the user on-site (no new tab), avoids CORS issues from fetch-based viewers,
 * and avoids exposing the PDF URL in the address bar.
 */
export default function PDFModal({ isOpen, onClose, pdfUrl, title }) {
  const [iframeError, setIframeError] = useState(false);

  const handleIframeLoad = () => {
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
  };

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
        {iframeError ? (
          <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
            <p className="text-red-600 font-medium mb-2">Could not load PDF here.</p>
            <p className="text-gray-600 text-sm mb-4">
              The document may be blocked from embedding. You can open it in a new tab.
            </p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:no-underline"
            >
              Open in new tab
            </a>
          </div>
        ) : (
          <iframe
            key={pdfUrl}
            src={pdfUrl}
            title={title}
            className="w-full flex-1 min-h-0 border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}
      </div>
    </div>
  );
}
