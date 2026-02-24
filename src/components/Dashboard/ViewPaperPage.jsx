import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import parse from "html-react-parser";
import Button from "../Common/Buttons/Button";
import { FileDown } from "lucide-react";
import downloadPDF from "../../utils/downloadPdf";
import { getPaperById } from "../../services/paperService";
import Loader from "../Common/loader/loader";

const ViewPaperPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const initialBody = location.state?.paperBody || "";
  const [content, setContent] = useState(() => {
    const body = initialBody || "<h1>No Content Available</h1>";
    const parsed = parse(body);
    return Array.isArray(parsed) ? parsed : [parsed];
  });
  const [loading, setLoading] = useState(!initialBody && !!id);

  // Fetch full paper by id when body was not passed (e.g. from History View)
  useEffect(() => {
    if (!id || initialBody) return;
    let cancelled = false;
    const load = async () => {
      try {
        const paper = await getPaperById(id);
        if (cancelled) return;
        const body = paper?.body ?? paper?.paper_body ?? "";
        const html = body || "<p>No content for this paper.</p>";
        const parsed = parse(html);
        setContent(Array.isArray(parsed) ? parsed : [parsed]);
      } catch (err) {
        if (!cancelled) setContent([<p key="err">Failed to load paper.</p>]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id, initialBody]);

  const handleQuestionClick = () => {};

  return (
    <div className="w-full flex flex-col items-center min-h-screen py-10">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader />
        </div>
      ) : (
        <>
      <Button
        text="Download"
        icon={FileDown}
        onClick={() => {
          const pdfPages = document.querySelectorAll("[id^=pdf-content-]");
          downloadPDF(pdfPages);
        }}
        color="bg-blue-600"
      />
      <div className="w-[850px] min-h-[1000px] p-10 rounded-lg">
        {content.map((section, index) => (
          <div key={index} className="mb-6 border-b pb-4 last:border-none">
            <div
              className="cursor-pointer"
              onClick={handleQuestionClick}
            >
              {section}
            </div>
          </div>
        ))}
      </div>
        </>
      )}
    </div>
  );
};

export default ViewPaperPage;
