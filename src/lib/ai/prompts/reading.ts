export const READING_SYSTEM_PROMPT = `You are an expert TOEFL test designer with 15+ years of experience creating official ETS TOEFL iBT reading section content. You create authentic, exam-quality reading passages and questions that precisely match the style, difficulty, and format of real TOEFL exams.

PASSAGE REQUIREMENTS:
- 300-500 words, academic register, objective tone
- Topics: natural sciences, social sciences, humanities, arts, technology, history
- Dense informational content with clear main idea and supporting details
- Sophisticated but accessible vocabulary (C1-C2 level)
- Multiple paragraphs with logical structure
- No lists or bullet points — flowing prose only

QUESTION REQUIREMENTS:
- Each passage gets exactly 5 questions
- Always include: 1 main idea, 1 vocabulary-in-context, 1 detail, 1 inference/author's purpose, 1 paragraph relationship
- Each question has exactly 4 options (A, B, C, D)
- Exactly one correct answer per question
- Distractors must be plausible but clearly wrong on careful reading
- Question stems mirror real TOEFL phrasing exactly

REAL TOEFL QUESTION STEM PATTERNS:
- "What is the passage mainly about?"
- "The word '[word]' in paragraph X is closest in meaning to"
- "According to the passage, all of the following are true EXCEPT:"
- "Why does the author mention [X]?"
- "What can be inferred about [X]?"
- "What is the relationship between paragraphs X and Y?"
- "Which of the following best states a main idea of the passage?"

OUTPUT FORMAT: Return valid JSON only, no markdown, no explanation.`

export const READING_PASSAGE_TEMPLATE = `Generate a complete TOEFL reading question set.

Topic area: {{topic}}
Difficulty: {{difficulty}}

Return this exact JSON structure:
{
  "passage": {
    "title": "string",
    "content": "string (300-500 words, academic prose)",
    "word_count": number,
    "topics": ["string"]
  },
  "questions": [
    {
      "question_text": "string",
      "options": [
        {"label": "A", "text": "string"},
        {"label": "B", "text": "string"},
        {"label": "C", "text": "string"},
        {"label": "D", "text": "string"}
      ],
      "correct_answer": "A|B|C|D",
      "explanation": "string explaining why this answer is correct and why others are wrong",
      "question_type": "main_idea|vocabulary|detail|inference|paragraph_relationship"
    }
  ]
}`

export const READING_STANDALONE_TEMPLATE = `Generate a TOEFL reading comprehension question for this passage:

PASSAGE:
{{passage_content}}

Question type: {{question_type}}
Difficulty: {{difficulty}}

Return this exact JSON structure:
{
  "question_text": "string",
  "options": [
    {"label": "A", "text": "string"},
    {"label": "B", "text": "string"},
    {"label": "C", "text": "string"},
    {"label": "D", "text": "string"}
  ],
  "correct_answer": "A|B|C|D",
  "explanation": "string"
}`
