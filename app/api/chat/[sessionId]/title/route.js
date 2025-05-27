// app/api/chat/[sessionId]/title/route.js
import dbConnect from "@/lib/dbConnect";
import ChatSession from "@/models/ChatSession";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function PUT(request, { params }) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const { sessionId } = params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { message: "Invalid session ID format" },
        { status: 400 }
      );
    }

    const { title } = await request.json();
    if (
      !title ||
      typeof title !== "string" ||
      title.trim().length === 0 ||
      title.trim().length > 100
    ) {
      return NextResponse.json(
        { message: "Valid title is required (1-100 characters)" },
        { status: 400 }
      );
    }

    await dbConnect();
    const updatedSession = await ChatSession.findOneAndUpdate(
      { _id: sessionId, user: userId }, // Ensure user owns the session
      { $set: { title: title.trim() } },
      { new: true, runValidators: true } // Return updated doc, run schema validators
    ).select("_id title"); // Only return necessary fields

    if (!updatedSession) {
      return NextResponse.json(
        { message: "Chat session not found or not authorized to update" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error(`PUT /api/chat/${params.sessionId}/title error:`, error);
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: "Validation Error", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Server error updating chat title", error: error.message },
      { status: 500 }
    );
  }
}
