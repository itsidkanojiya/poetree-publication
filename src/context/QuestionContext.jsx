import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../services/apiClient";

const QuestionContext = createContext();

export const useQuestionContext = () => useContext(QuestionContext);

export const QuestionProvider = ({ children }) => {
  const [questionData, setQuestionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQuestions = async (filters = {}) => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.subject_id && filters.subject_id.length > 0) {
        params.append('subject_id', filters.subject_id.join(','));
      }
      if (filters.subject_title_id && filters.subject_title_id.length > 0) {
        params.append('subject_title_id', filters.subject_title_id.join(','));
      }
      if (filters.standard) {
        params.append('standard', Array.isArray(filters.standard) 
          ? filters.standard.join(',') 
          : filters.standard);
      }
      if (filters.board_id) {
        params.append('board_id', Array.isArray(filters.board_id) 
          ? filters.board_id.join(',') 
          : filters.board_id);
      }
      if (filters.type) {
        params.append('type', Array.isArray(filters.type) 
          ? filters.type.join(',') 
          : filters.type);
      }
      if (filters.marks) {
        params.append('marks', Array.isArray(filters.marks) 
          ? filters.marks.join(',') 
          : filters.marks);
      }

      const queryString = params.toString();
      const url = queryString ? `/question?${queryString}` : '/question';
      
      const response = await apiClient.get(url);
      
      // Handle both old format (array) and new format (object with questions array)
      const questions = response.data?.questions || response.data || [];
      setQuestionData(questions);
      setError(null);
    } catch (err) {
      setError("Failed to fetch questions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Removed automatic fetch to avoid duplicate API calls
  // Components should call fetchQuestions() explicitly when needed
  // CustomPaper makes its own filtered API calls and doesn't use this context

  return (
    <QuestionContext.Provider 
      value={{ 
        questionData, 
        loading, 
        error, 
        refetch: fetchQuestions,
        fetchQuestions: fetchQuestions 
      }}
    >
      {children}
    </QuestionContext.Provider>
  );
};
