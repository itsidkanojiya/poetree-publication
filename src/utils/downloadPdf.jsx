import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const downloadPDF = async (pdfPages) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = 210;
  const pdfHeight = 297;

  // High quality settings for sharp, clear PDF output
  const SCALE = 2.5; // Higher scale = sharper text and graphics (2.5 = good quality)
  const USE_PNG = true; // PNG = lossless quality; use false + JPEG for smaller files

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
      : canvas.toDataURL("image/jpeg", 0.95);

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

        pdf.addImage(imgData, USE_PNG ? "PNG" : "JPEG", xPos, yPos, imgWidth, imgHeight);

        if (i < pdfPages.length - 1) {
          pdf.addPage();
        }

        resolve();
      };
    });
  }

  // Enable compression in jsPDF
  pdf.setProperties({
    compress: true,
  });

  pdf.save("paper.pdf");
};

export default downloadPDF;
