import { NextResponse } from "next/server";
import { fetchCatalogueServer } from "@/lib/api";

// Runtime proxy: the browser calls this same-origin route, which forwards to
// the internal backend (URL read from env at request time). This keeps the app
// on a single public domain with no CORS and no build-time backend URL.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchCatalogueServer();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Upstream catalogue unavailable" },
      { status: 502 },
    );
  }
}
