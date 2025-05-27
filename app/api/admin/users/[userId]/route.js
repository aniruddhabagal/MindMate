// app/api/admin/users/[userId]/route.js
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export const dynamic = "force-dynamic"; // Ensures the route is re-evaluated on every request

// PUT to update a user's details (e.g., credits, role, blacklist status)
export async function PUT(request, { params }) {
  const adminRole = request.headers.get("x-user-role");
  if (adminRole !== "admin") {
    return NextResponse.json(
      { message: "Forbidden: Admin access required" },
      { status: 403 }
    );
  }

  const { userId } = params; // This is the ID of the user being edited

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json(
      { message: "Invalid user ID format" },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    const updates = await request.json(); // { credits, role, isBlacklisted }

    // Validate and sanitize updates
    const allowedUpdates = {};
    if (
      updates.credits !== undefined &&
      typeof updates.credits === "number" &&
      updates.credits >= 0
    ) {
      allowedUpdates.credits = updates.credits;
    }
    if (updates.role && ["user", "admin"].includes(updates.role)) {
      allowedUpdates.role = updates.role;
    }
    if (
      updates.isBlacklisted !== undefined &&
      typeof updates.isBlacklisted === "boolean"
    ) {
      allowedUpdates.isBlacklisted = updates.isBlacklisted;
    }
    // Add more fields here if needed, e.g., username, but be careful with unique fields.

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { message: "No valid update fields provided" },
        { status: 400 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(`PUT /api/admin/users/${userId} error:`, error);
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: "Validation Error", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Server error updating user", error: error.message },
      { status: 500 }
    );
  }
}
