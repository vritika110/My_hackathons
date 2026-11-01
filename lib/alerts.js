import nodemailer from "nodemailer";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "hackathons.json");
export const TARGET_ALERT_EMAIL = "vritika110@gmail.com";

export function calculateDaysRemaining(dateStr) {
  if (!dateStr) return Infinity;
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length < 3 || isNaN(parts[0])) return Infinity;
    const target = new Date(parts[0], parts[1] - 1, parts[2]);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((target - today) / (1000 * 60 * 60 * 24));
  } catch {
    return Infinity;
  }
}

export async function readHackathons() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function checkAndSendDeadlineAlerts(customHackathons = null) {
  const hackathons = customHackathons || (await readHackathons());
  const approaching = [];

  for (const h of hackathons) {
    const regDays = calculateDaysRemaining(h.registrationDeadline);
    const subDays = calculateDaysRemaining(h.submissionDeadline);

    // Alert if registration deadline is today or within 3 days
    if (regDays >= 0 && regDays <= 3) {
      approaching.push({
        hackathon: h,
        type: "registration",
        daysLeft: regDays,
        deadline: h.registrationDeadline,
      });
    }

    // Alert if submission deadline is today or within 3 days
    if (subDays >= 0 && subDays <= 3) {
      approaching.push({
        hackathon: h,
        type: "submission",
        daysLeft: subDays,
        deadline: h.submissionDeadline,
      });
    }
  }

  const isDemo = process.env.DEMO_MODE === "true" || !process.env.SMTP_PASS;
  const recipient = process.env.ALERT_EMAIL || TARGET_ALERT_EMAIL;

  if (approaching.length === 0) {
    return {
      message: "No deadlines approaching within 3 days.",
      approachingCount: 0,
      items: [],
      sent: false,
    };
  }

  if (isDemo) {
    console.log(
      `[ALERT WORKER] Found ${approaching.length} approaching deadline(s) for ${recipient}:`
    );
    approaching.forEach((a) => {
      console.log(
        ` - ${a.hackathon.name} | ${a.type.toUpperCase()} deadline: ${
          a.daysLeft === 0 ? "TODAY" : `${a.daysLeft} day(s) left`
        } (${a.deadline})`
      );
    });
    return {
      message: `Demo mode: ${approaching.length} deadline alert(s) logged (SMTP not configured).`,
      approachingCount: approaching.length,
      items: approaching,
      sent: false,
      demo: true,
      recipient,
    };
  }

  // Create Nodemailer Transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || TARGET_ALERT_EMAIL,
      pass: process.env.SMTP_PASS,
    },
  });

  const alertRows = approaching
    .map((a) => {
      const urgencyColor =
        a.daysLeft === 0
          ? "#ef4444"
          : a.daysLeft === 1
          ? "#f97316"
          : "#facc15";
      const urgencyText =
        a.daysLeft === 0
          ? "TODAY!"
          : a.daysLeft === 1
          ? "Tomorrow!"
          : `${a.daysLeft} days left`;
      const dateLabel = new Date(a.deadline).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      return `
      <tr style="border-bottom: 1px solid #2d2b52;">
        <td style="padding: 14px 12px; color: #f8fafc; font-weight: bold; font-size: 14px;">${a.hackathon.name}</td>
        <td style="padding: 14px 12px; color: #c084fc; font-size: 13px;">${a.type === "registration" ? "🔔 Registration" : "📤 Submission"}</td>
        <td style="padding: 14px 12px; color: ${urgencyColor}; font-weight: bold; font-size: 13px;">${urgencyText}</td>
        <td style="padding: 14px 12px; color: #94a3b8; font-size: 13px;">${dateLabel}</td>
      </tr>`;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Hackathon Deadline Alert</title>
</head>
<body style="margin: 0; padding: 32px; background: #080812; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #121226; border-radius: 20px; overflow: hidden; border: 1px solid #7c3aed40; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #7c3aed, #ec4899); padding: 36px 28px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: -0.02em;">⚡ HackTracker Alert</h1>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
        ${approaching.length} deadline${approaching.length > 1 ? "s are" : " is"} approaching — act now!
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 28px;">
      <table style="width: 100%; border-collapse: collapse; background: #0a0a16; border-radius: 12px; overflow: hidden; border: 1px solid #1f1d38;">
        <thead>
          <tr style="background: #171530;">
            <th style="padding: 12px; text-align: left; color: #a78bfa; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Hackathon</th>
            <th style="padding: 12px; text-align: left; color: #a78bfa; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Type</th>
            <th style="padding: 12px; text-align: left; color: #a78bfa; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Time Left</th>
            <th style="padding: 12px; text-align: left; color: #a78bfa; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Deadline</th>
          </tr>
        </thead>
        <tbody>
          ${alertRows}
        </tbody>
      </table>

      <!-- Call to Action -->
      <div style="margin-top: 28px; text-align: center;">
        <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; padding: 14px 28px; rounded-radius: 12px; border-radius: 10px;">
          Open HackTracker Dashboard ➔
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 16px 28px; background: #080812; text-align: center; color: #64748b; font-size: 11px; border-top: 1px solid #171530;">
      Automated alert generated for ${recipient} · HackTracker Personal Dashboard
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"HackTracker Alerts ⚡" <${process.env.SMTP_USER || TARGET_ALERT_EMAIL}>`,
    to: recipient,
    subject: `⚡ [Deadline Alert] ${approaching.length} Hackathon Deadline(s) Approaching!`,
    html,
  });

  return {
    message: `Alert email sent successfully to ${recipient}`,
    approachingCount: approaching.length,
    items: approaching,
    sent: true,
    recipient,
  };
}
