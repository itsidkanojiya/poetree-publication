import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMyApprovedSelections } from "../services/userService";
import { useAuth } from "./AuthContext";

const STORAGE_KEY = "userTeachingContext";

const UserTeachingContext = createContext();

const getStoredContext = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const saveStoredContext = (value) => {
  if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  else localStorage.removeItem(STORAGE_KEY);
};

export const UserTeachingProvider = ({ children }) => {
  const { user } = useAuth();
  const [contextSelection, setContextSelectionState] = useState(null);
  const [approvedSelections, setApprovedSelections] = useState({ subjects: [], subject_titles: [] });
  const [loading, setLoading] = useState(true);
  const [needsContextChoice, setNeedsContextChoice] = useState(false);

  const setContextSelection = useCallback((selection) => {
    setContextSelectionState(selection);
    saveStoredContext(selection);
    setNeedsContextChoice(false);
  }, []);

  const clearContext = useCallback(() => {
    setContextSelectionState(null);
    saveStoredContext(null);
    setNeedsContextChoice(true);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setNeedsContextChoice(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const data = await getMyApprovedSelections();
        const approved = data?.approved_selections || {};
        const subjects = Array.isArray(approved.subjects) ? approved.subjects : [];
        const subject_titles = Array.isArray(approved.subject_titles) ? approved.subject_titles : [];

        if (!cancelled) {
          setApprovedSelections({ subjects, subject_titles });
        }

        const stored = getStoredContext();
        if (!stored || !stored.subject_id || !stored.subject_title_id || stored.standard == null || !stored.board_id) {
          if (!cancelled) setNeedsContextChoice(true);
          if (!cancelled) setContextSelectionState(null);
          if (!cancelled) setLoading(false);
          return;
        }

        const approvedSubjectIds = new Set(
          subjects.map((s) => s.subject_id ?? s.subject?.subject_id ?? s.id).filter(Boolean)
        );
        const approvedTitleIds = new Set(
          subject_titles.map((t) => t.subject_title_id ?? t.id).filter(Boolean)
        );
        const subjectIdMatch = approvedSubjectIds.has(Number(stored.subject_id)) || approvedSubjectIds.has(stored.subject_id);
        const titleIdMatch = approvedTitleIds.has(Number(stored.subject_title_id)) || approvedTitleIds.has(stored.subject_title_id);
        const valid = subjectIdMatch && titleIdMatch;

        if (!cancelled) {
          if (valid) {
            setContextSelectionState(stored);
            setNeedsContextChoice(false);
          } else {
            saveStoredContext(null);
            setContextSelectionState(null);
            setNeedsContextChoice(true);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setApprovedSelections({ subjects: [], subject_titles: [] });
          setNeedsContextChoice(true);
          setContextSelectionState(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [user?.id]);

  const value = {
    contextSelection,
    setContextSelection: setContextSelection,
    clearContext,
    approvedSelections,
    needsContextChoice,
    setNeedsContextChoice,
    loading,
  };

  return (
    <UserTeachingContext.Provider value={value}>
      {children}
    </UserTeachingContext.Provider>
  );
};

export const useUserTeaching = () => {
  const ctx = useContext(UserTeachingContext);
  if (!ctx) throw new Error("useUserTeaching must be used within UserTeachingProvider");
  return ctx;
};
