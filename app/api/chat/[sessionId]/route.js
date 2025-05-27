// app/api/chat/[sessionId]/route.js
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import ChatSession from "@/models/ChatSession";
import { model as geminiModel } from "@/lib/geminiClient";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// --- Helper Functions (same as in /new, consider moving to a shared util) ---
async function fetchUserForInteraction(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return user;
}
async function checkAndDeductUserCredits(userInstance) {
  if (userInstance.isBlacklisted) {
    const err = new Error(
      "Your account has been restricted from using this feature."
    );
    err.status = 403;
    throw err;
  }
  if (userInstance.credits < 1) {
    const err = new Error("Insufficient credits to continue chat.");
    err.status = 402;
    err.credits = userInstance.credits;
    throw err;
  }
  userInstance.credits -= 1;
  await userInstance.save();
  return userInstance.credits;
}
// --- End Helper Functions ---

// --- GET messages for a specific session ---
export async function GET(request, { params }) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );

    const { sessionId } = params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { message: "Invalid session ID format" },
        { status: 400 }
      );
    }

    await dbConnect();
    const session = await ChatSession.findOne({ _id: sessionId, user: userId });

    if (!session) {
      return NextResponse.json(
        { message: "Chat session not found or not authorized" },
        { status: 404 }
      );
    }
    return NextResponse.json(session); // Returns the whole session including all messages
  } catch (error) {
    console.error(`GET /api/chat/${params.sessionId} error:`, error);
    return NextResponse.json(
      { message: "Error fetching chat session messages", error: error.message },
      { status: 500 }
    );
  }
}

// --- POST a new message to an existing session ---
export async function POST(request, { params }) {
  let currentCreditsAfterDeduction;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );

    const { sessionId } = params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { message: "Invalid session ID format" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await fetchUserForInteraction(userId); // Fetch user for credit check
    currentCreditsAfterDeduction = await checkAndDeductUserCredits(user);

    const { message: newUserMessageText } = await request.json();
    if (!newUserMessageText || newUserMessageText.trim() === "") {
      return NextResponse.json(
        { message: "Message content is required" },
        { status: 400 }
      );
    }

    const session = await ChatSession.findOne({ _id: sessionId, user: userId });
    if (!session) {
      return NextResponse.json(
        { message: "Chat session not found or not authorized" },
        { status: 404 }
      );
    }

    // Prepare history for Gemini from existing session messages
    // Map 'bot' to 'model' for Gemini, and 'user' to 'user'
    const geminiHistoryFromDB = session.messages
      .map((msg) => ({
        role: msg.sender === "bot" ? "model" : "user", // Assuming sender is 'user' or 'bot'
        parts: [{ text: msg.text }],
      }))
      .slice(-20); // Send last N messages for context (e.g., last 20 parts = 10 user, 10 model turns)
    // Ensure this history is valid if necessary (starts with user, alternates).
    // If messages are always saved as user then bot, it should be fine.

    // Re-validate/prepare geminiHistoryFromDB strictly for Gemini
    let historyForGeminiStartChat = [];
    if (geminiHistoryFromDB.length > 0) {
      let startIndex = 0;
      if (geminiHistoryFromDB[0].role !== "user") {
        // Should ideally not happen if DB stores correctly
        startIndex = geminiHistoryFromDB.findIndex((h) => h.role === "user");
        if (startIndex === -1) startIndex = geminiHistoryFromDB.length;
      }
      for (let i = startIndex; i < geminiHistoryFromDB.length; i++) {
        if (historyForGeminiStartChat.length === 0) {
          if (geminiHistoryFromDB[i].role === "user")
            historyForGeminiStartChat.push(geminiHistoryFromDB[i]);
        } else if (
          geminiHistoryFromDB[i].role !==
          historyForGeminiStartChat[historyForGeminiStartChat.length - 1].role
        ) {
          historyForGeminiStartChat.push(geminiHistoryFromDB[i]);
        } else break;
      }
    }

    const chat = geminiModel.startChat({
      history: historyForGeminiStartChat,
      generationConfig: { temperature: 0.7 },
    });

    const result = await chat.sendMessage(newUserMessageText); // Send the new user message
    const botResponseText = result.response.text();

    // Add new user message and bot response to the session
    session.messages.push({ sender: "user", text: newUserMessageText.trim() });
    session.messages.push({ sender: "bot", text: botResponseText });
    // session.lastActivity is handled by pre-save hook
    await session.save();

    return NextResponse.json({
      reply: botResponseText, // The new bot reply
      currentCredits: currentCreditsAfterDeduction,
      // The client will append the user message and this bot reply to its local state
    });
  } catch (error) {
    console.error(`POST /api/chat/${params.sessionId} error:`, error);
    if (error.status) {
      // From credit/user check helper
      return NextResponse.json(
        { message: error.message, credits: error.credits },
        { status: error.status }
      );
    }
    if (
      error.name === "GoogleGenerativeAIError" ||
      error.message?.includes("[GoogleGenerativeAI Error]")
    ) {
      return NextResponse.json(
        { message: `Gemini API Error: ${error.message}` },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { message: "Error processing chat message", error: error.message },
      { status: 500 }
    );
  }
}
