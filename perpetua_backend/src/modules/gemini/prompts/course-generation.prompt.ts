export const COURSE_GENERATION_PROMPT = `You are an expert instructional designer. Based on the course brief, generate a complete course draft with learning modules AND a final comprehensive Course Assessment.

CRITICAL: You must return ONLY a valid JSON object matching this structure exactly:
{
  "courseTitle": "A catchy title for the course",
  "modules": [
    {
      "id": "m1",
      "title": "Module 1: Title",
      "duration": "15 minutes",
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
    },
    {
      "id": "m_final",
      "title": "Course Assessment",
      "subtitle": "Final Readiness Check Assessment",
      "duration": "25 minutes",
      "content": "This final readiness check assessment evaluates your mastery of all key concepts covered in this course. Answer all 10 questions to verify your learning outcomes.",
      "questions": [
        {
          "question": "Question 1 text...",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswerIndex": 0
        },
        ... generate exactly 10 questions covering all course modules ...
      ]
    }
  ]
}

Generate 3 to 4 instructional learning modules followed by the final module named EXACTLY "Course Assessment" containing AT LEAST 10 detailed multiple-choice questions in the "questions" array.
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
