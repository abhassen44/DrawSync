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

// ==========================================================================
// ## SECTION 1: CONFIGURATION                                             ##
// ==========================================================================

const systemInstruction = {
  role: "system",
  parts: [{
    text: `
You are an expert SVG path generator. Your task is to generate a single SVG path string for a single, simple component.

Core Rules:
1.  **Output Format:** Your entire response must be ONLY the SVG path string (the 'd' attribute value). Do NOT include any other text, explanations, code blocks, or markdown.
2.  **Canvas Size:** The shape must be designed to fit well within a 300x300 canvas.
3.  **Positioning:** Strictly adhere to the requested position (e.g., "top left", "bottom center").
4.  **Simplicity:** You are drawing one piece of a larger image. Focus only on the component described.
    `.trim()
  }]
};

const safetySettings: SafetySetting[] = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const generationConfig: GenerationConfig = {
  temperature: 0.3, // Lowered for more predictable component generation
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
};

// ==========================================================================
// ## SECTION 2: HELPER FUNCTIONS (PLANNER & COMPONENT WORKER)             ##
// ==========================================================================

/**
 * CALL 1: The Planner.
 * Generates a detailed JSON plan of all geometric components.
 */
async function getDetailedDescription(simplePrompt: string): Promise<any | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const plannerPrompt = `
You are a geometry planner. Given a user prompt, return a JSON object containing an array of shapes that make up the drawing.

Rules:
- Each object in the "components" array must have: "shape", "description", "position", and "size".
- Canvas size is 300x300.
- Allowed shapes: circle, ellipse, rectangle, square, triangle, line, arc, path, star, polygon.
- Output must be VALID JSON. Nothing else.

Example Input: "a rocket"
Example Output:
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
    // Parse the JSON here to return a usable object
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Planner error:", error);
    return null;
  }
}

/**
 * CALL 2: The Component Worker.
 * Generates an SVG path for a single, simple component from the plan.
 */
async function generateSingleComponentPath(component: any): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemInstruction,
    });
    
    // Create a very focused prompt for one component
    const workerPrompt = `Generate an SVG path for a ${component.size || 'medium'} ${component.shape} at the ${component.position || 'center'} of a 300x300 canvas. It is the ${component.description}.`;

    const result = await model.generateContent(workerPrompt);
    const path = result.response.text().trim();
    
    // Basic validation for a single path component
    return /^[MLCZAmlcza0-9,\s.\-]+$/.test(path) ? path : null;

  } catch (error) {
    console.error(`Worker error for component "${component.description}":`, error);
    return null;
  }
}

// ==========================================================================
// ## SECTION 3: API HANDLER                                               ##
// ==========================================================================

export async function POST(req: NextRequest) {
  try {
    const { prompt: initialPrompt } = await req.json();

    if (!initialPrompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Step 1: Get the structured JSON plan from the planner model.
    const plan = await getDetailedDescription(initialPrompt);
    if (!plan || !plan.components || plan.components.length === 0) {
      return NextResponse.json({ error: "Failed to generate a valid plan" }, { status: 500 });
    }

    // Step 2: Create an array of promises, one for each component path generation.
    const componentPromises = plan.components.map((component: any) => 
        generateSingleComponentPath(component)
    );

    // Step 3: Execute all component generation calls in parallel for efficiency.
    const componentPaths = await Promise.all(componentPromises);

    // Step 4: Filter out any failed generations and join the successful paths.
    const finalSvgPath = componentPaths.filter(path => path !== null).join(" ");

    if (!finalSvgPath) {
      return NextResponse.json({ error: "Failed to generate any valid SVG components" }, { status: 500 });
    }

    // Step 5: Return the combined path.
    return NextResponse.json({ svgPath: finalSvgPath }, { status: 200 });

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
