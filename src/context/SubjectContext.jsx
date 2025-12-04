// src/context/SubjectContext.js
import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../services/apiClient"; // ✅ Using centralized API client

const SubjectContext = createContext();

export const SubjectProvider = ({ children }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await apiClient.get("/subjects"); // ✅ Cleaner call
        setSubjects(response.data);
      } catch (err) {
        console.error("Error fetching subjects:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  return (
    <SubjectContext.Provider value={{ subjects, loading, error }}>
      {children}
    </SubjectContext.Provider>
  );
};

export const useSubjects = () => useContext(SubjectContext);
