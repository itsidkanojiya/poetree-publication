import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const downloadPDF = async (pdfPages) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = 210;
  const pdfHeight = 297;

  // Compression settings
  const JPEG_QUALITY = 0.85; // 0.85 = 85% quality (good balance between size and quality)
  const SCALE = 1.5; // Reduced from 2 to reduce file size (still good quality)

  for (let i = 0; i < pdfPages.length; i++) {
    const canvas = await html2canvas(pdfPages[i], {
      scale: SCALE,
      useCORS: true,
      logging: false, // Disable logging for better performance
      backgroundColor: "#ffffff", // Ensure white background
    });

    // Convert to JPEG instead of PNG for better compression
    const imgData = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

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

        // Add image with compression (JPEG format is already compressed)
        pdf.addImage(imgData, "JPEG", xPos, yPos, imgWidth, imgHeight);

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
