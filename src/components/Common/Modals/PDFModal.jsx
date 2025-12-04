
import { IoCloseOutline } from "react-icons/io5";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import "@react-pdf-viewer/core/lib/styles/index.css";


export default function PDFModal({ isOpen, onClose, pdfUrl, title }) {
    const zoomPluginInstance = zoomPlugin();
    const pageNavigationPluginInstance = pageNavigationPlugin();
    const { ZoomInButton, ZoomOutButton } = zoomPluginInstance;
    const { GoToNextPage, GoToPreviousPage, CurrentPageLabel } = pageNavigationPluginInstance;
   

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
      key={pdfUrl}
      fileUrl={pdfUrl}
      plugins={[zoomPluginInstance, pageNavigationPluginInstance]}
    />
  </Worker>
)}

        </div>
    </div>
);

}
