// app/api/moods/route.js
import dbConnect from "@/lib/dbConnect";
import MoodEntry from "@/models/MoodEntry";
import { NextResponse } from "next/server";

// --- Create a new mood entry ---
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
    const { mood, score, notes, entryDate } = await request.json();

    if (!mood || score === undefined) {
      return NextResponse.json(
        { message: "Mood and score are required" },
        { status: 400 }
      );
    }
    if (typeof score !== "number" || score < 0 || score > 10) {
      return NextResponse.json(
        { message: "Score must be a number between 0 and 10" },
        { status: 400 }
      );
    }

    const newMoodEntry = new MoodEntry({
      user: userId,
      mood: mood.toLowerCase(), // Standardize mood input
      score,
      notes: notes || "",
      entryDate: entryDate ? new Date(entryDate) : new Date(), // Ensure valid date
    });

    const savedEntry = await newMoodEntry.save();
    return NextResponse.json(savedEntry, { status: 201 });
  } catch (error) {
    console.error("POST /api/moods error:", error);
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: "Validation Error", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Server error creating mood entry", error: error.message },
      { status: 500 }
    );
  }
}

// --- Get all mood entries for the user ---
export async function GET(request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();
    // Fetch entries for the logged-in user, sort by entryDate descending (newest first)
    const moodEntries = await MoodEntry.find({ user: userId }).sort({
      entryDate: -1,
    });
    return NextResponse.json(moodEntries);
  } catch (error) {
    console.error("GET /api/moods error:", error);
    return NextResponse.json(
      { message: "Server error fetching mood entries", error: error.message },
      { status: 500 }
    );
  }
}
