import React, { useState, useEffect } from "react";
import { Upload, Image } from "lucide-react";
import apiClient from "../../services/apiClient";

const EditHeaderCard = ({ editedHeader, handleInputChange }) => {
  const [approvedSubjects, setApprovedSubjects] = useState([]);
  const [approvedSubjectTitles, setApprovedSubjectTitles] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Fetch boards
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const response = await apiClient.get("/boards");
        const boardsData = response.data || [];
        setBoards(Array.isArray(boardsData) ? boardsData : []);
      } catch (error) {
        console.error("Error fetching boards:", error);
        setBoards([]);
      }
    };

    fetchBoards();
  }, []);

  // Fetch approved subjects
  useEffect(() => {
    const fetchApprovedSubjects = async () => {
      try {
        const response = await apiClient.get("/auth/my-selections/approved");
        const responseData = response.data;

        // Extract unique subjects from approved selections
        const subjectsMap = new Map();
        const subjectTitles = [];

        // Handle new response structure: { approved_selections: { subjects: [], subject_titles: [] } }
        if (responseData?.approved_selections) {
          const { subjects, subject_titles } = responseData.approved_selections;

          // Extract subjects from subjects array
          if (Array.isArray(subjects)) {
            subjects.forEach((item) => {
              const subjectId = item.subject_id || item.subject?.subject_id;
              const subjectName =
                item.subject?.subject_name || item.subject_name;

              if (subjectId && subjectName) {
                subjectsMap.set(subjectId, {
                  id: subjectId,
                  name: subjectName,
                });
              }
            });
          }

          // Extract subjects and subject titles from subject_titles array
          if (Array.isArray(subject_titles)) {
            subject_titles.forEach((item) => {
              const subjectId = item.subject_id || item.subject?.subject_id;
              const subjectName =
                item.subject?.subject_name || item.subject_name;

              if (subjectId && subjectName) {
                subjectsMap.set(subjectId, {
                  id: subjectId,
                  name: subjectName,
                });
              }

              // Extract subject title information
              if (item.subjectTitle) {
                const titleId =
                  item.subject_title_id || item.subjectTitle.subject_title_id;
                const titleName = item.subjectTitle.title_name;
                if (titleId && titleName) {
                  subjectTitles.push({
                    id: titleId,
                    name: titleName,
                    subject_id: subjectId,
                    subject_name: subjectName,
                  });
                }
              } else if (item.subject_title_id) {
                // Fallback: if subjectTitle object doesn't exist, use direct properties
                const titleId = item.subject_title_id;
                const titleName = item.title_name;
                if (titleId && titleName) {
                  subjectTitles.push({
                    id: titleId,
                    name: titleName,
                    subject_id: subjectId,
                    subject_name: subjectName,
                  });
                }
              }
            });
          }
        }
        // Handle old response structure: { data: [...] } or direct array
        else if (responseData?.data && Array.isArray(responseData.data)) {
          responseData.data.forEach((request) => {
            if (request.subjects && Array.isArray(request.subjects)) {
              request.subjects.forEach((subject) => {
                const subjectId = subject.subject_id;
                const subjectName = subject.subject_name;

                if (subjectId && subjectName) {
                  subjectsMap.set(subjectId, {
                    id: subjectId,
                    name: subjectName,
                  });
                }
              });
            }
          });
        }
        // Handle direct array response
        else if (Array.isArray(responseData)) {
          responseData.forEach((request) => {
            if (request.subjects && Array.isArray(request.subjects)) {
              request.subjects.forEach((subject) => {
                const subjectId = subject.subject_id;
                const subjectName = subject.subject_name;

                if (subjectId && subjectName) {
                  subjectsMap.set(subjectId, {
                    id: subjectId,
                    name: subjectName,
                  });
                }
              });
            }
          });
        }

        setApprovedSubjects(Array.from(subjectsMap.values()));
        setApprovedSubjectTitles(subjectTitles);
      } catch (error) {
        console.error("Error fetching approved subjects:", error);
        setApprovedSubjects([]);
        setApprovedSubjectTitles([]);
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchApprovedSubjects();
  }, []);
  // Field labels mapping for better readability
  const fieldLabels = {
    schoolName: "School Name",
    schoolAddress: "School Address",
    affiliation: "Board Affiliation",
    studentName: "Student Name",
    class: "Class",
    classStream: "Class/Stream",
    rollNo: "Roll Number",
    section: "Section",
    subject: "Subject",
    topic: "Topic/Assignment Title",
    date: "Date",
    assignmentType: "Assignment Type",
    image: "School Logo",
    board: "Board",
    subjectTitle: "Subject Title",
  };

  // Always include board and subjectTitle fields even if they don't exist in header
  const allFields = new Set(editedHeader ? Object.keys(editedHeader) : []);
  if (!allFields.has("board")) allFields.add("board");
  if (!allFields.has("subjectTitle")) allFields.add("subjectTitle");

  return (
    <div className="space-y-4">
      {Array.from(allFields).map((key) => {
        if (["id", "styleType", "layoutType"].includes(key)) return null;

        return (
          <div key={key}>
            {key === "image" ? (
              // Logo Upload Section
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  School Logo
                </label>

                <div className="flex flex-col gap-3">
                  <label className="relative cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2.5 rounded-lg shadow-lg hover:from-blue-600 hover:to-indigo-700 transition w-fit flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files.length > 0) {
                          const file = e.target.files[0];
                          const imageUrl = URL.createObjectURL(file);
                          handleInputChange(
                            { target: { value: imageUrl } },
                            key
                          );
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>

                  <input
                    type="text"
                    placeholder="Or enter image URL"
                    value={editedHeader[key] || ""}
                    onChange={(e) => handleInputChange(e, key)}
                    className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2.5 rounded-lg w-full transition outline-none"
                  />

                  {editedHeader[key] && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <img
                        src={editedHeader[key]}
                        alt="Preview"
                        className="w-16 h-16 rounded-lg object-cover border-2 border-gray-300"
                      />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-green-600">
                          ✓ Logo uploaded
                        </p>
                        <p className="text-xs text-gray-500">
                          Preview shown on left
                        </p>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Leave empty to use default school initials badge
                  </p>
                </div>
              </div>
            ) : key === "subject" ? (
              // Subject Dropdown with Approved Subjects
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {fieldLabels[key] ||
                    key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                </label>
                {loadingSubjects ? (
                  <div className="w-full border-2 border-gray-200 p-3 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">Loading subjects...</p>
                  </div>
                ) : approvedSubjects.length === 0 ? (
                  <div className="w-full border-2 border-amber-300 bg-amber-50 p-3 rounded-lg">
                    <p className="text-sm text-amber-700 font-medium">
                      No approved subjects available. Please request subjects
                      from admin.
                    </p>
                  </div>
                ) : (
                  <select
                    value={editedHeader[key] || ""}
                    onChange={(e) => handleInputChange(e, key)}
                    className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 rounded-lg transition outline-none bg-white"
                  >
                    <option value="">Select Subject</option>
                    {approvedSubjects.map((subject) => (
                      <option key={subject.id} value={subject.name}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : key === "class" ? (
              // Class Dropdown with options 1 to 12
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {fieldLabels[key] ||
                    key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                </label>
                <select
                  value={editedHeader[key] || ""}
                  onChange={(e) => handleInputChange(e, key)}
                  className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 rounded-lg transition outline-none bg-white"
                >
                  <option value="">Select Class</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
            ) : key === "board" ? (
              // Board Dropdown
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {fieldLabels[key] ||
                    key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                </label>
                {boards.length === 0 ? (
                  <div className="w-full border-2 border-gray-200 p-3 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">Loading boards...</p>
                  </div>
                ) : (
                  <select
                    value={editedHeader[key] || ""}
                    onChange={(e) => handleInputChange(e, key)}
                    className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 rounded-lg transition outline-none bg-white"
                  >
                    <option value="">Select Board</option>
                    {boards.map((board) => (
                      <option
                        key={board.board_id || board.id}
                        value={board.board_id || board.id}
                      >
                        {board.board_name || board.name || board.boardName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : key === "subjectTitle" ? (
              // Subject Title Dropdown
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {fieldLabels[key] ||
                    key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                </label>
                {approvedSubjectTitles.length === 0 ? (
                  <div className="w-full border-2 border-gray-200 p-3 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">
                      No subject titles available
                    </p>
                  </div>
                ) : (
                  <select
                    value={editedHeader[key] || ""}
                    onChange={(e) => handleInputChange(e, key)}
                    className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 rounded-lg transition outline-none bg-white"
                  >
                    <option value="">Select Subject Title</option>
                    {approvedSubjectTitles.map((title) => (
                      <option key={title.id} value={title.id}>
                        {title.name}{" "}
                        {title.subject_name ? `(${title.subject_name})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              // Regular Input Fields
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {fieldLabels[key] ||
                    key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                </label>
                <input
                  type={key === "date" ? "date" : "text"}
                  value={editedHeader[key] || ""}
                  onChange={(e) => handleInputChange(e, key)}
                  className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 rounded-lg transition outline-none"
                  placeholder={`Enter ${fieldLabels[key] || key}`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EditHeaderCard;
