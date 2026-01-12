import { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  Image,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { addQuestion } from "../../../services/adminService";
import {
  getAllSubjects,
  getAllBoards,
  getAllSubjectTitles,
} from "../../../services/adminService";
import Toast from "../../Common/Toast";

const BulkUploadModal = ({ questionType, onClose, onSuccess }) => {
  const [excelFile, setExcelFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectTitles, setSubjectTitles] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const [errors, setErrors] = useState([]);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "error",
  });
  const excelInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Excel column mapping based on question type
  const getColumnMapping = () => {
    const baseMapping = {
      question: "Question",
      answer: "Answer",
      solution: "Solution",
      subject: "Subject",
      subject_title: "Subject Title",
      subject_title_id: "Subject Title ID",
      standard: "Standard",
      board: "Board",
      board_id: "Board ID",
      marks: "Marks",
      image: "Image",
    };

    if (questionType === "mcq") {
      return {
        ...baseMapping,
        option1: "Option1",
        option2: "Option2",
        option3: "Option3",
        option4: "Option4",
      };
    }

    if (questionType === "passage") {
      return {
        ...baseMapping,
        passage: "Passage",
        passage_questions: "Passage Questions",
        passage_answers: "Passage Answers",
      };
    }

    if (questionType === "match") {
      return {
        ...baseMapping,
        left_items: "Left Items",
        right_items: "Right Items",
        match_answers: "Match Answers",
      };
    }

    return baseMapping;
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setExcelFile(file);
    setErrors([]);
    setParsedQuestions([]);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            setToast({
              show: true,
              message: "Excel file is empty",
              type: "error",
            });
            return;
          }

          // Parse questions from Excel
          const questions = parseQuestionsFromExcel(jsonData);
          setParsedQuestions(questions);
        } catch (error) {
          console.error("Error parsing Excel:", error);
          setToast({
            show: true,
            message: "Error parsing Excel file. Please check the format.",
            type: "error",
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      setToast({
        show: true,
        message: "Failed to read Excel file",
        type: "error",
      });
    }
  };

  const parseQuestionsFromExcel = (jsonData) => {
    const mapping = getColumnMapping();
    const questions = [];
    const newErrors = [];

    jsonData.forEach((row, index) => {
      try {
        const question = {
          rowNumber: index + 2, // Excel row number (1-indexed, +1 for header)
          type: questionType,
          question: row[mapping.question] || "",
          answer: "",
          options: "",
          solution: row[mapping.solution] || "",
          subject_id: "",
          subject_title_id: "",
          board_id: "",
          standard: row[mapping.standard]
            ? String(row[mapping.standard]).trim()
            : "",
          marks: row[mapping.marks] ? String(row[mapping.marks]).trim() : "",
          image: null,
          imageFileName: row[mapping.image] || "",
        };

        // Handle question type specific fields
        if (questionType === "mcq") {
          const options = [
            row[mapping.option1],
            row[mapping.option2],
            row[mapping.option3],
            row[mapping.option4],
          ].filter(Boolean);

          if (options.length < 4) {
            newErrors.push(`Row ${index + 2}: MCQ must have 4 options`);
          }

          question.options = JSON.stringify(options);
          // MCQ answer should be the option number (1-4)
          const answerValue = row[mapping.answer] || "";
          question.answer = String(answerValue).trim();
        } else if (questionType === "passage") {
          const passage = row[mapping.passage] || "";
          const passageQuestions = row[mapping.passage_questions] || "";
          const passageAnswers = row[mapping.passage_answers] || "";

          // Parse passage questions (can be JSON string or comma-separated)
          let questionsArray = [];
          let answersObj = {};

          try {
            if (passageQuestions.startsWith("[")) {
              questionsArray = JSON.parse(passageQuestions);
            } else {
              questionsArray = passageQuestions
                .split(",")
                .map((q) => ({ question: q.trim(), answer: "" }));
            }
          } catch (e) {
            questionsArray = passageQuestions
              .split(",")
              .map((q) => ({ question: q.trim(), answer: "" }));
          }

          try {
            if (passageAnswers.startsWith("{")) {
              answersObj = JSON.parse(passageAnswers);
            } else {
              const answers = passageAnswers.split(",");
              answers.forEach((ans, idx) => {
                answersObj[`q${idx + 1}`] = ans.trim();
              });
            }
          } catch (e) {
            const answers = passageAnswers.split(",");
            answers.forEach((ans, idx) => {
              answersObj[`q${idx + 1}`] = ans.trim();
            });
          }

          question.question = passage;
          question.options = JSON.stringify(questionsArray);
          question.answer = JSON.stringify(answersObj);
        } else if (questionType === "match") {
          const leftItems = row[mapping.left_items] || "";
          const rightItems = row[mapping.right_items] || "";
          const matchAnswers = row[mapping.match_answers] || "";

          let leftArray = [];
          let rightArray = [];
          let answersObj = {};

          try {
            if (leftItems.startsWith("[")) {
              leftArray = JSON.parse(leftItems);
            } else {
              leftArray = leftItems.split(",").map((item) => item.trim());
            }
          } catch (e) {
            leftArray = leftItems.split(",").map((item) => item.trim());
          }

          try {
            if (rightItems.startsWith("[")) {
              rightArray = JSON.parse(rightItems);
            } else {
              rightArray = rightItems.split(",").map((item) => item.trim());
            }
          } catch (e) {
            rightArray = rightItems.split(",").map((item) => item.trim());
          }

          try {
            if (matchAnswers.startsWith("{")) {
              answersObj = JSON.parse(matchAnswers);
            } else {
              // Format: "A:1,B:2,C:3"
              matchAnswers.split(",").forEach((pair) => {
                const [key, value] = pair.split(":");
                if (key && value) answersObj[key.trim()] = value.trim();
              });
            }
          } catch (e) {
            matchAnswers.split(",").forEach((pair) => {
              const [key, value] = pair.split(":");
              if (key && value) answersObj[key.trim()] = value.trim();
            });
          }

          question.question = row[mapping.question] || "Match the following:";
          question.options = JSON.stringify({
            left: leftArray,
            right: rightArray,
          });
          question.answer = JSON.stringify(answersObj);
        } else {
          question.answer = row[mapping.answer] || "";
        }

        // Map subject name to subject_id
        if (row[mapping.subject]) {
          const subjectName = String(row[mapping.subject]).trim().toLowerCase();
          const subject = subjects.find((s) => {
            const name = String(s.subject_name || "")
              .trim()
              .toLowerCase();
            return name === subjectName;
          });
          if (subject) {
            question.subject_id = subject.subject_id;
          } else {
            const available = subjects
              .slice(0, 5)
              .map((s) => s.subject_name)
              .join(", ");
            newErrors.push(
              `Row ${index + 2}: Subject "${
                row[mapping.subject]
              }" not found. Available: ${available}${
                subjects.length > 5 ? "..." : ""
              }`
            );
          }
        } else if (row[mapping.subject_id]) {
          // If subject_id is directly provided in Excel
          const subId = parseInt(row[mapping.subject_id]);
          const subject = subjects.find((s) => s.subject_id === subId);
          if (subject) {
            question.subject_id = subId;
          } else {
            newErrors.push(`Row ${index + 2}: Subject ID "${subId}" not found`);
          }
        }

        // Map subject title name to subject_title_id
        if (row[mapping.subject_title]) {
          const subjectTitleName = String(row[mapping.subject_title])
            .trim()
            .toLowerCase();
          const subjectTitle = subjectTitles.find((st) => {
            const titleName = String(st.title_name || "")
              .trim()
              .toLowerCase();
            return titleName === subjectTitleName;
          });
          if (subjectTitle) {
            question.subject_title_id = subjectTitle.subject_title_id;
          } else {
            const available = subjectTitles
              .slice(0, 5)
              .map((st) => st.title_name)
              .join(", ");
            newErrors.push(
              `Row ${index + 2}: Subject Title "${
                row[mapping.subject_title]
              }" not found. Available: ${available}${
                subjectTitles.length > 5 ? "..." : ""
              }`
            );
          }
        } else if (row[mapping.subject_title_id]) {
          // If subject_title_id is directly provided in Excel
          const titleId = parseInt(row[mapping.subject_title_id]);
          const subjectTitle = subjectTitles.find(
            (st) => st.subject_title_id === titleId
          );
          if (subjectTitle) {
            question.subject_title_id = titleId;
          } else {
            newErrors.push(
              `Row ${index + 2}: Subject Title ID "${titleId}" not found`
            );
          }
        }

        // Map board name to board_id
        if (row[mapping.board]) {
          const boardName = String(row[mapping.board]).trim().toLowerCase();
          const board = boards.find((b) => {
            const name = String(b.board_name || "")
              .trim()
              .toLowerCase();
            return name === boardName;
          });
          if (board) {
            question.board_id = board.board_id;
          } else {
            const available = boards
              .slice(0, 5)
              .map((b) => b.board_name)
              .join(", ");
            newErrors.push(
              `Row ${index + 2}: Board "${
                row[mapping.board]
              }" not found. Available: ${available}${
                boards.length > 5 ? "..." : ""
              }`
            );
          }
        } else if (row[mapping.board_id]) {
          // If board_id is directly provided in Excel
          const brdId = parseInt(row[mapping.board_id]);
          const board = boards.find((b) => b.board_id === brdId);
          if (board) {
            question.board_id = brdId;
          } else {
            newErrors.push(`Row ${index + 2}: Board ID "${brdId}" not found`);
          }
        }

        // Validate ALL required fields
        if (!question.question) {
          newErrors.push(`Row ${index + 2}: Question is required`);
        }
        if (
          !question.answer &&
          questionType !== "passage" &&
          questionType !== "match"
        ) {
          newErrors.push(`Row ${index + 2}: Answer is required`);
        }
        if (!question.subject_id) {
          newErrors.push(
            `Row ${
              index + 2
            }: Subject ID is required (provide Subject name or Subject ID)`
          );
        }
        if (!question.subject_title_id) {
          newErrors.push(
            `Row ${
              index + 2
            }: Subject Title ID is required (provide Subject Title name or Subject Title ID)`
          );
        }
        if (!question.board_id) {
          newErrors.push(
            `Row ${
              index + 2
            }: Board ID is required (provide Board name or Board ID)`
          );
        }
        if (!question.standard) {
          newErrors.push(`Row ${index + 2}: Standard is required`);
        }
        if (!question.marks) {
          newErrors.push(`Row ${index + 2}: Marks is required`);
        }
        if (questionType === "mcq" && !question.options) {
          newErrors.push(`Row ${index + 2}: Options are required for MCQ`);
        }
        if (
          (questionType === "passage" || questionType === "match") &&
          !question.options
        ) {
          newErrors.push(
            `Row ${index + 2}: Options are required for ${questionType}`
          );
        }

        questions.push(question);
      } catch (error) {
        newErrors.push(`Row ${index + 2}: ${error.message}`);
      }
    });

    setErrors(newErrors);
    return questions;
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles((prev) => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const mapImagesToQuestions = () => {
    const imageMap = new Map();
    imageFiles.forEach((file) => {
      const fileName = file.name.toLowerCase();
      // Remove extension for matching
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
      imageMap.set(nameWithoutExt, file);
    });

    return parsedQuestions.map((q) => {
      if (q.imageFileName) {
        // Extract filename from full path (handle both Windows and Unix paths)
        let imageFileName = q.imageFileName;
        // Extract just the filename from path (e.g., "C:\Users\...\file.png" -> "file.png")
        const pathParts = imageFileName.split(/[/\\]/);
        const fileNameOnly = pathParts[pathParts.length - 1];
        
        // Remove extension for matching
        const imageName = fileNameOnly
          .toLowerCase()
          .replace(/\.[^/.]+$/, "");
        const matchedImage = imageMap.get(imageName);
        if (matchedImage) {
          return { ...q, image: matchedImage };
        }
      }
      return q;
    });
  };

  const handleBulkUpload = async () => {
    if (parsedQuestions.length === 0) {
      setToast({
        show: true,
        message: "No questions to upload",
        type: "error",
      });
      return;
    }

    if (errors.length > 0) {
      setToast({
        show: true,
        message: `Please fix ${errors.length} error(s) before uploading`,
        type: "error",
      });
      return;
    }

    try {
      setUploading(true);
      const questionsWithImages = mapImagesToQuestions();
      let successCount = 0;
      let failCount = 0;

      setUploadProgress({ current: 0, total: questionsWithImages.length });

      for (let i = 0; i < questionsWithImages.length; i++) {
        const question = questionsWithImages[i];
        try {
          const formData = new FormData();

          // REQUIRED FIELDS - Always append (convert to proper types)
          formData.append("type", question.type);
          formData.append("subject_id", String(question.subject_id));
          formData.append(
            "subject_title_id",
            String(question.subject_title_id)
          );
          formData.append("board_id", String(question.board_id));
          formData.append("standard", String(question.standard));
          formData.append("question", String(question.question));
          formData.append("answer", String(question.answer));
          formData.append("marks", String(question.marks));

          // OPTIONAL FIELDS
          if (question.solution) formData.append("solution", question.solution);
          if (question.image) formData.append("image", question.image);

          // Type-specific required fields
          if (questionType === "mcq") {
            formData.append("options", question.options);
          } else if (questionType === "passage" || questionType === "match") {
            formData.append("options", question.options);
            // Answer is already appended above, but for passage/match it's JSON string
          }
          // For other types, answer is already appended above

          await addQuestion(formData);
          successCount++;
        } catch (error) {
          console.error(`Error uploading question ${i + 1}:`, error);
          failCount++;
        }

        setUploadProgress({
          current: i + 1,
          total: questionsWithImages.length,
        });
      }

      setToast({
        show: true,
        message: `Upload complete! ${successCount} successful, ${failCount} failed`,
        type: successCount > 0 ? "success" : "error",
      });

      if (successCount > 0) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (error) {
      setToast({
        show: true,
        message: "Bulk upload failed",
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  // Fetch subjects, subject titles, and boards on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsData, subjectTitlesData, boardsData] = await Promise.all(
          [getAllSubjects(), getAllSubjectTitles(), getAllBoards()]
        );
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
        setSubjectTitles(
          Array.isArray(subjectTitlesData) ? subjectTitlesData : []
        );
        setBoards(Array.isArray(boardsData) ? boardsData : []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl p-6 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">
              Bulk Upload Questions
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">
              Excel Format Requirements:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>
                <strong>Required columns:</strong> Question, Answer, Standard,
                Subject (or Subject ID), Subject Title (or Subject Title ID),
                Board (or Board ID), Marks
              </li>
              {questionType === "mcq" && (
                <li>
                  <strong>MCQ requires:</strong> Option1, Option2, Option3,
                  Option4
                </li>
              )}
              {(questionType === "passage" || questionType === "match") && (
                <li>
                  <strong>{questionType} requires:</strong> Options field (JSON
                  format)
                </li>
              )}
              <li>
                <strong>Optional columns:</strong> Solution, Image (filename)
              </li>
              <li>
                You can provide either names (Subject, Board, Subject Title) or
                IDs directly
              </li>
              <li>
                Image files should match the filename in Excel
                (case-insensitive)
              </li>
            </ul>
          </div>

          {/* Available Options Reference */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Available Options (Use exact names or IDs from below):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-semibold text-green-700 mb-1">
                  Subjects ({subjects.length}):
                </p>
                <div className="bg-white rounded p-2 max-h-32 overflow-y-auto">
                  {subjects.length > 0 ? (
                    <ul className="space-y-1">
                      {subjects.map((s) => (
                        <li key={s.subject_id} className="text-green-600">
                          <span className="font-mono text-xs text-gray-500">
                            ID: {s.subject_id}
                          </span>{" "}
                          - {s.subject_name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">Loading...</p>
                  )}
                </div>
              </div>
              <div>
                <p className="font-semibold text-green-700 mb-1">
                  Subject Titles ({subjectTitles.length}):
                </p>
                <div className="bg-white rounded p-2 max-h-32 overflow-y-auto">
                  {subjectTitles.length > 0 ? (
                    <ul className="space-y-1">
                      {subjectTitles.map((st) => (
                        <li
                          key={st.subject_title_id}
                          className="text-green-600"
                        >
                          <span className="font-mono text-xs text-gray-500">
                            ID: {st.subject_title_id}
                          </span>{" "}
                          - {st.title_name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">Loading...</p>
                  )}
                </div>
              </div>
              <div>
                <p className="font-semibold text-green-700 mb-1">
                  Boards ({boards.length}):
                </p>
                <div className="bg-white rounded p-2 max-h-32 overflow-y-auto">
                  {boards.length > 0 ? (
                    <ul className="space-y-1">
                      {boards.map((b) => (
                        <li key={b.board_id} className="text-green-600">
                          <span className="font-mono text-xs text-gray-500">
                            ID: {b.board_id}
                          </span>{" "}
                          - {b.board_name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">Loading...</p>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">
              💡 <strong>Tip:</strong> Use exact names from above or use IDs
              directly in Excel for better reliability
            </p>
          </div>

          {/* Excel Upload */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Excel File (.xlsx) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                className="hidden"
              />
              <button
                onClick={() => excelInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition border-2 border-blue-200"
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span>{excelFile ? excelFile.name : "Select Excel File"}</span>
              </button>
              {excelFile && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  File selected
                </span>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Question Images (Optional)
            </label>
            <div className="flex items-center gap-4 mb-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition border-2 border-green-200"
              >
                <Image className="w-5 h-5" />
                <span>Select Images</span>
              </button>
              {imageFiles.length > 0 && (
                <span className="text-sm text-green-600">
                  {imageFiles.length} image(s) selected
                </span>
              )}
            </div>
            {imageFiles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {imageFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-sm"
                  >
                    <span className="text-gray-700">{file.name}</span>
                    <button
                      onClick={() => removeImage(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200 max-h-64 overflow-y-auto">
              <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {errors.length} Error(s) Found - Please fix before uploading:
              </h4>
              <div className="bg-white rounded p-3 mt-2">
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="list-disc list-inside">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-3 p-3 bg-amber-50 rounded border border-amber-200">
                <p className="text-sm text-amber-800 font-semibold">
                  💡 Required Fields Checklist:
                </p>
                <ul className="text-xs text-amber-700 mt-1 space-y-0.5 list-disc list-inside">
                  <li>Question, Answer, Standard, Marks</li>
                  <li>Subject (or Subject ID)</li>
                  <li>
                    Subject Title (or Subject Title ID) -{" "}
                    <strong>This is required!</strong>
                  </li>
                  <li>Board (or Board ID)</li>
                  {questionType === "mcq" && (
                    <li>Option1, Option2, Option3, Option4</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Preview */}
          {parsedQuestions.length > 0 && (() => {
            // Map images to questions for preview
            const questionsWithImages = mapImagesToQuestions();
            return (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-2">
                  Preview ({parsedQuestions.length} questions)
                </h4>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">#</th>
                        <th className="px-4 py-2 text-left">Question</th>
                        <th className="px-4 py-2 text-left">Answer</th>
                        <th className="px-4 py-2 text-left">Image</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questionsWithImages.slice(0, 10).map((q, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{index + 1}</td>
                          <td className="px-4 py-2 max-w-xs truncate">
                            {q.question}
                          </td>
                          <td className="px-4 py-2 max-w-xs truncate">
                            {typeof q.answer === "object"
                              ? JSON.stringify(q.answer)
                              : q.answer}
                          </td>
                          <td className="px-4 py-2">
                            {q.image ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : q.imageFileName ? (
                              <XCircle className="w-4 h-4 text-amber-600" />
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedQuestions.length > 10 && (
                    <div className="p-2 text-center text-sm text-gray-500">
                      ... and {parsedQuestions.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Upload Progress */}
          {uploading && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Uploading...
                </span>
                <span className="text-sm text-gray-600">
                  {uploadProgress.current} / {uploadProgress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      (uploadProgress.current / uploadProgress.total) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              disabled={uploading}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkUpload}
              disabled={
                uploading || parsedQuestions.length === 0 || errors.length > 0
              }
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload {parsedQuestions.length} Questions</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BulkUploadModal;
