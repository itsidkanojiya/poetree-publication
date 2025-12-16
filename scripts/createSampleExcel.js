import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

// Sample MCQ questions for Standard 10
// Note: Subject Title should match an existing subject title in your database
// You may need to update these values based on your actual data
const sampleQuestions = [
  {
    Question: "What is the chemical formula for water?",
    Option1: "H2O2",
    Option2: "H2O",
    Option3: "HO2",
    Option4: "H3O",
    Answer: "2",
    Subject: "Science",
    "Subject Title": "Chemistry", // Update this to match your subject titles
    Board: "CBSE",
    Standard: "10",
    Marks: "1",
    Solution: "Water is composed of two hydrogen atoms and one oxygen atom, hence H2O.",
    Image: "water_question.jpg"
  },
  {
    Question: "Which planet is known as the Red Planet?",
    Option1: "Venus",
    Option2: "Mars",
    Option3: "Jupiter",
    Option4: "Saturn",
    Answer: "2",
    Subject: "Science",
    "Subject Title": "Physics", // Update this to match your subject titles
    Board: "CBSE",
    Standard: "10",
    Marks: "1",
    Solution: "Mars is called the Red Planet due to iron oxide on its surface.",
    Image: "mars_question.jpg"
  },
  {
    Question: "What is the capital of India?",
    Option1: "Mumbai",
    Option2: "Kolkata",
    Option3: "New Delhi",
    Option4: "Chennai",
    Answer: "3",
    Subject: "Social Studies",
    "Subject Title": "History", // Update this to match your subject titles
    Board: "CBSE",
    Standard: "10",
    Marks: "1",
    Solution: "New Delhi is the capital city of India.",
    Image: "capital_question.jpg"
  },
  {
    Question: "Who wrote the novel 'Pride and Prejudice'?",
    Option1: "Charles Dickens",
    Option2: "Jane Austen",
    Option3: "William Shakespeare",
    Option4: "Mark Twain",
    Answer: "2",
    Subject: "English",
    "Subject Title": "Literature", // Update this to match your subject titles
    Board: "CBSE",
    Standard: "10",
    Marks: "1",
    Solution: "Jane Austen wrote Pride and Prejudice in 1813.",
    Image: "book_question.jpg"
  },
  {
    Question: "What is the value of π (pi) approximately?",
    Option1: "2.14",
    Option2: "3.14",
    Option3: "4.14",
    Option4: "5.14",
    Answer: "2",
    Subject: "Mathematics",
    "Subject Title": "Algebra", // Update this to match your subject titles
    Board: "CBSE",
    Standard: "10",
    Marks: "1",
    Solution: "Pi (π) is approximately 3.14159, commonly rounded to 3.14.",
    Image: "pi_question.jpg"
  },
  {
    Question: "Which gas do plants absorb from the atmosphere during photosynthesis?",
    Option1: "Oxygen",
    Option2: "Nitrogen",
    Option3: "Carbon Dioxide",
    Option4: "Hydrogen",
    Answer: "3",
    Subject: "Science",
    "Subject Title": "Biology", // Update this to match your subject titles
    Board: "CBSE",
    Standard: "10",
    Marks: "1",
    Solution: "Plants absorb carbon dioxide (CO2) from the atmosphere during photosynthesis.",
    Image: "photosynthesis_question.jpg"
  },
  {
    Question: "What is the largest organ in the human body?",
    Option1: "Liver",
    Option2: "Lungs",
    Option3: "Skin",
    Option4: "Heart",
    Answer: "3",
    Subject: "Science",
    "Subject Title": "Biology", // Update this to match your subject titles
    Board: "CBSE",
    Standard: "10",
    Marks: "1",
    Solution: "The skin is the largest organ, covering the entire body surface.",
    Image: "organ_question.jpg"
  },
  {
    Question: "In which year did India gain independence?",
    Option1: "1945",
    Option2: "1946",
    Option3: "1947",
    Option4: "1948",
    Answer: "3",
    Subject: "Social Studies",
    "Subject Title": "History", // Update this to match your subject titles
    Board: "CBSE",
    Standard: "10",
    Marks: "1",
    Solution: "India gained independence from British rule on August 15, 1947.",
    Image: "independence_question.jpg"
  },
  {
    Question: "What is the square root of 144?",
    Option1: "10",
    Option2: "11",
    Option3: "12",
    Option4: "13",
    Answer: "3",
    Subject: "Mathematics",
    "Subject Title": "Algebra", // Update this to match your subject titles
    Board: "CBSE",
    Standard: "10",
    Marks: "1",
    Solution: "12 × 12 = 144, so the square root of 144 is 12.",
    Image: "math_question.jpg"
  },
  {
    Question: "Which is the longest river in India?",
    Option1: "Yamuna",
    Option2: "Ganga",
    Option3: "Godavari",
    Option4: "Brahmaputra",
    Answer: "2",
    Subject: "Social Studies",
    "Subject Title": "Geography", // Update this to match your subject titles
    Board: "CBSE",
    Standard: "10",
    Marks: "1",
    Solution: "The Ganga (Ganges) is the longest river in India, flowing for about 2,525 km.",
    Image: "river_question.jpg"
  }
];

// Create workbook and worksheet
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(sampleQuestions);

// Set column widths
worksheet['!cols'] = [
  { wch: 50 }, // Question
  { wch: 15 }, // Option1
  { wch: 15 }, // Option2
  { wch: 15 }, // Option3
  { wch: 15 }, // Option4
  { wch: 10 }, // Answer
  { wch: 15 }, // Subject
  { wch: 10 }, // Board
  { wch: 10 }, // Standard
  { wch: 10 }, // Marks
  { wch: 50 }, // Solution
  { wch: 20 }, // Image
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");

// Write to file
const outputPath = path.join(process.cwd(), "public", "sample_questions_std10.xlsx");
XLSX.writeFile(workbook, outputPath);

console.log(`✅ Sample Excel file created at: ${outputPath}`);
console.log(`📊 Total questions: ${sampleQuestions.length}`);
console.log(`📝 Format: MCQ questions for Standard 10`);

