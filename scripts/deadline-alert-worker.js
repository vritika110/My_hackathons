/**
 * Automated Background Deadline Alert Worker
 * Periodically checks data/hackathons.json for deadlines approaching <= 3 days
 * and sends an alert email to vritika110@gmail.com.
 *
 * Usage:
 *   node scripts/deadline-alert-worker.js --once     (runs once and exits)
 *   node scripts/deadline-alert-worker.js            (daemon mode: checks hourly)
 */

import { checkAndSendDeadlineAlerts, TARGET_ALERT_EMAIL } from "../lib/alerts.js";

const isOnce = process.argv.includes("--once");
const INTERVAL_MS = parseInt(process.env.ALERT_INTERVAL_MS || String(60 * 60 * 1000)); // Default: every 1 hour

async function runCheck() {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] ⚡ Checking for approaching hackathon deadlines...`);
  try {
    const res = await checkAndSendDeadlineAlerts();
    if (res.sent) {
      console.log(`✅ Success: Alert email sent to ${res.recipient} (${res.approachingCount} deadline(s)).`);
    } else if (res.demo) {
      console.log(`ℹ️ [Demo Mode]: ${res.message}`);
    } else {
      console.log(`✓ Up to date: ${res.message}`);
    }
  } catch (err) {
    console.error(`❌ Error during deadline alert check:`, err.message);
  }
}

async function main() {
  console.log("====================================================");
  console.log("  ⚡ HackTracker Automated Deadline Alert Worker");
  console.log(`  Target Recipient: ${process.env.ALERT_EMAIL || TARGET_ALERT_EMAIL}`);
  console.log(`  Mode: ${isOnce ? "Single Run (--once)" : `Continuous Daemon (every ${INTERVAL_MS / 60000} mins)`}`);
  console.log("====================================================");

  // Initial check on startup
  await runCheck();

  if (isOnce) {
    console.log("[ALERT WORKER] Single run completed. Exiting.");
    process.exit(0);
  }

  // Periodic daemon loop
  setInterval(async () => {
    await runCheck();
  }, INTERVAL_MS);
}

main().catch((err) => {
  console.error("Fatal worker error:", err);
  process.exit(1);
});

