import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { FileDown, FileText, XCircle } from "lucide-react";
import QuestionModal from "../Common/Modals/QuestionModel";
import { useAuth } from "../../context/AuthContext";
import { useQuestionContext } from "../../context/QuestionContext";
import HeaderCard from "../Cards/HeaderCard";
import Button from "../Common/Buttons/Button";
import splitQuestionsIntoPages from "../../utils/splitQuestionsIntoPages";
import downloadPDF from "../../utils/downloadPdf";
import usePdfContent from "../../hooks/usePdfContent";
import { savePaper } from "../../utils/savePaper";

const PdfPreview = () => {
  const location = useLocation();
  const { header } = location.state || {};
  const { questionData, loading, error, fetchQuestions } = useQuestionContext();
  const { user } = useAuth();
  const [localQuestions, setLocalQuestions] = useState([]);
  const [questions, setQuestions] = useState([]);
  
  // Fetch questions on mount
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);
  
  // Process questions when data is available (same logic as useFetchQuestions hook)
  useEffect(() => {
    if (!questionData || questionData.length === 0) {
      setQuestions([]);
      return;
    }

    const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);
    const shuffled = shuffleArray(questionData);

    const formattedQuestions = {
      mcq: shuffleArray(shuffled.filter((q) => q.type === "mcq")).slice(0, 5),
      blank: shuffleArray(shuffled.filter((q) => q.type === "blank")).slice(0, 6),
      onetwo: shuffleArray(shuffled.filter((q) => q.type === "onetwo")).slice(0, 2),
      short: shuffleArray(shuffled.filter((q) => q.type === "short")).slice(0, 2),
      long: shuffleArray(shuffled.filter((q) => q.type === "long")).slice(0, 4),
    };

    setQuestions([
      ...formattedQuestions.mcq,
      ...formattedQuestions.blank,
      ...formattedQuestions.onetwo,
      ...formattedQuestions.short,
      ...formattedQuestions.long,
    ]);
  }, [questionData]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questionType, setQuestionType] = useState("");

  const divContents = usePdfContent();

  const marksMap = {
    mcq: 1,
    blank: 1,
    truefalse: 1,
    onetwo: 2,
    short: 3,
    long: 5,
    default: 0,
  };

  const MAX_PAGE_HEIGHT = 1123;
  const HEADER_HEIGHT = Math.floor(MAX_PAGE_HEIGHT * 0.21);

  const questionPages = splitQuestionsIntoPages(
    localQuestions,
    MAX_PAGE_HEIGHT,
    HEADER_HEIGHT
  );

  useEffect(() => {
    setLocalQuestions(questions);
  }, [questions]);

  const handleQuestionClick = (question) => {
    setSelectedQuestion(question);
    setQuestionType(question.type);
    setIsModalOpen(true);
  };

  const handleSavePaper = async () => {
    const logoFile = document.getElementById("logo-upload");
    await savePaper(user, divContents, logoFile, "default");
  };

  return (
    <div className="flex flex-col gap-10 w-full justify-center items-center min-h-screen relative md:p-0">
      <div className="fixed top-[50dvh] right-[1dvh] md:right-[10dvh] flex gap-2 flex-col">
        <Button
          text="Save Paper"
          icon={FileText}
          onClick={handleSavePaper}
          color="bg-green-600"
        />
        <Button
          text="Download"
          icon={FileDown}
          onClick={() => {
            const pdfPages = document.querySelectorAll("[id^=pdf-content-]");
            downloadPDF(pdfPages);
          }}
          color="bg-blue-600"
        />
      </div>
      <input className="hidden" type="file" id="logo-upload" accept="image/*" />

      {!loading &&
        !error &&
        questionPages.map((pageQuestions, pageIndex) => (
          <div
            key={pageIndex}
            id={`pdf-content-${pageIndex}`}
            className="w-full max-w-[794px] md:h-[1123px] bg-white shadow-lg rounded-lg border relative md:p-6"
          >
            {pageIndex === 0 && (
              <HeaderCard header={header} disableHover={true} disableStyles />
            )}
            <div className="px-6 md:px-6 py-2">
              <div className="rounded-lg px-6 md:px-6">
                {pageQuestions.reduce((acc, q, index) => {
                  const typeCounts = pageQuestions.reduce((acc, q) => {
                    acc[q.type] = (acc[q.type] || 0) + 1;
                    return acc;
                  }, {});

                  if (index === 0 || q.type !== pageQuestions[index - 1].type) {
                    const count = typeCounts[q.type] || 0;
                    const marksPerQuestion =
                      marksMap[q.type] ?? marksMap.default;
                    const totalMarks = count * marksPerQuestion;

                    acc.push(
                      <div
                        key={`heading-${q.type}-${pageIndex}`}
                        className="flex justify-between items-center mt-1 mb-2"
                      >
                        <h3
                          key={`heading-${q.type}-${pageIndex}`}
                          className="text-base md:text-lg font-bold mt-1 mb-2 text-black"
                        >
                          {q.type === "mcq"
                            ? "A) Multiple Choice Questions"
                            : q.type === "blank"
                            ? "B) Fill in the Blanks"
                            : q.type === "onetwo"
                            ? "C) One or Two Word Answers"
                            : q.type === "short"
                            ? "D) Short Answer Questions"
                            : q.type === "long"
                            ? "E) Long Answer Questions"
                            : "F) Other Questions"}
                        </h3>
                        <span className="text-sm font-medium text-gray-700">
                          Marks: {totalMarks}
                        </span>
                      </div>
                    );
                  }

                  acc.push(
                    <div key={q.question_id || index}>
                      <p
                        id={q.type}
                        className="cursor-pointer p-3 border-b last:border-none hover:bg-gray-100 transition"
                        onClick={() => handleQuestionClick(q)}
                      >
                        {q.number}. {q.question}
                      </p>
                      {q.type === "mcq" && q.options && (
                        <ol className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-5 text-gray-600 text-sm md:text-base">
                          {q.options.map((option, i) => (
                            <li key={i} className="flex items-start">
                              <span className="font-mono mr-2">
                                ({String.fromCharCode(65 + i)})
                              </span>
                              <span>{option}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  );

                  return acc;
                }, [])}
              </div>

              {isModalOpen && (
                <QuestionModal
                  questionType={questionType}
                  selectedQuestion={selectedQuestion}
                  setLocalQuestions={setLocalQuestions}
                  setIsModalOpen={setIsModalOpen}
                />
              )}
            </div>
          </div>
        ))}
    </div>
  );
};

export default PdfPreview;
