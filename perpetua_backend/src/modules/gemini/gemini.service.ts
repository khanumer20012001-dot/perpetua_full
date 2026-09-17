const GEMINI_API_URL = process.env.GEMINI_API_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent"
const GROQ_API_URL = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions"

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
    let detailedMsg = `Gemini API Error: ${response.status} ${response.statusText}`
    try {
      const parsed = JSON.parse(errorText)
      if (parsed.error?.message) {
        detailedMsg = `Gemini API Error: ${parsed.error.message}`
      }
    } catch (e) {}
    throw new Error(detailedMsg)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
}

export const sendGroqMessage = async (
  prompt: string,
  systemInstruction: string,
  modelName: string = "llama-3.3-70b-versatile"
): Promise<string> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("GROQ_API_KEY environment variable is not set. Falling back to Gemini...");
    return sendGeminiMessage([{ role: "user", parts: [{ text: prompt }] }], systemInstruction);
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API Error:", errorText);
      console.warn("Groq request failed, falling back to Gemini...");
      return sendGeminiMessage([{ role: "user", parts: [{ text: prompt }] }], systemInstruction);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch (error) {
    console.error("Groq API Exception:", error);
    return sendGeminiMessage([{ role: "user", parts: [{ text: prompt }] }], systemInstruction);
  }
};

// Course generation handled by GROQ API
export const generateCourseContent = async (prompt: string): Promise<string> => {
  const systemInstruction = "You are an expert instructional designer. Create detailed, engaging course content based on the user's requirements. Structure your response with clear modules, chapters, and learning objectives."
  return sendGroqMessage(prompt, systemInstruction)
}

export const generateCourseDraft = async (brief: string): Promise<string> => {
  const prompt = `Here is the course brief and discovery information:\n\n${brief}`
  const systemInstruction = COURSE_GENERATION_PROMPT;
  return sendGroqMessage(prompt, systemInstruction)
}

// Auto-tune, refinement, analysis, and discovery question generation handled by GEMINI API
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

