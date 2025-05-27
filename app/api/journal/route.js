// app/api/journal/route.js
import dbConnect from "@/lib/dbConnect";
import JournalEntry from "@/models/JournalEntry"; // Adjust path
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Ensures the route is re-evaluated on every request

// --- Create a new journal entry ---
export async function POST(request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );

    await dbConnect();
    const { title, content, entryDate, associatedMood } = await request.json();

    if (!content) {
      return NextResponse.json(
        { message: "Content is required for a journal entry" },
        { status: 400 }
      );
    }

    const newJournalEntry = new JournalEntry({
      user: userId,
      title: title || "Untitled Entry",
      content,
      entryDate: entryDate ? new Date(entryDate) : new Date(),
      associatedMood: associatedMood || "", // Ensure it's a string, or handle allowed enum values
    });

    const savedEntry = await newJournalEntry.save();
    return NextResponse.json(savedEntry, { status: 201 });
  } catch (error) {
    console.error("POST /api/journal error:", error);
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: "Validation Error", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Server error creating journal entry", error: error.message },
      { status: 500 }
    );
  }
}

// --- Get all journal entries for the user ---
export async function GET(request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );

    await dbConnect();
    const journalEntries = await JournalEntry.find({ user: userId }).sort({
      entryDate: -1,
    }); // Newest first
    return NextResponse.json(journalEntries, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("GET /api/journal error:", error);
    return NextResponse.json(
      {
        message: "Server error fetching journal entries",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
