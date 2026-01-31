import { BookOpen, ChevronDown } from "lucide-react";
import { useUserTeaching } from "../../context/UserTeachingContext";

const ContextBar = () => {
  const { contextSelection, setNeedsContextChoice } = useUserTeaching();

  if (!contextSelection) return null;

  const subjectName = contextSelection.subject_name || `Subject ${contextSelection.subject_id}`;
  const titleName = contextSelection.subject_title_name || `Title ${contextSelection.subject_title_id}`;
  const standard = contextSelection.standard;
  const boardName = contextSelection.board_name || (contextSelection.board_id ? `Board ${contextSelection.board_id}` : "");

  return (
    <div className="bg-white/80 backdrop-blur border-b border-gray-200 px-4 py-3 mb-4 rounded-b-xl shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-gray-700">
          <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <span className="font-semibold text-gray-800">Context:</span>
          <span className="text-gray-700">
            {subjectName}
            <span className="mx-2 text-gray-400">|</span>
            {titleName}
            <span className="mx-2 text-gray-400">|</span>
            Std {standard}
            {boardName && (
              <>
                <span className="mx-2 text-gray-400">|</span>
                {boardName}
              </>
            )}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setNeedsContextChoice(true)}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
        >
          <ChevronDown className="w-4 h-4" />
          Change
        </button>
      </div>
    </div>
  );
};

export default ContextBar;
