import dbConnect from "@/lib/dbConnect"; // Adjust path if needed
import User from "@/models/User"; // Adjust path
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Ensures the route is re-evaluated on every request

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    // role included
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

export async function POST(request) {
  try {
    await dbConnect();
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Please provide username and password" },
        { status: 400 }
      );
    }

    const userExists = await User.findOne({ username: username.toLowerCase() });
    if (userExists) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 400 }
      );
    }

    const user = await User.create({
      username: username.toLowerCase(),
      password,
    }); // User model's pre-save hook will hash password

    if (user) {
      return NextResponse.json(
        {
          _id: user._id,
          username: user.username,
          token: generateToken(user._id, user.role), // Token contains role
          credits: user.credits,
          role: user.role,
          message: "User registered successfully",
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { message: "Invalid user data" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Registration API error:", error);
    return NextResponse.json(
      { message: "Server error during registration", error: error.message },
      { status: 500 }
    );
  }
}
