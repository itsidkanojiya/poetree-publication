import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

// Sample Passage questions for Standard 10
const samplePassageQuestions = [
  {
    Passage: "The water cycle, also known as the hydrological cycle, describes the continuous movement of water on, above, and below the surface of the Earth. Water evaporates from oceans, lakes, and rivers, rises into the atmosphere, condenses to form clouds, and falls back to Earth as precipitation.",
    "Passage Questions": "What is another name for the water cycle?,What happens to water when it evaporates?,What forms when water vapor condenses?",
    "Passage Answers": "Hydrological cycle,Rises into the atmosphere,Clouds",
    Question: "Read the passage and answer the following questions.",
    Answer: "",
    Solution: "The passage explains the water cycle process from evaporation to precipitation.",
    Subject: "Science",
    "Subject Title": "Chemistry",
    Board: "CBSE",
    Standard: "10",
    Marks: "5",
    Image: "water_cycle_passage.jpg"
  },
  {
    Passage: "Photosynthesis is the process by which plants convert light energy into chemical energy. During this process, plants use carbon dioxide from the air and water from the soil to produce glucose and oxygen. This process occurs in the chloroplasts of plant cells.",
    "Passage Questions": "What do plants convert during photosynthesis?,Where does photosynthesis occur in plant cells?,What are the products of photosynthesis?",
    "Passage Answers": "Light energy into chemical energy,In chloroplasts,Glucose and oxygen",
    Question: "Based on the passage, answer the questions below.",
    Answer: "",
    Solution: "Photosynthesis is essential for plant growth and produces oxygen for living organisms.",
    Subject: "Science",
    "Subject Title": "Biology",
    Board: "CBSE",
    Standard: "10",
    Marks: "5",
    Image: "photosynthesis_passage.jpg"
  },
  {
    Passage: "The Indian Independence Movement was a series of historic events that led to India's freedom from British colonial rule. Key leaders like Mahatma Gandhi, Jawaharlal Nehru, and Subhas Chandra Bose played crucial roles. The movement used both non-violent protests and armed resistance to achieve independence in 1947.",
    "Passage Questions": "When did India gain independence?,Name two key leaders of the independence movement.,What methods were used in the independence movement?",
    "Passage Answers": "1947,Mahatma Gandhi and Jawaharlal Nehru,Non-violent protests and armed resistance",
    Question: "Read the passage and answer the following questions about India's independence.",
    Answer: "",
    Solution: "The Indian independence movement was a significant historical event that shaped modern India.",
    Subject: "Social Studies",
    "Subject Title": "History",
    Board: "CBSE",
    Standard: "10",
    Marks: "5",
    Image: "independence_passage.jpg"
  },
  {
    Passage: "Algebra is a branch of mathematics that uses symbols and letters to represent numbers and quantities in formulas and equations. It allows us to solve problems by finding unknown values. The basic operations in algebra include addition, subtraction, multiplication, and division of algebraic expressions.",
    "Passage Questions": "What does algebra use to represent numbers?,What is the main purpose of algebra?,Name the basic operations in algebra.",
    "Passage Answers": "Symbols and letters,To solve problems by finding unknown values,Addition, subtraction, multiplication, and division",
    Question: "Based on the passage about algebra, answer the questions.",
    Answer: "",
    Solution: "Algebra is fundamental to advanced mathematics and problem-solving.",
    Subject: "Mathematics",
    "Subject Title": "Algebra",
    Board: "CBSE",
    Standard: "10",
    Marks: "5",
    Image: "algebra_passage.jpg"
  },
  {
    Passage: "The human digestive system is responsible for breaking down food into nutrients that the body can use. It consists of several organs including the mouth, esophagus, stomach, small intestine, and large intestine. Each organ plays a specific role in the digestion process.",
    "Passage Questions": "What is the main function of the digestive system?,Name three organs in the digestive system.,Where does most nutrient absorption occur?",
    "Passage Answers": "Breaking down food into nutrients,Mouth, stomach, and small intestine,Small intestine",
    Question: "Read the passage about the digestive system and answer the questions.",
    Answer: "",
    Solution: "The digestive system is essential for converting food into energy and nutrients.",
    Subject: "Science",
    "Subject Title": "Biology",
    Board: "CBSE",
    Standard: "10",
    Marks: "5",
    Image: "digestive_passage.jpg"
  },
  {
    Passage: "Climate change refers to long-term changes in temperature and weather patterns. While climate change can occur naturally, human activities have been the main driver since the mid-20th century. Burning fossil fuels, deforestation, and industrial processes release greenhouse gases that trap heat in the atmosphere.",
    "Passage Questions": "What does climate change refer to?,What has been the main driver of climate change since the mid-20th century?,Name one human activity that contributes to climate change.",
    "Passage Answers": "Long-term changes in temperature and weather patterns,Human activities,Burning fossil fuels or deforestation or industrial processes",
    Question: "Based on the passage about climate change, answer the following questions.",
    Answer: "",
    Solution: "Understanding climate change is crucial for environmental conservation.",
    Subject: "Science",
    "Subject Title": "Chemistry",
    Board: "CBSE",
    Standard: "10",
    Marks: "5",
    Image: "climate_passage.jpg"
  },
  {
    Passage: "The solar system consists of the Sun and all the objects that orbit around it, including eight planets, their moons, asteroids, and comets. The four inner planets are rocky, while the four outer planets are gas giants. Earth is the third planet from the Sun and the only known planet with life.",
    "Passage Questions": "How many planets are in the solar system?,What are the inner planets made of?,Which planet is known to have life?",
    "Passage Answers": "Eight planets,Rocky,Earth",
    Question: "Read the passage about the solar system and answer the questions.",
    Answer: "",
    Solution: "The solar system is vast and contains many celestial objects.",
    Subject: "Science",
    "Subject Title": "Physics",
    Board: "CBSE",
    Standard: "10",
    Marks: "5",
    Image: "solar_system_passage.jpg"
  },
  {
    Passage: "The Renaissance was a period of cultural rebirth in Europe that began in Italy in the 14th century and spread throughout the continent. It marked a transition from the Middle Ages to the modern era, characterized by renewed interest in classical learning, art, and science. Famous figures like Leonardo da Vinci and Michelangelo emerged during this period.",
    "Passage Questions": "When and where did the Renaissance begin?,What marked the transition from the Middle Ages?,Name one famous figure from the Renaissance period.",
    "Passage Answers": "14th century in Italy,The Renaissance,Leonardo da Vinci or Michelangelo",
    Question: "Based on the passage about the Renaissance, answer the questions.",
    Answer: "",
    Solution: "The Renaissance was a pivotal period in European history and culture.",
    Subject: "Social Studies",
    "Subject Title": "History",
    Board: "CBSE",
    Standard: "10",
    Marks: "5",
    Image: "renaissance_passage.jpg"
  },
  {
    Passage: "Electricity is the flow of electric charge through a conductor. It can be generated from various sources including fossil fuels, nuclear power, solar energy, and wind power. Electrical circuits consist of a power source, conductors, and loads. Current, voltage, and resistance are the fundamental concepts in electricity.",
    "Passage Questions": "What is electricity?,Name two sources of electricity.,What are the fundamental concepts in electricity?",
    "Passage Answers": "The flow of electric charge through a conductor,Solar energy and wind power (or fossil fuels, nuclear power),Current, voltage, and resistance",
    Question: "Read the passage about electricity and answer the following questions.",
    Answer: "",
    Solution: "Electricity is essential for modern life and technology.",
    Subject: "Science",
    "Subject Title": "Physics",
    Board: "CBSE",
    Standard: "10",
    Marks: "5",
    Image: "electricity_passage.jpg"
  },
  {
    Passage: "The cell is the basic structural and functional unit of all living organisms. Cells can be classified into two main types: prokaryotic cells, which lack a nucleus, and eukaryotic cells, which have a well-defined nucleus. Plant and animal cells are examples of eukaryotic cells, each with unique structures and functions.",
    "Passage Questions": "What is the basic unit of all living organisms?,What is the difference between prokaryotic and eukaryotic cells?,Give an example of eukaryotic cells.",
    "Passage Answers": "The cell,Prokaryotic cells lack a nucleus while eukaryotic cells have a nucleus,Plant and animal cells",
    Question: "Based on the passage about cells, answer the questions below.",
    Answer: "",
    Solution: "Understanding cell structure is fundamental to biology.",
    Subject: "Science",
    "Subject Title": "Biology",
    Board: "CBSE",
    Standard: "10",
    Marks: "5",
    Image: "cell_passage.jpg"
  }
];

