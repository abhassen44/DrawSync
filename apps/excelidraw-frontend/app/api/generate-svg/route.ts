import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerationConfig,
  SafetySetting,
  Content,
} from "@google/generative-ai";

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --------------------------------------------
// SECTION 1: Configuration
// --------------------------------------------

const systemInstruction = {
  role: "system",
  parts: [{
    text: `
You are an expert SVG path generator.

Follow these rules:
1. Respond ONLY with the SVG path string (the 'd' attribute). No markdown, no explanations.
2. Design shapes to fit within a 300x300 canvas. Center them unless otherwise stated.
3. Use appropriate SVG path commands (M, L, C, A, Z) to ensure smooth, clean, connected shapes.
4. Respect the described size (small, medium, large) and position (top, bottom, center, etc).
5. Use curves or arcs for round shapes when suitable.

Do not include extra content—only return a valid SVG path string.
    `.trim()
  }]
};

const chatHistory: Content[] = [
  { role: "user", parts: [{ text: "a simple five-pointed star" }] },
  { role: "model", parts: [{ text: "M150,50 L180,120 L260,120 L200,170 L230,250 L150,200 L70,250 L100,170 L40,120 L120,120 Z" }] },
  { role: "user", parts: [{ text: "a heart shape" }] },
  { role: "model", parts: [{ text: "M150,95 C110,40 50,80 150,170 C250,80 190,40 150,95 Z" }] },
];

const safetySettings: SafetySetting[] = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const generationConfig: GenerationConfig = {
  temperature: 0.4,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
};

// --------------------------------------------
// SECTION 2: Helpers
// --------------------------------------------

async function getDetailedDescription(simplePrompt: string): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const plannerPrompt = `
You are a geometry planner. Given a user prompt, return a JSON array of shapes that make up the drawing.

Rules:
- Each object must have: "shape", "description", "position", and "size"
- Canvas size is 300x300.
- Allowed shapes: circle, ellipse, rectangle, square, triangle, line, arc, path, star, polygon.
- Output must be VALID JSON. Nothing else.

Example:

Input: "a rocket"
Output:
{
  "components": [
    { "shape": "rectangle", "description": "body of the rocket", "position": "center", "size": "large" },
    { "shape": "triangle", "description": "top nose cone", "position": "top center", "size": "medium" },
    { "shape": "triangle", "description": "left wing", "position": "bottom left", "size": "small" },
    { "shape": "triangle", "description": "right wing", "position": "bottom right", "size": "small" }
  ]
}

Input: "${simplePrompt}"
Output:
    `.trim();

    const result = await model.generateContent(plannerPrompt);
    return result.response.text();
  } catch (error) {
    console.error("Planner error:", error);
    return null;
  }
}

function convertPlannerJsonToVisualHint(json: string): string {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.components) return "";

    return parsed.components.map((c: any, i: number) =>
      `Component ${i + 1}: a ${c.size || "medium"} ${c.shape}, at ${c.position || "center"}, described as: ${c.description}`
    ).join("\n");
  } catch {
    return "";
  }
}

async function generateSVGPath(prompt: string): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemInstruction,
    });

    const chat = model.startChat({
      history: chatHistory,
      generationConfig,
      safetySettings
    });

    const result = await chat.sendMessage(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Worker error:", error);
    return null;
  }
}

function isValidSVGPath(path: string): boolean {
  return /^[MLCZAmlcza0-9,\s.\-]+$/.test(path.trim());
}

// --------------------------------------------
// SECTION 3: API Handler
// --------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const { prompt: initialPrompt } = await req.json();

    if (!initialPrompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const detailedDescriptionJson = await getDetailedDescription(initialPrompt);
    if (!detailedDescriptionJson) {
      return NextResponse.json({ error: "Failed to generate detailed description" }, { status: 500 });
    }

    const visualHint = convertPlannerJsonToVisualHint(detailedDescriptionJson);

    // Optional prompt-based hint
    let customHint = "";
    if (initialPrompt.toLowerCase().includes("car")) {
      customHint += "\nImportant: Represent the car using a rectangle (body), two circles (wheels), and a smaller rounded rectangle (roof).";
    }

    const finalPrompt = `
User's request: "${initialPrompt}"
Detailed breakdown (JSON): ${detailedDescriptionJson}

Visual guide:
${visualHint}
${customHint}
    `.trim();

    const svgPath = await generateSVGPath(finalPrompt);

    if (!svgPath || !isValidSVGPath(svgPath)) {
      return NextResponse.json({ error: "Invalid or missing SVG path output" }, { status: 500 });
    }

    return NextResponse.json({ svgPath }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
