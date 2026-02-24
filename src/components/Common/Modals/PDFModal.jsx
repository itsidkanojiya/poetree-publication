import { IoCloseOutline } from "react-icons/io5";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import "@react-pdf-viewer/core/lib/styles/index.css";

/**
 * Convert Google Drive "view" URL to direct download URL so the PDF viewer
 * receives raw PDF bytes instead of an HTML page (which causes "Invalid PDF structure").
 */
function getPdfViewerUrl(url) {
  if (!url || typeof url !== "string") return url;
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }
  return url;
}

export default function PDFModal({ isOpen, onClose, pdfUrl, title }) {
  const zoomPluginInstance = zoomPlugin();
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { ZoomInButton, ZoomOutButton } = zoomPluginInstance;
  const { GoToPreviousPage, GoToNextPage, CurrentPageLabel } =
    pageNavigationPluginInstance;

  const viewerUrl = getPdfViewerUrl(pdfUrl);

  const renderError = (error) => {
    const isInvalidPdf = error?.name === "InvalidPDFException";
    const isUnexpectedResponse = error?.name === "UnexpectedResponseException";
    const isMissingPdf = error?.name === "MissingPDFException";
    let hint = error?.message || "The document could not be loaded.";
    if (isInvalidPdf) {
      hint =
        "The server may be returning a web page instead of the PDF (wrong Content-Type or missing file). In production, ensure the backend serves the actual PDF with Content-Type: application/pdf.";
    } else if (isUnexpectedResponse || isMissingPdf) {
      hint =
        "Request failed—could be CORS (backend must allow your frontend origin for this URL), network error, or the file is missing. In production, enable CORS for /uploads and serve the PDF at this URL.";
    }
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-600 font-medium mb-2">
          Could not load PDF in viewer.
        </p>
        <p className="text-gray-600 text-sm mb-4">{hint}</p>
        {pdfUrl && (
          <>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:no-underline"
            >
              Open in new tab
            </a>
            <p className="text-gray-500 text-xs mt-2">
              If the new tab is blank or errors, the server is not serving the
              PDF at this URL.
            </p>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center bg-gray-800 p-4">
        <h1 className="text-base pe-8 text-white font-semibold tracking-wide">
          {title}
        </h1>
        <button onClick={onClose} aria-label="Close Modal">
          <IoCloseOutline className="text-3xl text-white hover:border rounded-xl" />
        </button>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-100">
        <div className="flex gap-2 items-center">
          <ZoomOutButton />
          <ZoomInButton />
        </div>
        <div className="flex items-center gap-2">
          <GoToPreviousPage />
          <CurrentPageLabel />
          <GoToNextPage />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {pdfUrl && (
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer
              key={viewerUrl}
              fileUrl={viewerUrl}
              plugins={[zoomPluginInstance, pageNavigationPluginInstance]}
              renderError={renderError}
            />
          </Worker>
        )}
      </div>
    </div>
  );
}
