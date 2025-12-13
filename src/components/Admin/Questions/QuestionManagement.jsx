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
} from "lucide-react";

const QuestionManagement = () => {
  const location = useLocation();
  const [activeType, setActiveType] = useState(() => {
    // Get type from URL or default to mcq
    const pathParts = location.pathname.split("/");
    const typeFromPath = pathParts[pathParts.length - 1];
    const validTypes = [
      "mcq",
      "blank",
      "true-false",
      "onetwo",
      "short",
      "long",
      "passage",
      "match",
    ];
    return validTypes.includes(typeFromPath) ? typeFromPath : "mcq";
  });

  const questionTypes = [
    { id: "mcq", name: "MCQ", icon: CheckSquare },
    { id: "blank", name: "Fill in Blanks", icon: Hash },
    { id: "true-false", name: "True & False", icon: Type },
    { id: "onetwo", name: "One Two", icon: FileText },
    { id: "short", name: "Short Answer", icon: AlignLeft },
    { id: "long", name: "Long Answer", icon: FileQuestion },
    { id: "passage", name: "Passage", icon: BookOpen },
    { id: "match", name: "Match", icon: Link2 },
  ];

  // Map URL-friendly names to API type names
  const getApiType = (type) => {
    const mapping = {
      "true-false": "true&false",
      mcq: "mcq",
      blank: "blank",
      onetwo: "onetwo",
      short: "short",
      long: "long",
      passage: "passage",
      match: "match",
    };
    return mapping[type] || type;
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

