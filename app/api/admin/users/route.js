// app/api/admin/users/route.js
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { NextResponse } from "next/server";

// GET all users (for admin)
export async function GET(request) {
  // The 'x-user-role' header would have been set by middleware if admin check passed
  // For simplicity, we can also re-verify here or just trust the path protection
  // but the middleware should have already blocked non-admins.
  const userRole = request.headers.get("x-user-role");
  if (userRole !== "admin") {
    // Redundant if middleware is perfectly configured, but good defense
    return NextResponse.json(
      { message: "Forbidden: Admin access required" },
      { status: 403 }
    );
  }

  try {
    await dbConnect();
    // Example: Pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select("-password") // Exclude passwords
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments({});

    return NextResponse.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { message: "Server error fetching users", error: error.message },
      { status: 500 }
    );
  }
}
