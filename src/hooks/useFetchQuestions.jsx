import { useEffect, useState } from "react";
import { useQuestionContext } from "../context/QuestionContext";

const useFetchQuestions = () => {
  const { questionData, loading, error } = useQuestionContext();
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (!questionData || questionData.length === 0) return;

    const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

    const shuffled = shuffleArray(questionData);

    const formattedQuestions = {
      mcq: shuffleArray(shuffled.filter((q) => q.type === "mcq")).slice(0, 5),
      blank: shuffleArray(shuffled.filter((q) => q.type === "blank")).slice(0, 6),
      // truefalse: shuffleArray(shuffled.filter((q) => q.type === "truefalse")).slice(0, 1),
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

  return { questions, loading, error };
};

export default useFetchQuestions;