// Sample Match questions for Standard 10
const sampleMatchQuestions = [
  {
    "Left Items": "Delhi,Mumbai,Kolkata,Chennai",
    "Right Items": "Maharashtra,West Bengal,Tamil Nadu,Delhi",
    "Match Answers": "A:4,B:1,C:2,D:3",
    Question: "Match the following cities with their states:",
    Answer: "",
    Solution: "Match each city with its corresponding state.",
    Subject: "Social Studies",
    "Subject Title": "Geography",
    Board: "CBSE",
    Standard: "10",
    Marks: "4",
    Image: "cities_match.jpg"
  },
  {
    "Left Items": "H2O,CO2,O2,NaCl",
    "Right Items": "Water,Carbon Dioxide,Oxygen,Sodium Chloride",
    "Match Answers": "A:1,B:2,C:3,D:4",
    Question: "Match the chemical formulas with their common names:",
    Answer: "",
    Solution: "Match each chemical formula with its corresponding common name.",
    Subject: "Science",
    "Subject Title": "Chemistry",
    Board: "CBSE",
    Standard: "10",
    Marks: "4",
    Image: "chemical_match.jpg"
  },
  {
    "Left Items": "Photosynthesis,Respiration,Digestion,Circulation",
    "Right Items": "Breaking down food,Transport of nutrients,Production of glucose,Release of energy",
    "Match Answers": "A:3,B:4,C:1,D:2",
    Question: "Match the biological processes with their functions:",
    Answer: "",
    Solution: "Match each biological process with its primary function.",
    Subject: "Science",
    "Subject Title": "Biology",
    Board: "CBSE",
    Standard: "10",
    Marks: "4",
    Image: "biology_match.jpg"
  },
  {
    "Left Items": "1947,1857,1920,1930",
    "Right Items": "First War of Independence,Non-Cooperation Movement,Civil Disobedience Movement,India's Independence",
    "Match Answers": "A:4,B:1,C:2,D:3",
    Question: "Match the years with the historical events:",
    Answer: "",
    Solution: "Match each year with its corresponding historical event in Indian history.",
    Subject: "Social Studies",
    "Subject Title": "History",
    Board: "CBSE",
    Standard: "10",
    Marks: "4",
    Image: "history_match.jpg"
  },
  {
    "Left Items": "x + 5 = 10,2x = 8,x - 3 = 7,3x = 15",
    "Right Items": "x = 5,x = 4,x = 10,x = 5",
    "Match Answers": "A:1,B:2,C:3,D:1",
    Question: "Match the equations with their solutions:",
    Answer: "",
    Solution: "Solve each equation and match with the correct solution.",
    Subject: "Mathematics",
    "Subject Title": "Algebra",
    Board: "CBSE",
    Standard: "10",
    Marks: "4",
    Image: "algebra_match.jpg"
  },
  {
    "Left Items": "Shakespeare,Austen,Dickens,Tagore",
    "Right Items": "Pride and Prejudice,Macbeth,Great Expectations,Gitanjali",
    "Match Answers": "A:2,B:1,C:3,D:4",
    Question: "Match the authors with their famous works:",
    Answer: "",
    Solution: "Match each author with their well-known literary work.",
    Subject: "English",
    "Subject Title": "Literature",
    Board: "CBSE",
    Standard: "10",
    Marks: "4",
    Image: "literature_match.jpg"
  },
  {
    "Left Items": "Mercury,Venus,Earth,Mars",
    "Right Items": "Red Planet,Blue Planet,Closest to Sun,Evening Star",
    "Match Answers": "A:3,B:4,C:2,D:1",
    Question: "Match the planets with their characteristics:",
    Answer: "",
    Solution: "Match each planet with its distinctive characteristic or nickname.",
    Subject: "Science",
    "Subject Title": "Physics",
    Board: "CBSE",
    Standard: "10",
    Marks: "4",
    Image: "planets_match.jpg"
  },
  {
    "Left Items": "Ganga,Yamuna,Godavari,Brahmaputra",
    "Right Items": "Longest river in India,Flows through Delhi,Tributary of Ganga,Flows through Assam",
    "Match Answers": "A:1,B:3,C:2,D:4",
    Question: "Match the rivers with their descriptions:",
    Answer: "",
    Solution: "Match each river with its characteristic description.",
    Subject: "Social Studies",
    "Subject Title": "Geography",
    Board: "CBSE",
    Standard: "10",
    Marks: "4",
    Image: "rivers_match.jpg"
  },
  {
    "Left Items": "Heart,Lungs,Kidneys,Brain",
    "Right Items": "Pumps blood,Filters blood,Controls body functions,Exchanges gases",
    "Match Answers": "A:1,B:4,C:2,D:3",
    Question: "Match the organs with their primary functions:",
    Answer: "",
    Solution: "Match each organ with its main function in the human body.",
    Subject: "Science",
    "Subject Title": "Biology",
    Board: "CBSE",
    Standard: "10",
    Marks: "4",
    Image: "organs_match.jpg"
  },
  {
    "Left Items": "Rectangle,Circle,Triangle,Square",
    "Right Items": "Area = length × width,Area = πr²,Area = ½ × base × height,Area = side²",
    "Match Answers": "A:1,B:2,C:3,D:4",
    Question: "Match the shapes with their area formulas:",
    Answer: "",
    Solution: "Match each geometric shape with its corresponding area formula.",
    Subject: "Mathematics",
    "Subject Title": "Algebra",
    Board: "CBSE",
    Standard: "10",
    Marks: "4",
    Image: "shapes_match.jpg"
  }
];

