# Bulk Upload Instructions - Sample Questions for Standard 10

## 📁 Files Created

1. **Excel File**: `public/sample_questions_std10.xlsx`

   - Contains 10 MCQ questions for Standard 10
   - All questions are ready to upload

2. **Images Folder**: `public/sample_images/`
   - Contains 10 placeholder images matching the Excel file
   - Image filenames match the "Image" column in Excel

## 📋 Excel File Structure

The Excel file contains the following columns:

| Column        | Required?             | Description                          | Example                                   |
| ------------- | --------------------- | ------------------------------------ | ----------------------------------------- |
| Question      | ✅ **REQUIRED**       | The question text                    | "What is the chemical formula for water?" |
| Option1       | ✅ **REQUIRED** (MCQ) | First option                         | "H2O2"                                    |
| Option2       | ✅ **REQUIRED** (MCQ) | Second option                        | "H2O"                                     |
| Option3       | ✅ **REQUIRED** (MCQ) | Third option                         | "HO2"                                     |
| Option4       | ✅ **REQUIRED** (MCQ) | Fourth option                        | "H3O"                                     |
| Answer        | ✅ **REQUIRED**       | Correct answer (for MCQ: 1-4)        | "2" or "H2O"                              |
| Subject       | ✅ **REQUIRED**       | Subject name (will be matched to ID) | "Science"                                 |
| Subject Title | ✅ **REQUIRED**       | Subject title/chapter name           | "Chemistry"                               |
| Board         | ✅ **REQUIRED**       | Board name (will be matched to ID)   | "CBSE"                                    |
| Standard      | ✅ **REQUIRED**       | Grade level (1-12)                   | "10"                                      |
| Marks         | ✅ **REQUIRED**       | Marks for question                   | "1"                                       |
| Solution      | ⚪ Optional           | Explanation/answer                   | "Water is composed of..."                 |
| Image         | ⚪ Optional           | Image filename                       | "water_question.jpg"                      |

## 🚀 How to Use for Bulk Upload

### Step 1: Access Bulk Upload

1. Go to Admin Panel → Questions
2. Select "MCQ" question type
3. Click "Bulk Upload" button (green button)

### Step 2: Upload Excel File

1. Click "Select Excel File"
2. Navigate to: `public/sample_questions_std10.xlsx`
3. Select and open the file

### Step 3: Upload Images (Optional)

1. Click "Select Images"
2. Navigate to: `public/sample_images/`
3. Select all 10 image files:
   - water_question.jpg
   - mars_question.jpg
   - capital_question.jpg
   - book_question.jpg
   - pi_question.jpg
   - photosynthesis_question.jpg
   - organ_question.jpg
   - independence_question.jpg
   - math_question.jpg
   - river_question.jpg

### Step 4: Review and Upload

1. Check the preview table (shows first 10 questions)
2. Review any errors (if shown)
3. Click "Upload 10 Questions" button
4. Wait for upload progress to complete
5. See success message

## 📝 Sample Questions Included

1. **Science**: Water chemical formula
2. **Science**: Red Planet (Mars)
3. **Social Studies**: Capital of India
4. **English**: Pride and Prejudice author
5. **Mathematics**: Value of π
6. **Science**: Photosynthesis gas
7. **Science**: Largest human organ
8. **Social Studies**: India independence year
9. **Mathematics**: Square root of 144
10. **Social Studies**: Longest river in India

## ⚠️ Important Notes

### **REQUIRED FIELDS:**

All questions **MUST** have these fields filled:

- ✅ Question
- ✅ Answer
- ✅ Subject (or Subject ID)
- ✅ Subject Title (or Subject Title ID) - **This is required!**
- ✅ Board (or Board ID)
- ✅ Standard
- ✅ Marks
- ✅ Options (for MCQ, Passage, Match types)

### **Field Matching:**

- **Subject Matching**: Make sure the subjects "Science", "Social Studies", "English", and "Mathematics" exist in your database
- **Subject Title Matching**: Make sure subject titles like "Chemistry", "Physics", "Biology", "History", "Geography", "Algebra", "Literature" exist in your database
- **Board Matching**: Make sure "CBSE" board exists in your database
- **Image Matching**: Image filenames in Excel must match uploaded image file names (case-insensitive)
- **Standard**: All questions are set for Standard 10

### **Common Errors:**

- ❌ Missing `subject_title_id` - Make sure "Subject Title" column is filled
- ❌ Missing `subject_id` - Make sure "Subject" column is filled
- ❌ Missing `board_id` - Make sure "Board" column is filled
- ❌ Missing `standard` - Make sure "Standard" column is filled
- ❌ Missing `marks` - Make sure "Marks" column is filled

## 🔧 Customization

You can edit the Excel file to:

- Change question text
- Modify options
- Update answers
- Change subjects/boards
- Add more questions (just add new rows)
- Modify image filenames

## 📦 File Locations

- Excel: `public/sample_questions_std10.xlsx`
- Images: `public/sample_images/*.jpg`

---

**Ready to upload!** Just follow the steps above to bulk upload all 10 questions with images.
