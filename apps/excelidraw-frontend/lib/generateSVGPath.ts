import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerationConfig,
  SafetySetting,
  Content,
} from "@google/generative-ai";

// ##########################################################################
// ## CRITICAL SECURITY WARNING                                            ##
// ##########################################################################
// ## This client-side approach is NOT secure for production.              ##
// ## Please use a backend API route to protect your API key.              ##
// ##########################################################################
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);


// ==========================================================================
// ## SECTION 1: CONFIGURATION FOR THE SVG "WORKER" MODEL                  ##
// ==========================================================================

/**
 * The core instructions for the SVG model, defining its role and rules.
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
 * A set of examples to teach the model.
 * ENHANCEMENT: Added a complex, multi-part example ("camera icon")
 * to teach the model how to assemble components from a JSON description.
 */
const chatHistory: Content[] = [
  { role: "user", parts: [{ text: "a simple five-pointed star" }] },
  { role: "model", parts: [{ text: "M150,50 L180,120 L260,120 L200,170 L230,250 L150,200 L70,250 L100,170 L40,120 L120,120 Z" }] },
  { role: "user", parts: [{ text: "a heart shape" }] },
  { role: "model", parts: [{ text: "M150,95 C110,40 50,80 150,170 C250,80 190,40 150,95 Z" }] },
  {
    role: "user",
    parts: [{
      text: `User's request: "a camera icon".
             Detailed breakdown of the shape (JSON format): {
               "components": [
                 {"shape": "rectangle", "description": "A rounded rectangle for the main body."},
                 {"shape": "circle", "description": "A large circle inside the rectangle for the lens."},
                 {"shape": "rectangle", "description": "A smaller rectangle on top right for the flash."}
               ]
             }`
    }],
  },
  {
    role: "model",
    parts: [{
      text: "M60,100 A20,20 0 0,1 80,80 H220 A20,20 0 0,1 240,100 V200 A20,20 0 0,1 220,220 H80 A20,20 0 0,1 60,200 Z M150,150 m-40,0 a40,40 0 1,0 80,0 a40,40 0 1,0 -80,0 Z M180,80 H210 V70 H180 Z"
    }],
  },
];

const safetySettings: SafetySetting[] = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const generationConfig: GenerationConfig = {
    temperature: 0.4, // Lowered temperature for more deterministic output
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
};


// ==========================================================================
// ## SECTION 2: HELPER FUNCTIONS (PLANNER & WORKER)                       ##
// ==========================================================================

/**
 * STEP 1: The "Planner" Model.
 * ENHANCEMENT: This version is prompted to output structured JSON,
 * creating a precise blueprint for the worker model.
 * @param {string} simplePrompt - The user's initial description.
 * @returns {Promise<string | null>} A JSON string describing the shape, or null on error.
 */
async function getDetailedDescription(simplePrompt: string): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      // Enforce JSON output for reliability
      generationConfig: { responseMimeType: "application/json" },
    });

    const plannerPrompt = `
      You are a visual decomposer. Your task is to take a simple object name and describe it by its fundamental geometric components in a JSON format.

      - The output must be a valid JSON object.
      - The root should be an object with a "components" key, which is an array of shape objects.
      - Each shape object should have a "shape" (e.g., "rectangle", "circle", "triangle", "curve") and a "description" of its placement relative to other parts.

      Example Input: "a simple house"
      Example Output:
      {
        "components": [
          {
            "shape": "square",
            "description": "The main body of the house, centered."
          },
          {
            "shape": "triangle",
            "description": "The roof, sitting directly on top of the main body square."
          },
          {
            "shape": "rectangle",
            "description": "The door, small and centered at the bottom of the main body."
          }
        ]
      }

      Input: "${simplePrompt}"
      Output:
    `;

    const result = await model.generateContent(plannerPrompt);
    const description = result.response.text();
    return description;

  } catch (error) {
    console.error("Error in JSON description generation step:", error);
    return null;
  }
}

/**
 * STEP 2: The "Worker" Model.
 * This function remains the same, but it is now more powerful because
 * the chatHistory has been improved with a complex example.
 * @param {string} prompt - A detailed shape description.
 * @returns {Promise<string | null>} A string containing an SVG path, or null on error.
 */
async function generateSVGPath(prompt: string): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemInstruction,
    });

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: generationConfig,
      safetySettings: safetySettings
    });

    const result = await chat.sendMessage(prompt);
    const svgPath = result.response.text().trim();
    return svgPath;

  } catch (error) {
    console.error("Gemini API client-side error:", error);
    return null;
  }
}


// ==========================================================================
// ## SECTION 3: MAIN EXPORTED FUNCTION                                    ##
// ==========================================================================

/**
 * Orchestrates the enhanced two-step process to generate a high-quality SVG path.
 * @param {string} initialPrompt - The user's simple request (e.g., "a rocket ship").
 * @returns {Promise<string | null>} A string containing an SVG path, or null on error.
 */
export async function generateSvgWithDecomposition(initialPrompt: string): Promise<string | null> {
  console.log(`Initial prompt: "${initialPrompt}"`);

  // Step 1: Call the planner to get a structured JSON breakdown.
  const detailedDescriptionJson = await getDetailedDescription(initialPrompt);

  if (!detailedDescriptionJson) {
    console.error("Could not generate a detailed JSON description. Aborting.");
    return null;
  }
  console.log(`Generated detailed JSON description:\n${detailedDescriptionJson}`);

  // Step 2: Create a new, enhanced prompt for the SVG worker model.
  const finalPrompt = `
    User's request: "${initialPrompt}".
    Detailed breakdown of the shape (JSON format): ${detailedDescriptionJson}
  `;

  console.log("Sending final enhanced prompt to SVG generator...");

  // Step 3: Call the SVG worker with the rich, structured prompt.
  const svgPath = await generateSVGPath(finalPrompt);

  if (svgPath) {
    console.log("Successfully generated SVG path.");
  }

  return svgPath;
}