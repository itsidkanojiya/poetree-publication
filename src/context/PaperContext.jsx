import { createContext, useState, useContext, useEffect } from "react";
import {
  getAllPapers,
  addNewPaper,
  getPapersByUserId,
  deletePaperById,
} from "../services/paperService";
import { useAuth } from "../context/AuthContext";

const PaperContext = createContext();

export const PaperProvider = ({ children }) => {
  const { user } = useAuth();
  const [papers, setPapers] = useState({papers:[]});

  useEffect(() => {
    if (user && user.id) {
      const fetchPapers = async () => {
        try {
          const data = await getPapersByUserId(user.id);
          setPapers(data);
        } catch (error) {
          console.error("Error fetching papers:", error);
        }
      };

      fetchPapers();
    }
  }, [user]);

  const deletePaper = async (id) => {
    try {
      const response = await deletePaperById(id);
  
      if (response.success) {
        setPapers((prevPapers) => ({
          ...prevPapers,
          papers: prevPapers.papers.filter((paper) => paper.id !== id),
        }));
        alert("Paper deleted successfully");
      } else {
        alert(response.message || "Failed to delete paper");
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "An error occurred while deleting the paper");
    }
  };
  

  return (
    <PaperContext.Provider value={{ papers, deletePaper }}>
      {children}
    </PaperContext.Provider>
  );
};

// Custom hook to use PaperContext
export const usePaper = () => {
  return useContext(PaperContext);
};
