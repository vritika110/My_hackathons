import nodemailer from "nodemailer";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "hackathons.json");
const DEMO_MODE = process.env.DEMO_MODE === "true";

async function readData() {
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export async function GET(request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "demo-cron-secret";
  if (authHeader !== `Bearer ${cronSecret}` && !DEMO_MODE) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const hackathons = await readData();
    const approaching = [];

    for (const h of hackathons) {
      const regDays = daysUntil(h.registrationDeadline);
      const subDays = daysUntil(h.submissionDeadline);

      // Alert if deadline is within 3 days
      if (regDays >= 0 && regDays <= 3) {
        approaching.push({
          hackathon: h,
          type: "registration",
          daysLeft: regDays,
        });
      }
      if (subDays >= 0 && subDays <= 3) {
        approaching.push({
          hackathon: h,
          type: "submission",
          daysLeft: subDays,
        });
      }
    }

    if (approaching.length === 0) {
      return Response.json({ message: "No approaching deadlines", sent: 0 });
    }

    // Demo mode: just log, don't actually send email
    if (DEMO_MODE || !process.env.SMTP_PASS) {
      console.log(
        "DEMO: Would send alerts for:",
        approaching.map((a) => `${a.hackathon.name} (${a.type})`)
      );
      return Response.json({
        message: "Demo mode — emails logged to console",
        approaching: approaching.length,
        demo: true,
      });
    }

    // Real email sending
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const alertRows = approaching
      .map(
        (a) => `
      <tr style="border-bottom: 1px solid #333;">
        <td style="padding: 12px; color: #a78bfa; font-weight: bold;">${a.hackathon.name}</td>
        <td style="padding: 12px; color: #f472b6;">${a.type === "registration" ? "🔔 Registration" : "📤 Submission"}</td>
        <td style="padding: 12px; color: ${a.daysLeft === 0 ? "#ef4444" : a.daysLeft <= 1 ? "#f97316" : "#facc15"}; font-weight: bold;">
          ${a.daysLeft === 0 ? "TODAY!" : a.daysLeft === 1 ? "Tomorrow!" : `${a.daysLeft} days`}
        </td>
        <td style="padding: 12px; color: #94a3b8;">${a.daysLeft === 0 ? "Ends today" : new Date(a.hackathon[a.type === "registration" ? "registrationDeadline" : "submissionDeadline"]).toLocaleDateString()}</td>
      </tr>`
      )
      .join("");

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background: #0f0f1a; color: #e2e8f0; font-family: 'Inter', sans-serif; padding: 32px;">
  <div style="max-width: 640px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid #6d28d9;">
    <div style="background: linear-gradient(135deg, #6d28d9, #be185d); padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px;">⚡ Hackathon Deadline Alert</h1>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8);">Deadlines approaching — don't miss out!</p>
    </div>
    <div style="padding: 32px;">
      <table style="width: 100%; border-collapse: collapse; background: #0f0f1a; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #1e1b4b;">
            <th style="padding: 12px; text-align: left; color: #a78bfa;">Hackathon</th>
            <th style="padding: 12px; text-align: left; color: #a78bfa;">Type</th>
            <th style="padding: 12px; text-align: left; color: #a78bfa;">Time Left</th>
            <th style="padding: 12px; text-align: left; color: #a78bfa;">Date</th>
          </tr>
        </thead>
        <tbody>${alertRows}</tbody>
      </table>
      <div style="margin-top: 24px; padding: 16px; background: #1e1b4b; border-radius: 8px; border-left: 4px solid #6d28d9;">
        <p style="margin: 0; color: #c4b5fd;">💡 Log in to your Hackathon Manager to take action!</p>
      </div>
    </div>
    <div style="padding: 16px 32px; background: #0f0f1a; text-align: center; color: #475569; font-size: 12px;">
      Sent automatically by Hackathon Manager • vritika110@gmail.com
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"Hackathon Manager ⚡" <${process.env.SMTP_USER}>`,
      to: process.env.ALERT_EMAIL,
      subject: `⚡ ${approaching.length} Hackathon Deadline(s) Approaching!`,
      html,
    });

    return Response.json({
      message: "Alert email sent successfully",
      approaching: approaching.length,
    });
  } catch (error) {
    console.error("Alert error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
