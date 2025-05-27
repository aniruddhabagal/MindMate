// app/api/journal/[id]/route.js
import dbConnect from "@/lib/dbConnect";
import JournalEntry from "@/models/JournalEntry";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// --- Get a single journal entry by ID ---
export async function GET(request, { params }) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid journal entry ID format" },
        { status: 400 }
      );
    }

    await dbConnect();
    const entry = await JournalEntry.findOne({ _id: id, user: userId });

    if (!entry) {
      return NextResponse.json(
        { message: "Journal entry not found or not authorized" },
        { status: 404 }
      );
    }
    return NextResponse.json(entry);
  } catch (error) {
    console.error(`GET /api/journal/${params.id} error:`, error);
    return NextResponse.json(
      { message: "Server error fetching journal entry", error: error.message },
      { status: 500 }
    );
  }
}

// --- Update a journal entry ---
export async function PUT(request, { params }) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid journal entry ID format" },
        { status: 400 }
      );
    }

    await dbConnect();
    const { title, content, associatedMood } = await request.json();

    // Find the entry and ensure it belongs to the user
    let entry = await JournalEntry.findOne({ _id: id, user: userId });

    if (!entry) {
      return NextResponse.json(
        { message: "Journal entry not found or not authorized to update" },
        { status: 404 }
      );
    }

    // Update fields if they are provided
    if (title !== undefined) entry.title = title || "Untitled Entry"; // Allow clearing title to default
    if (content !== undefined) entry.content = content;
    if (associatedMood !== undefined) entry.associatedMood = associatedMood;

    const updatedEntry = await entry.save();
    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error(`PUT /api/journal/${params.id} error:`, error);
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: "Validation Error", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Server error updating journal entry", error: error.message },
      { status: 500 }
    );
  }
}

// --- Delete a journal entry ---
export async function DELETE(request, { params }) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid journal entry ID format" },
        { status: 400 }
      );
    }

    await dbConnect();
    const result = await JournalEntry.deleteOne({ _id: id, user: userId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Journal entry not found or not authorized to delete" },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "Journal entry removed successfully" }); // Status 200 OK is fine, or 204 No Content
    // If using 204: return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`DELETE /api/journal/${params.id} error:`, error);
    return NextResponse.json(
      { message: "Server error deleting journal entry", error: error.message },
      { status: 500 }
    );
  }
}
