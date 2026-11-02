import { forward } from "@/lib/backend";

export const dynamic = "force-dynamic";

// Screenshot -> fields. The Gemini call happens in the Python backend (backend/app/extract.py).
export async function POST(request) {
  const incoming = await request.formData();
  const file = incoming.get("image");
  if (!file) return Response.json({ error: "No image provided" }, { status: 400 });

  const out = new FormData();
  out.append("image", file, file.name || "upload.png");
  return forward("/api/extract", { method: "POST", body: out });
}
