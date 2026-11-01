import { checkAndSendDeadlineAlerts } from "@/lib/alerts";

export async function GET(request) {
  // Check authorization header for cron jobs if CRON_SECRET is configured
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "demo-cron-secret";
  const isDemo = process.env.DEMO_MODE === "true";

  // Allow call if cron secret matches or in demo mode
  if (authHeader !== `Bearer ${cronSecret}` && !isDemo) {
    // Also allow internal dashboard test clicks
    const referer = request.headers.get("referer");
    if (!referer) {
      return Response.json({ error: "Unauthorized cron trigger" }, { status: 401 });
    }
  }

  try {
    const result = await checkAndSendDeadlineAlerts();
    return Response.json(result);
  } catch (error) {
    console.error("Alert route error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  // Allow manual trigger via POST as well
  return GET(request);
}
