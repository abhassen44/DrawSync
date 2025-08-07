import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerationConfig,
  SafetySetting,
  Part,
  Content,
} from "@google/generative-ai";

// ##########################################################################
// ## CRITICAL SECURITY WARNING                                            ##
// ##########################################################################
// ## As stated before, this client-side approach is NOT secure for        ##
// ## production. Please use a backend API route to protect your API key.  ##
// ##########################################################################
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
/**
 * The core instructions for the model, defining its role, rules, and output format.
 * This is the new, more powerful way to set the context.
 */
const systemInstruction = {
  role: "system",
  parts: [{
    text: `You are an expert SVG path generator. Your sole purpose is to return a single, valid SVG path data string based on a user's description.

    Core Rules:
    1.  **Output Format:** Your entire response must be ONLY the SVG path string (the 'd' attribute value). Do NOT include any other text, explanations, code blocks (like \`\`\`svg), or markdown.
    2.  **Canvas Size:** The shape must be designed to fit well within a 300x300 canvas.
    3.  **Quality:** The path should be visually appealing, clean, and centered within the canvas.
    4.  **Commands:** Use a variety of SVG commands where appropriate, including M (moveTo), L (lineTo), C (cubicCurveTo), A (arc), and Z (closePath), to create accurate and smooth shapes.`
  }],
};
/**
 * A more diverse set of examples to teach the model complex shapes and commands.
 */
const chatHistory: Content[] = [
  {
    role: "user",
    parts: [{ text: "a simple five-pointed star" }],
  },
  {
    role: "model",
    parts: [{ text: "M150,50 L180,120 L260,120 L200,170 L230,250 L150,200 L70,250 L100,170 L40,120 L120,120 Z" }],
  },
  {
    role: "user",
    parts: [{ text: "a heart shape" }],
  },
  {
    role: "model",
    parts: [{ text: "M150,95 C110,40 50,80 150,170 C250,80 190,40 150,95 Z" }], // Improved heart path
  },
  {
    role: "user",
    parts: [{ text: "a crescent moon" }],
  },
  {
    role: "model",
    parts: [{ text: "M150,75 A75,75 0 0,0 150,225 A60,60 0 1,1 150,75 Z" }], // Teaches the 'A' (arc) command
  },
  {
    role: "user",
    parts: [{ text: "a gentle wave" }],
  },
  {
    role: "model",
    parts: [{ text: "M50,150 C100,100 200,200 250,150" }], // Teaches the 'C' (cubic Bezier) command
  },
];

const safetySettings: SafetySetting[] = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const generationConfig: GenerationConfig = {
    temperature: 0.5,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
};


/**
 * Generates an SVG path based on a text prompt using the Gemini API.
 * @param prompt - The shape description (e.g., "Draw a house").
 * @returns A string containing an SVG path, or null on error.
 */
export async function generateSVGPath(prompt: string): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemInstruction, // Applying the new system instruction
    });

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: generationConfig,
      safetySettings: safetySettings
    });

    const result = await chat.sendMessage(prompt);
    const response = result.response;
    const svgPath = response.text().trim();

    return svgPath;
  } catch (error) {
    console.error("Gemini API client-side error:", error);
    return null;
  }
}