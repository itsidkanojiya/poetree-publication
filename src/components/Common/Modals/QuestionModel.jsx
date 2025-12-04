import { useState } from "react";
import useFetchFilteredQuestions from "../../../hooks/useFetchFilteredQuestions";

const QuestionModal = ({
  questionType,
  selectedQuestion,
  setLocalQuestions,
  setIsModalOpen,
}) => {
  const { filteredQuestions, loading, error } =
    useFetchFilteredQuestions(questionType);
  const [searchTerm, setSearchTerm] = useState("");

  // console.log(selectedQuestion);

  const replaceQuestion = (newQuestion) => {
    console.log(newQuestion);
    setLocalQuestions((prevQuestions) => {
      return prevQuestions.map((q, index) => {
        // console.log(`Mapping index: ${index}, question_id: ${q.question_id}`);
        return q.question_id === selectedQuestion.question_id ? newQuestion : q;
      });
    });
    setIsModalOpen(false);
  };

  const filteredResults = filteredQuestions.filter((q) =>
    q.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-2/3 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">
          Select a New {questionType.toUpperCase()} Question
        </h2>

        <input
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 mb-3 border rounded focus:outline-none focus:ring focus:ring-blue-300"
        />

        <div className="max-h-60 overflow-y-auto border rounded p-2">
          {loading ? (
            <p className="text-gray-500 text-center">Loading...</p>
          ) : error ? (
            <p className="text-red-500 text-center">Error loading questions.</p>
          ) : filteredResults.length > 0 ? (
            filteredResults.map((q) => (
              <p
                key={q.question_id}
                className="p-3 border-b last:border-none cursor-pointer hover:bg-gray-200 transition"
                onClick={() => replaceQuestion(q)}
              >
                {q.question}
              </p>
            ))
          ) : (
            <p className="text-gray-500 text-center">No questions found.</p>
          )}
        </div>

        <button
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          onClick={() => setIsModalOpen(false)}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default QuestionModal;
