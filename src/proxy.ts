import { NextRequest } from "next/server";

export const config = {
  matcher: ["/api/:path*"],   // only proxy API routes
};

// 🚀 THIS is the required function export
export default async function proxy(req: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL; // e.g. http://localhost:8000
    const url = new URL(req.url);

    // Rewrite the hostname & port to your backend server
    const backend = new URL(backendUrl);
    url.hostname = backend.hostname;
    url.port = backend.port;
    url.protocol = backend.protocol;

    // Forward the request to FastAPI
    return fetch(url.toString(), {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });

  } catch (err) {
    console.error("Proxy error:", err);
    return new Response("Proxy failed", { status: 500 });
  }
}
