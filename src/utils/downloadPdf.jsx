import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const downloadPDF = async (pdfPages) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = 210;
  const pdfHeight = 297;

  for (let i = 0; i < pdfPages.length; i++) {
    const canvas = await html2canvas(pdfPages[i], {
      scale: 2,
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");

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

        pdf.addImage(imgData, "PNG", xPos, yPos, imgWidth, imgHeight);

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
