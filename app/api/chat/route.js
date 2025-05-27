// app/api/chat/route.js
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User"; // For credit deduction
import { model as geminiModel } from "@/lib/geminiClient";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Ensures the route is re-evaluated on every request

async function fetchUserForChat(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return user;
}

// Helper function for credit check (can be moved to a utility file)
async function checkAndDeductUserCredits(userInstance) {
  // Now takes user instance
  if (userInstance.isBlacklisted) {
    // Check blacklist status
    const err = new Error(
      "Your account has been restricted from using this feature."
    );
    err.status = 403; // Forbidden
    throw err;
  }
  if (userInstance.credits < 1) {
    const err = new Error("Insufficient credits to chat.");
    err.status = 403; // Or 402 Payment Required
    err.credits = userInstance.credits;
    throw err;
  }
  userInstance.credits -= 1;
  await userInstance.save();
  return userInstance.credits;
}

export async function POST(request) {
  let updatedCredits; // <<< DECLARE updatedCredits HERE, in the higher scope

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
    try {
      const userForChat = await fetchUserForChat(userId); // Fetch user once
      // Assign to the already declared updatedCredits
      updatedCredits = await checkAndDeductUserCredits(userForChat); // <<< ASSIGN VALUE HERE
    } catch (creditError) {
      // Ensure client knows about potential credit update even on error
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
      generationConfig: { temperature: 0 },
      // System instruction is part of the geminiModel instance from geminiClient.js
    });

    const result = await chatSession.sendMessage(message);
    const response = result.response;
    const botResponseText = response.text();

    return NextResponse.json({
      reply: botResponseText,
      currentCredits: updatedCredits, // Now updatedCredits is accessible here
    });
  } catch (error) {
    console.error("POST /api/chat error:", error); // Log the full error object for more details
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
    // This specific check for blacklist error might not be needed if the creditError catch handles it.
    // However, if other parts of the main try block could throw this, it's fine.
    if (
      error.message ===
      "Your account has been restricted from using this feature."
    ) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    // General server error
    return NextResponse.json(
      { message: "Error communicating with the AI.", error: error.message },
      { status: 500 }
    );
  }
}
