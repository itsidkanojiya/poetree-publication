// Use CustomPaper's pagination logic with reduced margin for better space utilization
const splitQuestionsIntoPages = (questions, maxPageHeight, headerHeight) => {
  const PAGE_DIMENSIONS = {
    HEIGHT: maxPageHeight || 1123,
    WIDTH: 748,
    MARGIN: 15, // Reduced from 70px to allow multiple question types on same page
  };

  const COMPONENT_HEIGHTS = {
    HEADER: headerHeight || 230,
    QUESTION: 24,
    OPTION: 30,
    IMAGE: 200, // Fixed height for images (matches display height)
    SECTION: 28,
    SPACING: 16,
  };

  const getMcqOptionsHeight = (options) => {
    if (!options || options.length === 0) return 0;
    const avgLength =
      options.reduce((sum, opt) => sum + (opt?.length || 0), 0) /
      options.length;
    let rows;
    if (avgLength < 20) {
      rows = Math.ceil(options.length / 4);
    } else if (avgLength < 50) {
      rows = Math.ceil(options.length / 2);
    } else {
      rows = options.length;
    }
    return rows * COMPONENT_HEIGHTS.OPTION;
  };

  let pages = [];
  let currentHeight = PAGE_DIMENSIONS.HEIGHT - COMPONENT_HEIGHTS.HEADER;
  let currentPage = [];
  let isFirstPage = true;
  let questionNumber = 1;

  questions.forEach((question) => {
    // Check if this question type already exists on current page
    const isFirstQuestionOfType = !currentPage.some(
      (q) => q.type === question.type
    );

    // Calculate question height including spacing
    let questionHeight = COMPONENT_HEIGHTS.QUESTION;
    if (isFirstQuestionOfType) {
      questionHeight += COMPONENT_HEIGHTS.SECTION;
    }
    if (question.type === "mcq" && question.options) {
      try {
        const options =
          typeof question.options === "string"
            ? JSON.parse(question.options)
            : question.options;
        if (Array.isArray(options) && options.length > 0) {
          questionHeight += getMcqOptionsHeight(options);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    // Check for images in all question types (both image_url and image fields)
    if (
      (question.image_url !== null &&
        question.image_url !== undefined &&
        question.image_url !== "") ||
      (question.image !== null &&
        question.image !== undefined &&
        question.image !== "")
    ) {
      questionHeight += COMPONENT_HEIGHTS.IMAGE;
    }
    // Add spacing between questions (except for first question on page)
    const hasQuestionsOnPage = currentPage.length > 0;
    if (hasQuestionsOnPage) {
      questionHeight += COMPONENT_HEIGHTS.SPACING;
    }

    // Check if question fits on current page (with margin buffer)
    const availableHeight = currentHeight - PAGE_DIMENSIONS.MARGIN;

    if (questionHeight > availableHeight) {
      // Save current page if it has content
      if (currentPage.length > 0) {
        pages.push([...currentPage]);
      }

      // Start new page
      isFirstPage = false;
      currentPage = [];
      currentHeight = PAGE_DIMENSIONS.HEIGHT; // Full page height for subsequent pages (no header)

      // Recalculate question height for new page (it's now first of its type on this page)
      let newQuestionHeight =
        COMPONENT_HEIGHTS.QUESTION + COMPONENT_HEIGHTS.SECTION;
      if (question.type === "mcq" && question.options) {
        try {
          const options =
            typeof question.options === "string"
              ? JSON.parse(question.options)
              : question.options;
          if (Array.isArray(options) && options.length > 0) {
            newQuestionHeight += getMcqOptionsHeight(options);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
      // Check for images in all question types (both image_url and image fields)
      if (
        (question.image_url !== null &&
          question.image_url !== undefined &&
          question.image_url !== "") ||
        (question.image !== null &&
          question.image !== undefined &&
          question.image !== "")
      ) {
        newQuestionHeight += COMPONENT_HEIGHTS.IMAGE;
      }

      // Add question to new page
      currentPage.push({ ...question, number: questionNumber });
      currentHeight = PAGE_DIMENSIONS.HEIGHT - newQuestionHeight;

      // Safety check: if question is too large for a single page, still add it
      if (currentHeight < 0) {
        currentHeight = 0;
      }
    } else {
      // Question fits on current page
      currentPage.push({ ...question, number: questionNumber });
      currentHeight -= questionHeight;
    }

    questionNumber++;
  });

  // Always add the last page if it has content
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [[]];
};

export default splitQuestionsIntoPages;
