// middleware.js (at the root of your project)
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
const JWT_SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
    return payload; // payload now contains { userId, role, iat, exp }
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
  const requestHeaders = new Headers(request.headers);

  const protectedPaths = [
    "/api/moods",
    "/api/journal",
    "/api/chat",
    "/api/auth/me",
  ];
  const adminApiPaths = ["/api/admin"];

  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );
  const isAdminApiPath = adminApiPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath || isAdminApiPath) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;
    const decodedPayload = await verifyToken(token);

    if (!decodedPayload || !decodedPayload.userId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    requestHeaders.set("x-user-id", decodedPayload.userId);

    if (isAdminApiPath) {
      if (decodedPayload.role !== "admin") {
        // Check role from JWT payload
        console.log(
          `Middleware: Forbidden access to admin path ${pathname} by user ${decodedPayload.userId} (role: ${decodedPayload.role})`
        );
        return NextResponse.json(
          { message: "Forbidden: Admin access required" },
          { status: 403 }
        );
      }
      requestHeaders.set("x-user-role", decodedPayload.role);
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/api/:path*"], // Apply middleware to all /api routes
};
