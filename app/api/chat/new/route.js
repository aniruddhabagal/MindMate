// app/api/chat/new/route.js
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import ChatSession from "@/models/ChatSession";
import { model as geminiModel } from "@/lib/geminiClient";
import { NextResponse } from "next/server";

// --- Helper Functions (Consider moving to a shared util if used elsewhere) ---
async function fetchUserForInteraction(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404; // Not Found
    throw err;
  }
  return user;
}

async function checkAndDeductUserCredits(userInstance) {
  if (userInstance.isBlacklisted) {
    const err = new Error(
      "Your account has been restricted from using this feature."
    );
    err.status = 403; // Forbidden
    throw err;
  }
  if (userInstance.credits < 1) {
    const err = new Error("Insufficient credits to start a new chat.");
    err.status = 402; // Payment Required (or 403 Forbidden)
    err.credits = userInstance.credits; // Send current credits back
    throw err;
  }
  userInstance.credits -= 1;
  await userInstance.save();
  return userInstance.credits;
}
// --- End Helper Functions ---

export async function POST(request) {
  let currentCreditsAfterDeduction; // To store the credits after deduction

  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await fetchUserForInteraction(userId);
    currentCreditsAfterDeduction = await checkAndDeductUserCredits(user);

    const { firstMessage } = await request.json(); // User's optional first message when starting a new chat

    let initialMessagesForSession = [];
    let geminiHistoryForNewChat = [];

    // The message to actually send to Gemini for its first response
    // If user provides a first message, use that. Otherwise, a generic "Hello" can prompt the bot.
    let messageForGeminiToProcess = "Hello";

    if (firstMessage && firstMessage.trim() !== "") {
      messageForGeminiToProcess = firstMessage.trim();
      initialMessagesForSession.push({
        sender: "user",
        text: messageForGeminiToProcess,
      });
      // For Gemini, the history for startChat should be empty if this is the very first user turn
      // OR it can contain previous turns if this 'new' chat is conceptually branching.
      // For a truly new chat, history is empty, and sendMessage provides the first user turn.
    }

    // Start a chat session with Gemini.
    // System instruction is already part of geminiModel.
    // History is empty for a brand new chat, as the 'messageForGeminiToProcess' will be the first 'user' part.
    const chat = geminiModel.startChat({
      history: geminiHistoryForNewChat, // Empty for a truly new session started by user's message
      generationConfig: { temperature: 0.7 },
    });

    const result = await chat.sendMessage(messageForGeminiToProcess);
    const botResponseText = result.response.text();

    // Add bot's response to our session messages
    initialMessagesForSession.push({ sender: "bot", text: botResponseText });

    // Create and save the new ChatSession document
    const newChatSessionDoc = new ChatSession({
      user: userId,
      messages: initialMessagesForSession,
      // Title will be auto-set by pre-save hook based on first user message,
      // or you can set a default if no user message.
    });

    if (
      newChatSessionDoc.title === "New Chat Session" &&
      initialMessagesForSession.length > 0
    ) {
      // If pre-save didn't catch it (e.g. first message was bot if we forced one), set a generic title
      const firstUserMsg = initialMessagesForSession.find(
        (m) => m.sender === "user"
      );
      if (firstUserMsg) {
        newChatSessionDoc.title =
          firstUserMsg.text.substring(0, 50) +
          (firstUserMsg.text.length > 50 ? "..." : "");
      } else {
        newChatSessionDoc.title = `Chat from ${new Date().toLocaleDateString()}`;
      }
    }

    await newChatSessionDoc.save();

    return NextResponse.json(
      {
        reply: botResponseText, // The first bot reply to the user
        sessionId: newChatSessionDoc._id,
        sessionTitle: newChatSessionDoc.title,
        messages: newChatSessionDoc.messages, // The initial messages (user's first + bot's reply)
        currentCredits: currentCreditsAfterDeduction,
      },
      { status: 201 }
    ); // 201 Created for new resource
  } catch (error) {
    console.error("POST /api/chat/new error:", error);
    if (error.status) {
      // Errors thrown by helper functions
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
      ); // 502 Bad Gateway if LLM fails
    }
    return NextResponse.json(
      {
        message: "Server error: Could not start new chat session.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
