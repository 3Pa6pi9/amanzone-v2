import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "AI is currently offline (Missing API Key)." }, { status: 503 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // The core identity of your AmanZone AI
    const systemPrompt = `
      You are the AmanZone AI Assistant, a helpful, polite, and expert virtual assistant for AmanZone Trading PLC in Ethiopia. 
      You help customers with construction materials like steel (ብረት), roofing sheets (ቆርቆሮ), timber (ጣውላ), MDF, and gypsum.
      You are 'Habesha friendly': you understand and can fluently respond in both English and Amharic. 
      If a user asks in Amharic, respond in Amharic. If they ask in English, respond in English.
      Keep your answers concise, professional, and directly related to Ethiopian construction and building materials.
      Prices are always discussed in ETB (Ethiopian Birr).
      Do not hallucinate specific inventory prices unless you give a general estimate, but encourage them to check the live catalog.
    `;

    // Format the conversation history for Gemini
    const formattedHistory = history.map((msg: any) => ({
      role: msg.role === "ai" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I am the AmanZone AI. I am ready to help." }] },
        ...formattedHistory
      ],
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    return NextResponse.json({ response: responseText }, { status: 200 });

  } catch (error) {
    console.error("AI Chat Error:", error);
    return NextResponse.json({ error: "Failed to generate AI response." }, { status: 500 });
  }
}