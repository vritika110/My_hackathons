import { forward } from "@/lib/backend";

// All data now lives in the SQL database behind the Python backend (backend/).
export const dynamic = "force-dynamic";

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function GET() {
  return forward("/api/hackathons");
}

export async function POST(request) {
  return forward("/api/hackathons", { method: "POST", headers: JSON_HEADERS, body: await request.text() });
}

export async function PUT(request) {
  return forward("/api/hackathons", { method: "PUT", headers: JSON_HEADERS, body: await request.text() });
}

export async function DELETE(request) {
  const id = new URL(request.url).searchParams.get("id") || "";
  return forward(`/api/hackathons?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}
