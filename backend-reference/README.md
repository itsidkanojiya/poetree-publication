# Smart paper backend reference

- [`smartProposePaper.js`](./smartProposePaper.js) — portable helpers: `validateSectionQuestionCounts`, `validateSectionWeights`, `normalizeQuestionType`, `proposeSmartPaper`.
- Allocation is **count-first**: when the request includes **`section_question_counts`**, the reference picks that many questions per type (up to pool size). **`total_marks` does not drive section sizes** in that mode; realized marks are the sum of selected questions.
- Import `questions` from your database after applying `subject_title_id`, `board_id`, `standard`, and `exclude_question_ids` filters.
- Production services may replace the greedy `proposeSmartPaper` with a richer allocator (chapter + difficulty balance) as described in [`docs/PROMPT_BACKEND_SMART_PAPER.md`](../docs/PROMPT_BACKEND_SMART_PAPER.md).