// Create Passage Questions Excel
const createPassageExcel = () => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(samplePassageQuestions);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 80 }, // Passage
    { wch: 60 }, // Passage Questions
    { wch: 40 }, // Passage Answers
    { wch: 50 }, // Question
    { wch: 10 }, // Answer
    { wch: 50 }, // Solution
    { wch: 15 }, // Subject
    { wch: 20 }, // Subject Title
    { wch: 10 }, // Board
    { wch: 10 }, // Standard
    { wch: 10 }, // Marks
    { wch: 25 }, // Image
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Passage Questions");

  const outputPath = path.join(process.cwd(), "public", "sample_passage_questions.xlsx");
  XLSX.writeFile(workbook, outputPath);

  console.log(`✅ Passage Questions Excel file created at: ${outputPath}`);
  console.log(`📊 Total passage questions: ${samplePassageQuestions.length}`);
};

// Create Match Questions Excel
const createMatchExcel = () => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(sampleMatchQuestions);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 50 }, // Left Items
    { wch: 50 }, // Right Items
    { wch: 30 }, // Match Answers
    { wch: 50 }, // Question
    { wch: 10 }, // Answer
    { wch: 50 }, // Solution
    { wch: 15 }, // Subject
    { wch: 20 }, // Subject Title
    { wch: 10 }, // Board
    { wch: 10 }, // Standard
    { wch: 10 }, // Marks
    { wch: 25 }, // Image
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Match Questions");

  const outputPath = path.join(process.cwd(), "public", "sample_match_questions.xlsx");
  XLSX.writeFile(workbook, outputPath);

  console.log(`✅ Match Questions Excel file created at: ${outputPath}`);
  console.log(`📊 Total match questions: ${sampleMatchQuestions.length}`);
};

// Create both Excel files
createPassageExcel();
createMatchExcel();

console.log(`\n📝 Format Instructions:`);
console.log(`\nFor Passage Questions:`);
console.log(`- Passage: The main passage text`);
console.log(`- Passage Questions: Comma-separated list of questions (e.g., "Q1?,Q2?,Q3?")`);
console.log(`- Passage Answers: Comma-separated list of answers in order (e.g., "Answer1,Answer2,Answer3")`);
console.log(`\nFor Match Questions:`);
console.log(`- Left Items: Comma-separated list (e.g., "Item1,Item2,Item3")`);
console.log(`- Right Items: Comma-separated list (e.g., "Option1,Option2,Option3")`);
console.log(`- Match Answers: Format "A:1,B:2,C:3" where A,B,C are left items and 1,2,3 are right item positions`);


