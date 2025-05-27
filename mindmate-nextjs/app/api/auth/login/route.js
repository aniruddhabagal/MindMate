// app/api/auth/login/route.js
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
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

    const user = await User.findOne({ username: username.toLowerCase() });

    if (user && (await user.comparePassword(password))) {
      return NextResponse.json({
        _id: user._id,
        username: user.username,
        token: generateToken(user._id),
        credits: user.credits,
        message: "Login successful",
      });
    } else {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { message: "Server error during login", error: error.message },
      { status: 500 }
    );
  }
}
