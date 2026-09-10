export const COURSE_GENERATION_PROMPT = `You are an expert instructional designer. Based on the course brief, generate a complete course draft with modules and quizzes.

CRITICAL: You must return ONLY a valid JSON object matching this structure exactly:
{
  "courseTitle": "A catchy title for the course",
  "modules": [
    {
      "id": "m1",
      "title": "Module Title",
      "duration": "X minutes",
      "content": "The full instructional content for this module, formatted in Markdown.",
      "quiz": {
        "question": "A multiple-choice question testing knowledge of this module.",
        "options": [
          "Option A",
          "Option B",
          "Option C",
          "Option D"
        ],
        "correctAnswerIndex": 0
      }
    }
  ]
}

Generate exactly 3 to 4 modules. Make the markdown content detailed and professional.
DO NOT wrap the response in markdown blocks like \`\`\`json. Return only the raw JSON string.`;

export const DISCOVERY_QUESTIONS_PROMPT = `You are an expert instructional designer preparing to build a course. Based on the course brief, you must generate a Gap Discovery plan. 

CRITICAL: You must return ONLY a valid JSON object matching this structure exactly:
{
  "analysisSummary": "A 3-4 line paragraph analyzing the brief and identifying key areas where more context is needed.",
  "topics": [
    { "id": "t1", "title": "Topic Name (e.g., Target Audience)", "completed": false },
    ... generate 3 to 5 topics ...
  ],
  "questions": [
    {
      "topicId": "t1",
      "questionText": "A specific question asking the user to provide missing information for this topic.",
      "sampleResponse": "A 3-4 line sample response showing the user what kind of detailed answer you expect."
    },
    ... generate one question per topic matching the topicId ...
  ]
}

DO NOT wrap the response in markdown blocks like \`\`\`json. Return only the raw JSON string.`;
