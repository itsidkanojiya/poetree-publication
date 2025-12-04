const splitQuestionsIntoPages = (questions, maxPageHeight, headerHeight) => {
    const pages = [];
    let currentPage = [];
    let currentPageHeight = 0;
    let isFirstPage = true;
    let questionNumber = 1;
  
    const QUESTION_HEIGHTS = {
      mcq: 170,
      blank: 50,
      onetwo: 80,
      short: 80,
      long: 80,
      default: 100,
    };
  
    questions.forEach((q) => {
      const questionHeight =
        QUESTION_HEIGHTS[q.type] || QUESTION_HEIGHTS.default;
  
      // Adjust available height based on whether it's the first page
      const availableHeight = isFirstPage
        ? maxPageHeight - headerHeight
        : maxPageHeight;
  
      // If adding this question exceeds available space, start a new page
      if (currentPageHeight + questionHeight > availableHeight) {
        pages.push([...currentPage]); // Save current page
        currentPage = []; // Start new page
        currentPageHeight = 0;
        isFirstPage = false; // No header on subsequent pages
      }
  
      // Add question with its global number
      currentPage.push({ ...q, number: questionNumber });
      currentPageHeight += questionHeight;
      questionNumber++; // Keep numbering sequential
    });
  
    // Push the last page if not empty
    if (currentPage.length > 0) {
      pages.push([...currentPage]);
    }
  
    return pages;
  };
  
  export default splitQuestionsIntoPages;
  