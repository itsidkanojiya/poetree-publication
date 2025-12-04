import React, { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import parse from "html-react-parser";
// import QuestionModal from "../Common/Modals/QuestionModel";
import Button from "../Common/Buttons/Button";
import { FileDown } from "lucide-react";
import downloadPDF from "../../utils/downloadPdf";

const ViewPaperPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const paperBody =
    location.state?.paperBody || "<h1>No Content Available</h1>";

  // const parsedContent = parse(paperBody);
  const [questionType, setQuestionType] = useState("");
  const [content, setContent] = useState(
    Array.isArray(parse(paperBody)) ? parse(paperBody) : [parse(paperBody)]
  );

  // const [selectedElement, setSelectedElement] = useState(null);
  // const [isModalOpen, setIsModalOpen] = useState(false);
  // const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);
  // const [selectedQuestion, setSelectedQuestion] = useState(null);

  // const convertHTMLToQuestionArray = (htmlString) => {
  //   const parser = new DOMParser();
  //   const doc = parser.parseFromString(htmlString, "text/html");

  //   const questionElements = doc.querySelectorAll("p[id]");

  //   const questions = Array.from(questionElements).map((el, index) => ({
  //     qIndex: index + 1,
  //     question: el.innerHTML.trim(),
  //     type: el.id,
  //   }));

  //   return questions;
  // };

  // const [questions, setQuestions] = useState(() =>
  //   convertHTMLToQuestionArray(paperBody)
  // );

  // console.log(questions);

  // const handleQuestionClick = (questions, event) => {
  //   const clickedElement = event.target;
  //   // console.log(clickedElement);

  //   // Ensure clickedElement is a paragraph or expected tag
  //   if (clickedElement.tagName === "P" || clickedElement.tagName === "DIV") {
  //     setSelectedQuestionIndex(questions.qIndex);
  //     setQuestionType(clickedElement.id);
  //     setSelectedElement(clickedElement);
  //     setIsModalOpen(true);
  //   }
  // };

  return (
    <div className="w-full flex flex-col items-center min-h-screen py-10">
      <Button
        text="Download"
        icon={FileDown}
        onClick={() => {
          const pdfPages = document.querySelectorAll("[id^=pdf-content-]");
          downloadPDF(pdfPages);
        }}
        color="bg-blue-600"
      />
      <div className="w-[850px] min-h-[1000px] p-10 rounded-lg">
        {content.map((section, index) => (
          <div key={index} className="mb-6 border-b pb-4 last:border-none">
            <div
              className="cursor-pointer"
              data-question-type={questionType}
              onClick={(event) => handleQuestionClick(index, event)}
            >
              {section}
            </div>
          </div>
        ))}
      </div>

      {/* {isModalOpen && (
        <QuestionModal
          questionType={questionType}
          selectedQuestion={{
            question_id: selectedQuestionIndex,
            question: selectedElement.innerHTML,
          }}
          setLocalQuestions={setQuestions}
          setIsModalOpen={setIsModalOpen}
        />
      )} */}
    </div>
  );
};

export default ViewPaperPage;
