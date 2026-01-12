import { useState } from "react";
import { FileText } from "lucide-react";

const QuestionTypeTitleEditor = ({ questionTypes, onChange }) => {
  const defaultTitles = {
    mcq: "A) Multiple Choice Questions",
    short: "B) Short Answer Questions",
    long: "C) Long Answer Questions",
    blank: "D) Fill in the Blanks",
    onetwo: "E) One or Two Word Answers",
    truefalse: "F) True/False Questions",
    passage: "G) Passage Based Questions",
    match: "H) Match the Following",
  };

  const questionTypeLabels = {
    mcq: "Multiple Choice Questions (MCQ)",
    short: "Short Answer Questions",
    long: "Long Answer Questions",
    blank: "Fill in the Blanks",
    onetwo: "One or Two Word Answers",
    truefalse: "True/False Questions",
    passage: "Passage Based Questions",
    match: "Match the Following",
  };

  const handleTitleChange = (type, value) => {
    const updated = {
      ...questionTypes,
      [type]: { custom_title: value },
    };
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex items-start">
          <FileText className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-blue-800 mb-1">
              Custom Question Type Titles
            </h3>
            <p className="text-sm text-blue-700">
              Customize the section headings for each question type. Leave empty to use default titles.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {Object.keys(questionTypeLabels).map((type) => (
          <div key={type} className="bg-white border-2 border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {questionTypeLabels[type]}
            </label>
            <input
              type="text"
              value={questionTypes[type]?.custom_title || ""}
              onChange={(e) => handleTitleChange(type, e.target.value)}
              placeholder={defaultTitles[type]}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
            />
            {questionTypes[type]?.custom_title && (
              <p className="text-xs text-gray-500 mt-1">
                Preview: <span className="font-medium">{questionTypes[type].custom_title}</span>
              </p>
            )}
            {!questionTypes[type]?.custom_title && (
              <p className="text-xs text-gray-400 mt-1">
                Default: {defaultTitles[type]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionTypeTitleEditor;




