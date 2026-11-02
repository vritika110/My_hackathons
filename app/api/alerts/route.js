import { forward } from "@/lib/backend";

export const dynamic = "force-dynamic";

// Called by (a) the Vercel cron in vercel.json, with "Authorization: Bearer <CRON_SECRET>",
// and (b) the "Test Alerts" button on the dashboard.
async function handle(request) {
  const cronSecret = process.env.CRON_SECRET;
  const bearer = request.headers.get("authorization") === `Bearer ${cronSecret}`;
  const fromDashboard = !!request.headers.get("referer"); // same-origin click on the dashboard button

  if (!(cronSecret && bearer) && !fromDashboard) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const test = new URL(request.url).searchParams.get("test") === "true";
  return forward(`/api/alerts${test ? "?test=true" : ""}`);
}

export const GET = handle;
export const POST = handle;
