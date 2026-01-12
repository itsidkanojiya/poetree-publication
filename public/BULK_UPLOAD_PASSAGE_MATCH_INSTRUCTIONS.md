# Bulk Upload Instructions - Passage and Match Questions

## 📁 Excel Files Created

1. **Passage Questions**: `public/sample_passage_questions.xlsx`
   - Contains 10 passage-based questions for Standard 10
   - Ready to upload and test

2. **Match Questions**: `public/sample_match_questions.xlsx`
   - Contains 10 match-the-following questions for Standard 10
   - Ready to upload and test

## 📋 Excel File Structure

### Passage Questions Format

| Column | Required? | Description | Example |
|--------|-----------|-------------|---------|
| **Passage** | ✅ **REQUIRED** | The main passage text | "The water cycle describes..." |
| **Passage Questions** | ✅ **REQUIRED** | Comma-separated questions | "What is the water cycle?,What happens when water evaporates?" |
| **Passage Answers** | ✅ **REQUIRED** | Comma-separated answers (in order) | "Hydrological cycle,Rises into atmosphere" |
| Question | ✅ **REQUIRED** | Instruction text | "Read the passage and answer the following questions." |
| Answer | ⚪ Optional | (Auto-generated from passage answers) | |
| Solution | ⚪ Optional | Explanation | "The passage explains..." |
| Subject | ✅ **REQUIRED** | Subject name | "Science" |
| Subject Title | ✅ **REQUIRED** | Subject title/chapter | "Chemistry" |
| Board | ✅ **REQUIRED** | Board name | "CBSE" |
| Standard | ✅ **REQUIRED** | Grade level (1-12) | "10" |
| Marks | ✅ **REQUIRED** | Total marks | "5" |
| Image | ⚪ Optional | Image filename | "water_cycle_passage.jpg" |

**Note for Passage Questions:**
- **Passage Questions** can be comma-separated: `"Q1?,Q2?,Q3?"`
- **Passage Answers** should match in order: `"Answer1,Answer2,Answer3"`
- The system will automatically create question-answer pairs

### Match Questions Format

| Column | Required? | Description | Example |
|--------|-----------|-------------|---------|
| **Left Items** | ✅ **REQUIRED** | Comma-separated left column items | "Delhi,Mumbai,Kolkata" |
| **Right Items** | ✅ **REQUIRED** | Comma-separated right column items | "Maharashtra,West Bengal,Tamil Nadu" |
| **Match Answers** | ✅ **REQUIRED** | Matching pairs format | "A:1,B:2,C:3" |
| Question | ✅ **REQUIRED** | Instruction text | "Match the following cities with their states:" |
| Answer | ⚪ Optional | (Auto-generated from match answers) | |
| Solution | ⚪ Optional | Explanation | "Match each city with its state." |
| Subject | ✅ **REQUIRED** | Subject name | "Social Studies" |
| Subject Title | ✅ **REQUIRED** | Subject title/chapter | "Geography" |
| Board | ✅ **REQUIRED** | Board name | "CBSE" |
| Standard | ✅ **REQUIRED** | Grade level (1-12) | "10" |
| Marks | ✅ **REQUIRED** | Total marks | "4" |
| Image | ⚪ Optional | Image filename | "cities_match.jpg" |

**Note for Match Answers:**
- Format: `"A:1,B:2,C:3"` where:
  - `A`, `B`, `C` = Left items (in order)
  - `1`, `2`, `3` = Right item positions (1-indexed)
- Example: If Left Items = `"Delhi,Mumbai"` and Right Items = `"Maharashtra,Delhi"`, then `"A:2,B:1"` means:
  - Delhi (A) matches with position 2 (Delhi)
  - Mumbai (B) matches with position 1 (Maharashtra)

## 🚀 How to Use for Bulk Upload

### Step 1: Access Bulk Upload

1. Go to **Admin Panel → Questions**
2. Select **"Passage"** or **"Match"** question type
3. Click **"Bulk Upload"** button (green button)

### Step 2: Upload Excel File

