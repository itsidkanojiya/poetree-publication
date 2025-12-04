import { useEffect, useState } from "react";

const usePdfContent = (callback) => {
  const [divContents, setDivContents] = useState([]);

  useEffect(() => {
    const fetchDivs = () => {
      const selectedDivs = document.querySelectorAll("[id^=pdf-content-]");
      if (selectedDivs.length > 0) {
        const combinedString = Array.from(selectedDivs)
          .map((div) => div.outerHTML)
          .join("\n\n");

        setDivContents(combinedString);
      } else {
        console.log("No divs found, retrying...");
      }
    };

    // Delay execution to allow the DOM to render
    const timeout = setTimeout(fetchDivs, 1000);

    return () => clearTimeout(timeout);
  }, []);

  return divContents;
};

export default usePdfContent;
