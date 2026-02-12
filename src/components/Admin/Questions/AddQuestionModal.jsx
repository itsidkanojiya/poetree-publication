import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { addQuestion, editQuestion, getAllSubjects, getAllBoards, getSubjectTitlesBySubject } from "../../../services/adminService";
import Toast from "../../Common/Toast";

const AddQuestionModal = ({ questionType, question, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    type: questionType,
    board_id: "",
    standard: "",
    question: "",
    answer: "",
    options: "",
    solution: "",
    subject_id: "",
    subject_title_id: "",
    marks: "",
    image: null,
  });
  const [subjects, setSubjects] = useState([]);
  const [boards, setBoards] = useState([]);
  const [subjectTitles, setSubjectTitles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });

  // For Passage and Match types
  const [passageQuestions, setPassageQuestions] = useState([{ question: "", answer: "" }]);
  const [matchPairs, setMatchPairs] = useState({ left: [""], right: [""] });

  // For MCQ: option list (frontend only); formData.options/answer still sent as JSON array + 1-based index
  const [mcqOptionList, setMcqOptionList] = useState(["", "", "", ""]);

  useEffect(() => {
    fetchInitialData();
    if (question) {
      loadQuestionData();
    } else if (questionType === "mcq") {
      setMcqOptionList(["", "", "", ""]);
    }
  }, [question, questionType]);

  // When subject_id is set (e.g. after loadQuestionData or user selection), fetch subject titles
  useEffect(() => {
    if (!formData.subject_id) {
      setSubjectTitles([]);
      return;
    }
    let cancelled = false;
    getSubjectTitlesBySubject(formData.subject_id)
      .then((titlesData) => {
        if (!cancelled) setSubjectTitles(Array.isArray(titlesData) ? titlesData : []);
      })
      .catch((err) => {
        if (!cancelled) console.error("Error fetching subject titles:", err);
      });
    return () => { cancelled = true; };
  }, [formData.subject_id]);

  const fetchInitialData = async () => {
    try {
      const [subjectsData, boardsData] = await Promise.all([
        getAllSubjects(),
        getAllBoards(),
      ]);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      setBoards(Array.isArray(boardsData) ? boardsData : []);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const loadQuestionData = () => {
    if (!question) return;
    setFormData({
      type: question.type || questionType,
      board_id: question.board_id || "",
      standard: question.standard || "",
      question: question.question || "",
      answer: question.answer || "",
      options: Array.isArray(question.options) ? JSON.stringify(question.options) : question.options || "",
      solution: question.solution || "",
      subject_id: question.subject_id || "",
      subject_title_id: question.subject_title_id || "",
      marks: question.marks || "",
      image: null,
    });

    // Handle Passage type
    if (questionType === "passage" && question.options) {
      try {
        const parsed = Array.isArray(question.options) ? question.options : JSON.parse(question.options);
        setPassageQuestions(parsed);
      } catch (e) {
        console.error("Error parsing passage questions:", e);
      }
    }

    // Handle Match type
    if (questionType === "match" && question.options) {
      try {
        const parsed = typeof question.options === "string" ? JSON.parse(question.options) : question.options;
        setMatchPairs(parsed);
      } catch (e) {
        console.error("Error parsing match pairs:", e);
      }
    }

    if (questionType === "mcq" && question.options) {
      try {
        const opts = Array.isArray(question.options)
          ? question.options
          : JSON.parse(question.options || "[]");
        setMcqOptionList(Array.isArray(opts) && opts.length > 0 ? opts : ["", "", "", ""]);
      } catch (e) {
        setMcqOptionList(["", "", "", ""]);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setFormData((prev) => ({ ...prev, image: files[0] || null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    setFormData((prev) => ({ ...prev, subject_id: subjectId, subject_title_id: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const formDataToSend = new FormData();

      // Add common fields
      formDataToSend.append("type", formData.type);
      if (formData.board_id) formDataToSend.append("board_id", formData.board_id);
      if (formData.standard) formDataToSend.append("standard", formData.standard);
      formDataToSend.append("question", formData.question);
      if (formData.solution) formDataToSend.append("solution", formData.solution);
      if (formData.subject_id) formDataToSend.append("subject_id", formData.subject_id);
      if (formData.subject_title_id) formDataToSend.append("subject_title_id", formData.subject_title_id);
      if (formData.marks) formDataToSend.append("marks", formData.marks);
      if (formData.image) formDataToSend.append("image", formData.image);

      // Handle type-specific fields
      if (questionType === "mcq") {
        const optionsArray = mcqOptionList.map((o) => (o && o.trim()) || "").filter(Boolean);
        formDataToSend.append("options", JSON.stringify(optionsArray));
        formDataToSend.append("answer", formData.answer);
      } else if (questionType === "passage") {
        formDataToSend.append("options", JSON.stringify(passageQuestions));
        formDataToSend.append("answer", JSON.stringify(
          passageQuestions.reduce((acc, q, idx) => {
            acc[`q${idx + 1}`] = q.answer;
            return acc;
          }, {})
        ));
      } else if (questionType === "match") {
        formDataToSend.append("options", JSON.stringify(matchPairs));
        // Match answer format: {"A": "1", "B": "2"}
        const matchAnswer = {};
        matchPairs.left.forEach((left, idx) => {
          if (left.trim()) {
            const letter = String.fromCharCode(65 + idx); // A, B, C...
            matchAnswer[letter] = String(idx + 1);
          }
        });
        formDataToSend.append("answer", JSON.stringify(matchAnswer));
      } else {
        formDataToSend.append("answer", formData.answer);
        if (formData.options) formDataToSend.append("options", formData.options);
      }

      if (question) {
        await editQuestion(question.question_id, formDataToSend);
        setToast({ show: true, message: "Question updated successfully", type: "success" });
      } else {
        await addQuestion(formDataToSend);
        setToast({ show: true, message: "Question added successfully", type: "success" });
      }

      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to save question",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.question.trim()) newErrors.question = "Question is required";
    if (!formData.answer && questionType !== "passage" && questionType !== "match") {
      newErrors.answer = "Answer is required";
    }
    if (questionType === "mcq") {
      const validOptions = mcqOptionList.map((o) => (o && o.trim()) || "").filter(Boolean);
      if (validOptions.length === 0) newErrors.options = "At least one option is required";
      if (!formData.answer) newErrors.answer = "Please select the correct answer";
      if (formData.answer && validOptions.length > 0) {
        const idx = Number(formData.answer);
        if (idx < 1 || idx > validOptions.length) newErrors.answer = "Correct answer must be one of the options";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addPassageQuestion = () => {
    setPassageQuestions([...passageQuestions, { question: "", answer: "" }]);
  };

  const removePassageQuestion = (index) => {
    setPassageQuestions(passageQuestions.filter((_, i) => i !== index));
  };

  const updatePassageQuestion = (index, field, value) => {
    const updated = [...passageQuestions];
    updated[index][field] = value;
    setPassageQuestions(updated);
  };

  const updateMcqOption = (index, value) => {
    setMcqOptionList((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addMcqOption = () => {
    setMcqOptionList((prev) => (prev.length >= 4 ? prev : [...prev, ""]));
  };

  const removeMcqOption = (index) => {
    setMcqOptionList((prev) => prev.filter((_, i) => i !== index));
    const oneBased = Number(formData.answer);
    if (!oneBased) return;
    if (oneBased === index + 1) {
      setFormData((prev) => ({ ...prev, answer: "" }));
    } else if (oneBased > index + 1) {
      setFormData((prev) => ({ ...prev, answer: String(oneBased - 1) }));
    }
  };

  const addMatchItem = (side) => {
    setMatchPairs({
      ...matchPairs,
      [side]: [...matchPairs[side], ""],
    });
  };

  const removeMatchItem = (side, index) => {
    setMatchPairs({
      ...matchPairs,
      [side]: matchPairs[side].filter((_, i) => i !== index),
    });
  };

  const updateMatchItem = (side, index, value) => {
    const updated = { ...matchPairs };
    updated[side][index] = value;
    setMatchPairs(updated);
  };

  return (
    <>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl p-6 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">
              {question ? "Edit" : "Add"} {questionType.toUpperCase()} Question
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Board
                </label>
                <select
                  name="board_id"
                  value={formData.board_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                >
                  <option value="">Select Board</option>
                  {boards.map((board) => (
                    <option key={board.board_id} value={board.board_id}>
                      {board.board_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Standard <span className="text-red-500">*</span>
                </label>
                <select
                  name="standard"
                  value={formData.standard}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                  required
                >
                  <option value="">Select Standard</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((std) => (
                    <option key={std} value={std}>
                      {std}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject
                </label>
                <select
                  name="subject_id"
                  value={formData.subject_id}
                  onChange={handleSubjectChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.subject_id} value={subject.subject_id}>
                      {subject.subject_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject Title
                </label>
                <select
                  name="subject_title_id"
                  value={formData.subject_title_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                >
                  <option value="">Select Subject Title</option>
                  {subjectTitles.map((st) => (
                    <option key={st.subject_title_id} value={st.subject_title_id}>
                      {st.subject_title_name ?? st.title_name ?? st.name ?? `Title ${st.subject_title_id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Marks
                </label>
                <input
                  type="number"
                  name="marks"
                  value={formData.marks}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                  placeholder="e.g., 1"
                />
              </div>
            </div>

            {/* Question Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Question <span className="text-red-500">*</span>
              </label>
              <textarea
                name="question"
                value={formData.question}
                onChange={handleChange}
                rows={questionType === "passage" ? 6 : 3}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 transition outline-none ${
                  errors.question ? "border-red-300" : "border-gray-200 focus:border-blue-500"
                }`}
                placeholder="Enter the question"
                required
              />
              {errors.question && (
                <p className="mt-1 text-sm text-red-600">{errors.question}</p>
              )}
            </div>

            {/* Type-specific fields */}
            {questionType === "mcq" && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Options <span className="text-red-500">*</span>
                  </label>
                  <p className="mb-2 text-sm text-gray-500">
                    Add up to 4 options; select which one is the correct answer.
                  </p>
                  {mcqOptionList.map((opt, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateMcqOption(index, e.target.value)}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                        placeholder={`Option ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeMcqOption(index)}
                        disabled={mcqOptionList.length <= 1}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                        title="Remove option"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addMcqOption}
                    disabled={mcqOptionList.length >= 4}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Add option
                  </button>
                  {mcqOptionList.length >= 4 && (
                    <span className="ml-2 text-xs text-gray-500">(max 4 options)</span>
                  )}
                  {errors.options && (
                    <p className="mt-1 text-sm text-red-600">{errors.options}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Correct Answer <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="answer"
                    value={formData.answer}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 transition outline-none ${
                      errors.answer ? "border-red-300" : "border-gray-200 focus:border-blue-500"
                    }`}
                  >
                    <option value="">Select correct option</option>
                    {mcqOptionList
                      .map((o, i) => (o && o.trim()) || "")
                      .filter(Boolean)
                      .map((label, i) => (
                        <option key={i} value={String(i + 1)}>
                          Option {i + 1}: {label.length > 50 ? label.slice(0, 50) + "…" : label}
                        </option>
                      ))}
                  </select>
                  {errors.answer && (
                    <p className="mt-1 text-sm text-red-600">{errors.answer}</p>
                  )}
                </div>
              </>
            )}

            {questionType === "passage" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Passage Questions <span className="text-red-500">*</span>
                </label>
                {passageQuestions.map((pq, index) => (
                  <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">Question {index + 1}</span>
                      {passageQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePassageQuestion(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={pq.question}
                      onChange={(e) => updatePassageQuestion(index, "question", e.target.value)}
                      placeholder="Question"
                      className="w-full mb-2 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500"
                    />
                    <input
                      type="text"
                      value={pq.answer}
                      onChange={(e) => updatePassageQuestion(index, "answer", e.target.value)}
                      placeholder="Answer"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPassageQuestion}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </button>
              </div>
            )}

            {questionType === "match" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Match Pairs <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Left Column</span>
                      <button
                        type="button"
                        onClick={() => addMatchItem("left")}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {matchPairs.left.map((item, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateMatchItem("left", index, e.target.value)}
                          placeholder={`Left item ${index + 1}`}
                          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500"
                        />
                        {matchPairs.left.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMatchItem("left", index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Right Column</span>
                      <button
                        type="button"
                        onClick={() => addMatchItem("right")}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {matchPairs.right.map((item, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateMatchItem("right", index, e.target.value)}
                          placeholder={`Right item ${index + 1}`}
                          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500"
                        />
                        {matchPairs.right.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMatchItem("right", index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!["mcq", "passage", "match"].includes(questionType) && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Answer <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="answer"
                  value={formData.answer}
                  onChange={handleChange}
                  rows={questionType === "long" ? 4 : 2}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 transition outline-none ${
                    errors.answer ? "border-red-300" : "border-gray-200 focus:border-blue-500"
                  }`}
                  placeholder="Enter the answer"
                  required
                />
                {errors.answer && (
                  <p className="mt-1 text-sm text-red-600">{errors.answer}</p>
                )}
              </div>
            )}

            {/* Solution */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Solution (Optional)
              </label>
              <textarea
                name="solution"
                value={formData.solution}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                placeholder="Enter solution or explanation"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Image (Optional)
              </label>
              <input
                type="file"
                name="image"
                onChange={handleChange}
                accept="image/*"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition font-semibold disabled:opacity-50"
              >
                {loading ? "Saving..." : question ? "Update Question" : "Add Question"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddQuestionModal;

