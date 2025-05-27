// middleware.js (at the root of your project)
import { NextResponse } from "next/server";
import { jwtVerify } from "jose"; // Using 'jose' for JWT verification, more modern

const JWT_SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY, {
      // Specify expected algorithms if needed, e.g., algorithms: ['HS256']
    });
    return payload; // payload contains { userId, iat, exp }
  } catch (err) {
    console.error(
      "JWT Verification error in middleware:",
      err.code,
      err.message
    );
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Define protected paths
  const protectedPaths = [
    "/api/moods",
    "/api/journal",
    "/api/chat",
    "/api/auth/me",
  ];
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    const decodedPayload = await verifyToken(token);

    if (!decodedPayload || !decodedPayload.userId) {
      console.log(`Middleware: Unauthorized access to ${pathname}`);
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Add user ID to request headers so API routes can access it
    // This is a common pattern. API routes can then read 'x-user-id'.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", decodedPayload.userId);

    // For Next.js 13.3+ you might need to rewrite or use a different way to pass data
    // For older versions or if header modification is tricky:
    // One way is to not modify headers but rely on the fact that if middleware passes, route is protected.
    // Then in route, re-verify or trust the middleware (less ideal to re-verify).
    // A common pattern if you don't want to modify headers is to just let it pass if token is valid.
    // The API route can then re-verify or, for simplicity, assume if middleware passed, it's okay.
    // However, passing via header is cleaner if it works with your Next.js version.

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next(); // Continue to other routes/pages
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/api/:path*"], // Apply middleware to all /api routes
};
