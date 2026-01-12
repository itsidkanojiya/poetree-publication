import { addNewPaper } from '../services/paperService';

export const savePaper = async (
  user, 
  questionIds, 
  logoFile, 
  type, 
  headerData = null,
  marksPerType = null,
  questionSections = null,
  paperTitle = null
) => {
  try {
    if (!user || !user.id) {
      console.error("User not found");
      throw new Error("User not authenticated.");
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString();
    const formattedDate = now.toISOString().split("T")[0];

    const formData = new FormData();
    
    // Required fields
    formData.append("user_id", user.id);
    formData.append("type", type);
    
    // Add paper_title if provided (optional)
    if (paperTitle) {
      formData.append("paper_title", paperTitle);
    }
    
    // Add header data if provided, otherwise use defaults
    // Note: school_name, address, logo are now fetched from user table via user_id
    if (headerData) {
      // Standard should be integer, convert if string
      const standardValue = headerData.standard 
        ? (typeof headerData.standard === 'string' && headerData.standard !== 'NA' 
            ? parseInt(headerData.standard) || 0 
            : headerData.standard)
        : 0;
      formData.append("standard", standardValue);
      formData.append("date", headerData.date || formattedDate);
      formData.append("subject", headerData.subject || "NA");
      formData.append("board", headerData.board || "NA");
      
      // Optional header fields
      if (headerData.timing) formData.append("timing", headerData.timing);
      if (headerData.division) formData.append("division", headerData.division);
      if (headerData.subjectTitle) formData.append("subject_title_id", headerData.subjectTitle);
      // Add paper_title (documentTitle) if provided (optional)
      if (headerData.documentTitle) formData.append("paper_title", headerData.documentTitle);
    } else {
      formData.append("standard", 0);
      formData.append("date", formattedDate);
      formData.append("subject", "NA");
      formData.append("board", "NA");
    }
    
    // Store question IDs as JSON string in body (required)
    // Format: "[1,2,3,4,5]" - array of question IDs
    const bodyContent = Array.isArray(questionIds) 
      ? JSON.stringify(questionIds) 
      : questionIds; // Fallback if already a string
    formData.append("body", bodyContent);

    // Calculate and add marks for each question type
    if (questionSections && marksPerType) {
      let marksMcq = 0;
      let marksShort = 0;
      let marksLong = 0;
      let marksBlank = 0;
      let marksOnetwo = 0;
      let marksTruefalse = 0;

      questionSections.forEach((section) => {
        const count = section.selectedQuestions.length;
        const marks = marksPerType[section.type] || 0;
        const totalMarks = count * marks;

        switch (section.type) {
          case "mcq":
            marksMcq = totalMarks;
            break;
          case "short":
            marksShort = totalMarks;
            break;
          case "long":
            marksLong = totalMarks;
            break;
          case "blank":
            marksBlank = totalMarks;
            break;
          case "onetwo":
            marksOnetwo = totalMarks;
            break;
          case "true_false":
            marksTruefalse = totalMarks;
            break;
        }
      });

      formData.append("marks_mcq", marksMcq);
      formData.append("marks_short", marksShort);
      formData.append("marks_long", marksLong);
      formData.append("marks_blank", marksBlank);
      formData.append("marks_onetwo", marksOnetwo);
      formData.append("marks_truefalse", marksTruefalse);
    } else {
      // Default to 0 if not provided
      formData.append("marks_mcq", 0);
      formData.append("marks_short", 0);
      formData.append("marks_long", 0);
      formData.append("marks_blank", 0);
      formData.append("marks_onetwo", 0);
      formData.append("marks_truefalse", 0);
    }

    // Note: logo is now fetched from user table via user_id, no need to send it here

    await addNewPaper(formData);
    return { success: true };
  } catch (error) {
    console.error("Error saving paper:", error.response?.data || error);
    throw error;
  }
};
