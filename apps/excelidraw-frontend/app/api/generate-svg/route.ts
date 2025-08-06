import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Define the safety settings for the model
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Define the few-shot examples as a chat history
const chatHistory = [
  {
    role: "user",
    parts: [
      {
        text: "You are an expert SVG path generator. Your sole purpose is to return a valid SVG path string based on a user's description. The path must fit within a 300x300 canvas. Do not include any other text, explanations, or markdown formatting in your response. Here are some examples.",
      },
    ],
  },
  {
    role: "model",
    parts: [{ text: "Understood. I will only provide the SVG path string." }],
  },
  {
    role: "user",
    parts: [{ text: "a simple five-pointed star" }],
  },
  {
    role: "model",
    parts: [
      {
        text: "M150,50 L180,120 L260,120 L200,170 L230,250 L150,200 L70,250 L100,170 L40,120 L120,120 Z",
      },
    ],
  },
  {
    role: "user",
    parts: [{ text: "a heart shape" }],
  },
  {
    role: "model",
    parts: [
      {
        text: "M150,100 C100,50 50,100 50,150 C50,200 100,250 150,300 C200,250 250,200 250,150 C250,100 200,50 150,100 Z",
      },
    ],
  },
  {
    role: "user",
    parts: [{ text: "a simple house" }],
  },
  {
    role: "model",
    parts: [
      {
        text: "M100,250 L100,150 L150,100 L200,150 L200,250 Z M90,250 L210,250",
      },
    ],
  },
];

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { prompt } = data;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    // Start a chat session with the pre-defined history of examples
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.4,
      },
      safetySettings,
    });

    // Send the user's actual prompt as a new message in the chat
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    const svgPath = response.text().trim();

    if (!svgPath) {
      return NextResponse.json(
        { error: "Failed to generate SVG path from model response" },
        { status: 500 }
      );
    }

    return NextResponse.json({ svgPath }, { status: 200 });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}