const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-3-flash-preview"
];

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama3-70b-8192",
  "mixtral-8x7b-32768"
];

const GROQ_API_URL = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";

import { COURSE_GENERATION_PROMPT, DISCOVERY_QUESTIONS_PROMPT } from './prompts/course-generation.prompt';

interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const sendGeminiMessage = async (
  messages: GeminiMessage[],
  systemInstruction: string,
  onChunk?: (text: string) => void
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }

  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    const endpoint = onChunk ? 'streamGenerateContent?alt=sse&' : 'generateContent?';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}key=${apiKey}`;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          signal: AbortSignal.timeout(90000), // 90 second timeout
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
        });

        if (response.ok) {
          if (onChunk && response.body) {
            let fullText = "";
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split("\n");
              for (const line of lines) {
                if (line.startsWith("data: ") && line.trim() !== "data: [DONE]") {
                  try {
                    // Sometimes Gemini sends raw JSON without data: prefix, but ?alt=sse ensures it.
                    const data = JSON.parse(line.substring(6));
                    const deltaText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (deltaText) {
                      fullText += deltaText;
                      onChunk(deltaText);
                    }
                  } catch (e) {
                    // Ignore parse errors for incomplete chunks
                  }
                }
              }
            }
            return fullText;
          } else {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text;
          }
        }

        const errorText = await response.text();
        console.warn(`Gemini model ${model} attempt ${attempt} warning (${response.status}):`, errorText);

        if (response.status === 429 || response.status === 503 || errorText.includes("high demand") || errorText.includes("quota")) {
          await delay(attempt * 1000);
          continue;
        } else {
          lastError = new Error(`Gemini API Error (${model}): ${response.status} ${errorText}`);
          break;
        }
      } catch (err: any) {
        console.warn(`Gemini model ${model} attempt ${attempt} exception:`, err);
        lastError = err;
        await delay(attempt * 1000);
      }
    }
  }

  throw lastError || new Error("All Gemini model attempts failed.");
};

export const sendGroqMessage = async (
  prompt: string,
  systemInstruction: string,
  preferredModel?: string,
  onChunk?: (text: string) => void
): Promise<string> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("GROQ_API_KEY environment variable is not set. Falling back to Gemini...");
    return sendGeminiMessage([{ role: "user", parts: [{ text: prompt }] }], systemInstruction, onChunk);
  }

  const modelList = preferredModel ? [preferredModel, ...GROQ_MODELS.filter(m => m !== preferredModel)] : GROQ_MODELS;

  for (const modelName of modelList) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch(GROQ_API_URL, {
          method: "POST",
          signal: AbortSignal.timeout(90000), // 90 second timeout
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
            stream: !!onChunk,
          }),
        });

        if (response.ok) {
          if (onChunk && response.body) {
            let fullText = "";
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split("\n");
              for (const line of lines) {
                if (line.startsWith("data: ") && line.trim() !== "data: [DONE]") {
                  try {
                    const data = JSON.parse(line.substring(6));
                    const deltaText = data.choices?.[0]?.delta?.content;
                    if (deltaText) {
                      fullText += deltaText;
                      onChunk(deltaText);
                    }
                  } catch (e) {
                    // Ignore parse errors for incomplete chunks
                  }
                }
              }
            }
            return fullText;
          } else {
            const data = await response.json();
            const text = data.choices?.[0]?.message?.content;
            if (text) return text;
          }
        }

        const errorText = await response.text();
        console.warn(`Groq model ${modelName} attempt ${attempt} warning (${response.status}):`, errorText);
        if (response.status === 429 || response.status === 503) {
          await delay(attempt * 1000);
        } else {
          break;
        }
      } catch (error) {
        console.warn(`Groq model ${modelName} exception attempt ${attempt}:`, error);
        await delay(attempt * 1000);
      }
    }
  }

  console.warn("All Groq models failed or were rate-limited, falling back to Gemini...");
  return sendGeminiMessage([{ role: "user", parts: [{ text: prompt }] }], systemInstruction, onChunk);
};

export const generateCourseContent = async (prompt: string): Promise<string> => {
  const systemInstruction = "You are an expert instructional designer. Create detailed, engaging course content based on the user's requirements.";
  return sendGroqMessage(prompt, systemInstruction);
};

export const generateCourseDraft = async (brief: string, onChunk?: (text: string) => void): Promise<string> => {
  const prompt = `Here is the course brief and discovery information:\n\n${brief}`;
  const systemInstruction = COURSE_GENERATION_PROMPT;
  return sendGroqMessage(prompt, systemInstruction, undefined, onChunk);
};

export const refineCourseContent = async (currentContent: string, feedback: string): Promise<string> => {
  const prompt = `Here is the current content:\n${currentContent}\n\nPlease refine it based on this feedback:\n${feedback}`;
  const systemInstruction = "You are an expert instructional designer helping to refine course content. Analyze the current content and incorporate the feedback to improve it.";
  return sendGroqMessage(prompt, systemInstruction);
};

export const analyzeSourceMaterial = async (material: string): Promise<string> => {
  const prompt = `Analyze this source material and provide insights:\n\n${material}`;
  const systemInstruction = "You are an expert content analyst. Analyze the provided source material and identify key topics, gaps in content, learning objectives, and suggest a course structure.";
  return sendGroqMessage(prompt, systemInstruction);
};

export const generateDiscoveryQuestions = async (brief: string): Promise<string> => {
  const prompt = `Here is the course brief:\n\n${brief}`;
  const systemInstruction = DISCOVERY_QUESTIONS_PROMPT;
  return sendGroqMessage(prompt, systemInstruction);
};
