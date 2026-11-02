// Server-side helper: forwards a request from a Next.js API route to the Python backend.
const BACKEND_URL = (process.env.BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function forward(path, { method = "GET", body, headers = {} } = {}) {
  const h = { ...headers };
  if (process.env.BACKEND_API_KEY) h["X-API-Key"] = process.env.BACKEND_API_KEY;

  let res;
  try {
    res = await fetch(`${BACKEND_URL}${path}`, { method, body, headers: h, cache: "no-store" });
  } catch {
    return Response.json(
      {
        error: `Cannot reach the Python backend at ${BACKEND_URL}. Is it running? (cd backend && uvicorn app.main:app)`,
      },
      { status: 502 }
    );
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { error: text || `Backend returned ${res.status}` };
  }
  // FastAPI reports errors as {detail: "..."}; the UI reads {error: "..."}
  if (!res.ok && json && json.detail && !json.error) json.error = String(json.detail);
  return Response.json(json, { status: res.status });
}
