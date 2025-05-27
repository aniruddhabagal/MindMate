// app/api/auth/me/route.js
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const userId = request.headers.get("x-user-id"); // Get from middleware

    if (!userId) {
      // This case should ideally be caught by middleware, but good to double check
      return NextResponse.json(
        { message: "Authentication required, user ID missing" },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      _id: user._id,
      username: user.username,
      createdAt: user.createdAt,
      credits: user.credits,
      role: user.role,
    });
  } catch (error) {
    console.error("/api/auth/me error:", error);
    return NextResponse.json(
      { message: "Server error fetching user profile", error: error.message },
      { status: 500 }
    );
  }
}
