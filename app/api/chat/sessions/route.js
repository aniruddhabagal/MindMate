// app/api/chat/sessions/route.js
import dbConnect from "@/lib/dbConnect";
import ChatSession from "@/models/ChatSession";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );

    await dbConnect();
    const sessions = await ChatSession.find({ user: userId })
      .sort({ lastActivity: -1 }) // Show most recent first
      .select("title lastActivity createdAt _id messagesCount"); // Select only necessary fields for listing
    // If you add a messagesCount virtual or field, you can select it. Or get first few messages.

    // For a preview, you might want to get the last message of each session
    const sessionsWithPreview = sessions.map((session) => {
      const lastMsg =
        session.messages && session.messages.length > 0
          ? session.messages[session.messages.length - 1].text
          : "No messages yet.";
      return {
        _id: session._id,
        title: session.title,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        preview: lastMsg.substring(0, 50) + (lastMsg.length > 50 ? "..." : ""),
      };
    });

    return NextResponse.json(sessionsWithPreview); // Or just 'sessions' if preview is too much for this route
  } catch (error) {
    console.error("GET /api/chat/sessions error:", error);
    return NextResponse.json(
      { message: "Error fetching chat sessions", error: error.message },
      { status: 500 }
    );
  }
}
