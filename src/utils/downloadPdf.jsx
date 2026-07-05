import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const downloadPDF = async (pdfPages) => {
  // Ensure web fonts (incl. KaTeX math fonts) are loaded before screenshotting.
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch { /* noop */ }
  }
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
  const pdfWidth = 210;
  const pdfHeight = 297;

  // Balanced quality/size: JPEG keeps text crisp while keeping the PDF small.
  // (PNG screenshots at scale 2.5 produced ~40MB per page.)
  const SCALE = 2; // sharp enough for text/graphics
  const USE_PNG = false; // JPEG = far smaller files; set true only if lossless is required

  for (let i = 0; i < pdfPages.length; i++) {
    const canvas = await html2canvas(pdfPages[i], {
      scale: SCALE,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = USE_PNG
      ? canvas.toDataURL("image/png", 1.0)
      : canvas.toDataURL("image/jpeg", 0.92);

    const img = new Image();
    img.src = imgData;

    await new Promise((resolve) => {
      img.onload = function () {
        const imgRatio = img.width / img.height;
        const pageRatio = pdfWidth / pdfHeight;

        let imgWidth, imgHeight, xPos, yPos;

        if (imgRatio > pageRatio) {
          imgHeight = pdfHeight;
          imgWidth = imgHeight * imgRatio;
          xPos = -(imgWidth - pdfWidth) / 2;
          yPos = 0;
        } else {
          imgWidth = pdfWidth;
          imgHeight = imgWidth / imgRatio;
          xPos = 0;
          yPos = -(imgHeight - pdfHeight) / 2;
        }

        pdf.addImage(
          imgData,
          USE_PNG ? "PNG" : "JPEG",
          xPos,
          yPos,
          imgWidth,
          imgHeight,
          undefined,
          "FAST"
        );

        if (i < pdfPages.length - 1) {
          pdf.addPage();
        }

        resolve();
      };
    });
  }

  pdf.save("paper.pdf");
};

export default downloadPDF;
