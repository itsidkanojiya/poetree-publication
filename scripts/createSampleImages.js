import sharp from "sharp";
import fs from "fs";
import path from "path";

// Image filenames from Excel
const imageFiles = [
  "water_question.jpg",
  "mars_question.jpg",
  "capital_question.jpg",
  "book_question.jpg",
  "pi_question.jpg",
  "photosynthesis_question.jpg",
  "organ_question.jpg",
  "independence_question.jpg",
  "math_question.jpg",
  "river_question.jpg"
];

// Create images directory
const imagesDir = path.join(process.cwd(), "public", "sample_images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Colors for different question types
const colors = [
  { bg: "#3B82F6", text: "#FFFFFF" }, // Blue
  { bg: "#10B981", text: "#FFFFFF" }, // Green
  { bg: "#F59E0B", text: "#FFFFFF" }, // Amber
  { bg: "#EF4444", text: "#FFFFFF" }, // Red
  { bg: "#8B5CF6", text: "#FFFFFF" }, // Purple
  { bg: "#06B6D4", text: "#FFFFFF" }, // Cyan
  { bg: "#EC4899", text: "#FFFFFF" }, // Pink
  { bg: "#14B8A6", text: "#FFFFFF" }, // Teal
  { bg: "#F97316", text: "#FFFFFF" }, // Orange
  { bg: "#6366F1", text: "#FFFFFF" }, // Indigo
];

// Question titles for images
const questionTitles = [
  "Water Formula",
  "Red Planet",
  "Capital City",
  "Literature",
  "Mathematics",
  "Photosynthesis",
  "Human Body",
  "History",
  "Square Root",
  "Geography"
];

async function createImage(filename, index) {
  const color = colors[index % colors.length];
  const title = questionTitles[index];
  
  // Create SVG text
  const svg = `
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="600" fill="${color.bg}"/>
      <text 
        x="400" 
        y="250" 
        font-family="Arial, sans-serif" 
        font-size="48" 
        font-weight="bold" 
        fill="${color.text}" 
        text-anchor="middle"
      >
        ${title}
      </text>
      <text 
        x="400" 
        y="320" 
        font-family="Arial, sans-serif" 
        font-size="24" 
        fill="${color.text}" 
        text-anchor="middle"
        opacity="0.9"
      >
        Question ${index + 1}
      </text>
      <text 
        x="400" 
        y="380" 
        font-family="Arial, sans-serif" 
        font-size="18" 
        fill="${color.text}" 
        text-anchor="middle"
        opacity="0.8"
      >
        Standard 10
      </text>
    </svg>
  `;

  const outputPath = path.join(imagesDir, filename);
  
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 90 })
    .toFile(outputPath);
  
  console.log(`✅ Created: ${filename}`);
}

async function createAllImages() {
  console.log("🎨 Creating sample question images...\n");
  
  for (let i = 0; i < imageFiles.length; i++) {
    await createImage(imageFiles[i], i);
  }
  
  console.log(`\n✅ All ${imageFiles.length} images created in: ${imagesDir}`);
  console.log(`📁 You can find them in: public/sample_images/`);
}

createAllImages().catch(console.error);

