// app/api/chat/route.js
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User"; // For credit deduction
import { model as geminiModel } from "@/lib/geminiClient"; // Assuming geminiClient.js is in lib/
import { NextResponse } from "next/server";

// Helper function for credit check (can be moved to a utility file)
async function checkAndDeductUserCredits(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found for credit check");
    err.status = 404;
    throw err;
  }
  if (user.credits < 1) {
    // Each chat interaction costs 1 credit
    const err = new Error("Insufficient credits to chat.");
    err.status = 403; // Or 402 Payment Required
    err.credits = user.credits; // Send current credits back
    throw err;
  }
  user.credits -= 1;
  await user.save();
  return user.credits; // Return updated credits
}

export async function POST(request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();

    // --- Credit Check and Deduction ---
    let updatedCredits;
    try {
      updatedCredits = await checkAndDeductUserCredits(userId);
    } catch (creditError) {
      return NextResponse.json(
        { message: creditError.message, credits: creditError.credits },
        { status: creditError.status || 403 }
      );
    }
    // --- End Credit Check ---

    const { message, history: clientHistoryArray } = await request.json();

    if (!message) {
      return NextResponse.json(
        { message: "Message is required" },
        { status: 400 }
      );
    }

    // Map client history (sender/text) to Gemini history (role/parts)
    let geminiFormattedHistory = Array.isArray(clientHistoryArray)
      ? clientHistoryArray.map((msg) => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        }))
      : [];

    // Validate and prepare history for Gemini
    let historyForGemini = [];
    if (geminiFormattedHistory.length > 0) {
      let startIndex = 0;
      if (geminiFormattedHistory[0].role !== "user") {
        startIndex = geminiFormattedHistory.findIndex((h) => h.role === "user");
        if (startIndex === -1) startIndex = geminiFormattedHistory.length;
      }
      for (let i = startIndex; i < geminiFormattedHistory.length; i++) {
        if (historyForGemini.length === 0) {
          if (geminiFormattedHistory[i].role === "user") {
            historyForGemini.push(geminiFormattedHistory[i]);
          }
        } else if (
          geminiFormattedHistory[i].role !==
          historyForGemini[historyForGemini.length - 1].role
        ) {
          historyForGemini.push(geminiFormattedHistory[i]);
        } else {
          break;
        }
      }
    }

    const chatSession = geminiModel.startChat({
      history: historyForGemini,
      generationConfig: { temperature: 0.7 },
      // System instruction is part of the geminiModel instance from geminiClient.js
    });

    const result = await chatSession.sendMessage(message);
    const response = result.response;
    const botResponseText = response.text();

    return NextResponse.json({
      reply: botResponseText,
      currentCredits: updatedCredits, // Send updated credits back to client
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    // Check if it's a GoogleGenerativeAIError for more specific feedback
    if (
      error.name === "GoogleGenerativeAIError" ||
      error.message?.includes("[GoogleGenerativeAI Error]")
    ) {
      return NextResponse.json(
        { message: `Gemini API Error: ${error.message}` },
        { status: 400 }
      );
    }
    // General server error
    return NextResponse.json(
      { message: "Error communicating with the AI.", error: error.message },
      { status: 500 }
    );
  }
}
