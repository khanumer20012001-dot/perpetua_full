const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent"
import { COURSE_GENERATION_PROMPT, DISCOVERY_QUESTIONS_PROMPT } from './prompts/course-generation.prompt';

interface GeminiMessage {
  role: "user" | "model"
  parts: { text: string }[]
}

export const sendGeminiMessage = async (
  messages: GeminiMessage[],
  systemInstruction: string,
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: messages,
      systemInstruction: {
        role: "system",
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.7,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Gemini API Error:", errorText)
    throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
}

export const generateCourseContent = async (prompt: string): Promise<string> => {
  const messages: GeminiMessage[] = [{ role: "user", parts: [{ text: prompt }] }]
  const systemInstruction = "You are an expert instructional designer. Create detailed, engaging course content based on the user's requirements. Structure your response with clear modules, chapters, and learning objectives."
  return sendGeminiMessage(messages, systemInstruction)
}

export const refineCourseContent = async (currentContent: string, feedback: string): Promise<string> => {
  const messages: GeminiMessage[] = [{ role: "user", parts: [{ text: `Here is the current content:\n${currentContent}\n\nPlease refine it based on this feedback:\n${feedback}` }] }]
  const systemInstruction = "You are an expert instructional designer helping to refine course content. Analyze the current content and incorporate the feedback to improve it."
  return sendGeminiMessage(messages, systemInstruction)
}

export const analyzeSourceMaterial = async (material: string): Promise<string> => {
  const messages: GeminiMessage[] = [{ role: "user", parts: [{ text: `Analyze this source material and provide insights:\n\n${material}` }] }]
  const systemInstruction = "You are an expert content analyst. Analyze the provided source material and identify key topics, gaps in content, learning objectives, and suggest a course structure."
  return sendGeminiMessage(messages, systemInstruction)
}

export const generateDiscoveryQuestions = async (brief: string): Promise<string> => {
  const messages: GeminiMessage[] = [{ role: "user", parts: [{ text: `Here is the course brief:\n\n${brief}` }] }]
  const systemInstruction = DISCOVERY_QUESTIONS_PROMPT;
  return sendGeminiMessage(messages, systemInstruction)
}

export const generateCourseDraft = async (brief: string): Promise<string> => {
  const messages: GeminiMessage[] = [{ role: "user", parts: [{ text: `Here is the course brief and discovery information:\n\n${brief}` }] }]
  const systemInstruction = COURSE_GENERATION_PROMPT;
  return sendGeminiMessage(messages, systemInstruction)
}
