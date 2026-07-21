import { addNewPaper } from '../services/paperService';
import { ALL_TYPE_KEYS, normalizeTypeKey } from '../utils/questionTypes';

export const savePaper = async (
  user, 
  questionIds, 
  logoFile, 
  type, 
  headerData = null,
  marksPerType = null,
  questionSections = null,
  paperTitle = null,
  chapterIds = null
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
    formData.append("paper_title", paperTitle || "");
    
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
      const chapterId = headerData.chapterId ?? headerData.chapter_id;
      if (chapterId != null && chapterId !== "") formData.append("chapter_id", String(chapterId));
      formData.append("paper_title", headerData.documentTitle || "");
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

    // Chapter IDs from selected questions (chapters that have questions in this paper)
    if (chapterIds && Array.isArray(chapterIds) && chapterIds.length > 0) {
      formData.append("chapter_ids", JSON.stringify(chapterIds));
    }

    // Per-type marks. Driven by the shared registry so a new question type is never
    // silently dropped (the old switch had no default: passage/match marks were lost).
    const marksByType = {};
    if (questionSections && marksPerType) {
      questionSections.forEach((section) => {
        const key = normalizeTypeKey(section.type);
        const count = section.selectedQuestions.length;
        const marks = Number(marksPerType[section.type] ?? marksPerType[key]) || 0;
        if (!key) return;
        marksByType[key] = (marksByType[key] || 0) + count * marks;
      });
    }
    ALL_TYPE_KEYS.forEach((key) => {
      if (marksByType[key] == null) marksByType[key] = 0;
    });
    // New contract: every type in one field (decimals preserved).
    formData.append("marks_by_type", JSON.stringify(marksByType));
    // Legacy per-type fields, still sent for backward compatibility.
    formData.append("marks_mcq", marksByType.mcq || 0);
    formData.append("marks_short", marksByType.short || 0);
    formData.append("marks_long", marksByType.long || 0);
    formData.append("marks_blank", marksByType.blank || 0);
    formData.append("marks_onetwo", marksByType.onetwo || 0);
    formData.append("marks_truefalse", marksByType.true_false || 0);
    formData.append("marks_passage", marksByType.passage || 0);
    formData.append("marks_match", marksByType.match || 0);

    // Note: logo is now fetched from user table via user_id, no need to send it here

    await addNewPaper(formData);
    return { success: true };
  } catch (error) {
    console.error("Error saving paper:", error.response?.data || error);
    throw error;
  }
};