1. Click **"Select Excel File"**
2. Navigate to:
   - For Passage: `public/sample_passage_questions.xlsx`
   - For Match: `public/sample_match_questions.xlsx`
3. Select and open the file

### Step 3: Upload Images (Optional)

1. Click **"Select Images"**
2. Select image files that match the filenames in the Excel "Image" column
3. Image filenames should match exactly (e.g., `water_cycle_passage.jpg`)

### Step 4: Review and Upload

1. Check the preview table (shows all 10 questions)
2. Review any errors (if shown)
3. Click **"Upload 10 Questions"** button
4. Wait for upload progress to complete
5. See success message

## 📝 Sample Questions Included

### Passage Questions (10 samples):
1. **Science (Chemistry)**: Water Cycle
2. **Science (Biology)**: Photosynthesis
3. **Social Studies (History)**: Indian Independence Movement
4. **Mathematics (Algebra)**: Introduction to Algebra
5. **Science (Biology)**: Human Digestive System
6. **Science (Chemistry)**: Climate Change
7. **Science (Physics)**: Solar System
8. **Social Studies (History)**: Renaissance Period
9. **Science (Physics)**: Electricity
10. **Science (Biology)**: Cell Structure

### Match Questions (10 samples):
1. **Social Studies (Geography)**: Cities and States
2. **Science (Chemistry)**: Chemical Formulas
3. **Science (Biology)**: Biological Processes
4. **Social Studies (History)**: Historical Events and Years
5. **Mathematics (Algebra)**: Equations and Solutions
6. **English (Literature)**: Authors and Works
7. **Science (Physics)**: Planets and Characteristics
8. **Social Studies (Geography)**: Rivers and Descriptions
9. **Science (Biology)**: Organs and Functions
10. **Mathematics (Algebra)**: Shapes and Area Formulas

## ⚠️ Important Notes

### **REQUIRED FIELDS:**

All questions **MUST** have these fields filled:
- ✅ Passage (for passage type) / Left Items & Right Items (for match type)
- ✅ Passage Questions & Passage Answers (for passage type) / Match Answers (for match type)
- ✅ Question (instruction text)
- ✅ Subject
- ✅ Subject Title
- ✅ Board
- ✅ Standard
- ✅ Marks

### **Format Tips:**

1. **Passage Questions:**
   - Use commas to separate multiple questions: `"Q1?,Q2?,Q3?"`
   - Answers should be in the same order: `"A1,A2,A3"`
   - Each question-answer pair will be created automatically

2. **Match Answers:**
   - Use format: `"A:1,B:2,C:3"`
   - Letters (A, B, C...) represent left items in order
   - Numbers (1, 2, 3...) represent right item positions (starting from 1)
   - Ensure number of left items = number of right items

3. **Subject and Board:**
   - These should match existing values in your database
   - If you get errors, check that Subject and Board names match exactly

4. **Images:**
   - Image filenames in Excel should match uploaded image files
   - Images are optional but recommended for better question presentation

## 🔍 Troubleshooting

### Common Issues:

1. **"Subject not found" error:**
   - Check that Subject name matches exactly (case-sensitive)
   - Verify the subject exists in your database

2. **"Board not found" error:**
   - Check that Board name matches exactly (case-sensitive)
   - Verify the board exists in your database

3. **"Invalid format" error:**
   - For Passage: Ensure questions and answers are comma-separated
   - For Match: Ensure match answers follow "A:1,B:2" format

4. **"Missing required fields" error:**
   - Ensure all required columns are filled
   - Check for empty cells in required columns

## ✅ Testing Checklist

- [ ] Excel file opens correctly
- [ ] All 10 questions are visible in preview
- [ ] No errors shown in preview
- [ ] Subject and Board names match database
- [ ] Upload completes successfully
- [ ] Questions appear in question list after upload
- [ ] Questions can be viewed and edited individually

## 📞 Support

If you encounter any issues:
1. Check the error messages in the preview
2. Verify all required fields are filled
3. Ensure Subject, Board, and Subject Title match your database
4. Check the format of Passage Questions/Answers or Match Answers

Happy uploading! 🎉


