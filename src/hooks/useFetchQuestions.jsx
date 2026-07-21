import { useEffect, useState } from "react";
import { useQuestionContext } from "../context/QuestionContext";
import { ALL_TYPE_KEYS, normalizeTypeKey } from "../utils/questionTypes";

/**
 * How many of each type the readymade sample pulls. Ordered by the registry, so the
 * output order stays stable as types are added.
 *
 * Types absent here (or 0) are deliberately excluded: this hook has NO subject
 * context, so the language-specific types (synonyms/antonyms/…) must not leak into a
 * generic sample — they are only valid on Gujarati/Hindi/Sanskrit papers.
 */
const SAMPLE_CAPS = {
  mcq: 5,
  blank: 6,
  onetwo: 2,
  short: 2,
  long: 4,
};

const useFetchQuestions = () => {
  const { questionData, loading, error } = useQuestionContext();
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (!questionData || questionData.length === 0) return;

    const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);
    const shuffled = shuffleArray(questionData);

    const picked = ALL_TYPE_KEYS.flatMap((key) => {
      const cap = SAMPLE_CAPS[key] || 0;
      if (!cap) return [];
      const pool = shuffled.filter((q) => normalizeTypeKey(q.type) === key);
      return shuffleArray(pool).slice(0, cap);
    });

    setQuestions(picked);
  }, [questionData]);

  return { questions, loading, error };
};

export default useFetchQuestions;
