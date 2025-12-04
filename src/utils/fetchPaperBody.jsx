import { useState } from "react";

const fetchPaperBody = async (papers, id) => {

    try {
      if (typeof papers === "object") {
        const paperArray = papers.papers;
  
        if (!Array.isArray(paperArray)) {
          console.error("Papers is not an array.");
          return;
        }
  
        // Find the paper with the matching id
        const paper = paperArray.find((p) => p.id === id);
  
        if (!paper) {
          console.error("Paper not found!");
          return;
        }
        
        const convertedHTML = convertStringToHTML(paper.body);
        // console.log(convertedHTML);
        return convertedHTML;
      }
    } catch (error) {
      console.error("Error fetching paper:", error);
      throw error;
    }
  };

  const convertStringToHTML = (str) => {
    const doc = new DOMParser().parseFromString(str, "text/html");
    return doc.body.innerHTML;
  };
  
  export default fetchPaperBody;
  