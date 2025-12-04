import { useEffect, useState } from "react";
import apiClient from "../services/apiClient";

const useFetchFilteredQuestions = (questionType) => {
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!questionType) return;
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get(
          `/question?type=${questionType}`
        );
        setFilteredQuestions(response.data);
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [questionType]);

  return { filteredQuestions, loading, error };
};

export default useFetchFilteredQuestions;
