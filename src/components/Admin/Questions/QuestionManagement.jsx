import { useState } from "react";
import { useLocation } from "react-router-dom";
import QuestionsList from "./QuestionsList";
import {
  FileText,
  Type,
  CheckSquare,
  Hash,
  AlignLeft,
  FileQuestion,
  BookOpen,
  Link2,
  Repeat,
  ArrowLeftRight,
  Languages,
  PenLine,
} from "lucide-react";
import QUESTION_TYPES from "../../../utils/questionTypes";

// Tab id (URL-friendly) per registry key, where it differs from the key.
const TAB_ID_BY_KEY = { true_false: "true-false" };
const KEY_BY_TAB_ID = { "true-false": "true_false" };

const TAB_ICONS = {
  mcq: CheckSquare,
  blank: Hash,
  true_false: Type,
  onetwo: FileText,
  short: AlignLeft,
  long: FileQuestion,
  passage: BookOpen,
  match: Link2,
  complete_lines: PenLine,
  synonyms: Repeat,
  antonyms: ArrowLeftRight,
  translate: Languages,
};

const TAB_NAMES = {
  mcq: "MCQ",
  blank: "Fill in Blanks",
  true_false: "True & False",
  onetwo: "One Two",
  short: "Short Answer",
  long: "Long Answer",
  passage: "Passage",
  match: "Match",
};

// Tabs come from the registry, so a new question type shows up here automatically.
const QUESTION_TYPE_TABS = QUESTION_TYPES.map((t) => ({
  id: TAB_ID_BY_KEY[t.key] || t.key,
  key: t.key,
  name: TAB_NAMES[t.key] || t.label,
  icon: TAB_ICONS[t.key] || FileText,
  // null = every subject; otherwise only these paper languages.
  languages: t.languages,
}));

const QuestionManagement = () => {
  const location = useLocation();
  const [activeType, setActiveType] = useState(() => {
    // Get type from URL or default to mcq
    const pathParts = location.pathname.split("/");
    const typeFromPath = pathParts[pathParts.length - 1];
    const validTypes = QUESTION_TYPE_TABS.map((t) => t.id);
    return validTypes.includes(typeFromPath) ? typeFromPath : "mcq";
  });

  const questionTypes = QUESTION_TYPE_TABS;

  // Map URL-friendly names to API type names.
  const getApiType = (type) => {
    const key = KEY_BY_TAB_ID[type] || type;
    // The admin API still expects the legacy "true&false" spelling here.
    return key === "true_false" ? "true&false" : key;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Question Management
        </h1>
        <p className="text-gray-600">Manage questions by type</p>
      </div>

      {/* Question Type Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 border-b border-gray-200 overflow-x-auto">
          {questionTypes.map((type) => {
            const Icon = type.icon;
            const isActive = activeType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{type.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions List for Active Type */}
      <QuestionsList questionType={getApiType(activeType)} />
    </div>
  );
};

export default QuestionManagement;

