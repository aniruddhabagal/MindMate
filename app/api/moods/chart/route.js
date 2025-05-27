// app/api/moods/chart/route.js
import dbConnect from "@/lib/dbConnect";
import MoodEntry from "@/models/MoodEntry";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Ensures the route is re-evaluated on every request

export async function GET(request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam) : 7;

    if (isNaN(days) || days <= 0) {
      return NextResponse.json(
        { message: "Invalid days parameter" },
        { status: 400 }
      );
    }

    await dbConnect();

    const endDate = new Date(); // Today (end of day for inclusiveness if needed, but start of day is fine too)
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1); // +1 to include current day fully if filtering from start of day
    startDate.setHours(0, 0, 0, 0); // Start of the (N-days ago) day

    const moodEntries = await MoodEntry.find({
      user: userId,
      entryDate: {
        $gte: startDate,
        $lte: new Date(endDate.setHours(23, 59, 59, 999)),
      }, // Ensure current day is included fully
    }).sort({ entryDate: "asc" }); // Sort oldest first for charting

    return NextResponse.json(moodEntries);
  } catch (error) {
    console.error("GET /api/moods/chart error:", error);
    return NextResponse.json(
      {
        message: "Server error fetching mood chart data",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
