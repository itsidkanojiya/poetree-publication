import { createContext, useState, useContext, useEffect, useCallback } from "react";
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
  const [loading, setLoading] = useState(false);

  const fetchPapers = useCallback(async () => {
    if (user?.id) {
      try {
        setLoading(true);
        const data = await getPapersByUserId(user.id);
        const list = Array.isArray(data) ? data : (data?.papers || []);
        setPapers({ papers: list });
      } catch (error) {
        console.error("Error fetching papers:", error);
        setPapers({ papers: [] });
      } finally {
        setLoading(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  const refreshPapers = useCallback(async () => {
    await fetchPapers();
  }, [fetchPapers]);

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
    <PaperContext.Provider value={{ papers, deletePaper, refreshPapers, loading }}>
      {children}
    </PaperContext.Provider>
  );
};

// Custom hook to use PaperContext
export const usePaper = () => {
  return useContext(PaperContext);
};
