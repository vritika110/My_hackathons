import { GoogleGenerativeAI } from "@google/generative-ai";

function normalizeDate(dateVal) {
  if (!dateVal || typeof dateVal !== "string") return "";
  const trimmed = dateVal.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  try {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  } catch {}
  return "";
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    // Demo mode or missing API key fallback
    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        extracted: {
          name: "ETHGlobal AI Hackathon (Demo OCR)",
          platform: "Devpost",
          platformUrl: "https://ethglobal.com",
          registrationDeadline: "2026-11-20",
          submissionDeadline: "2026-11-22",
          prizePool: "$75,000",
          teamMembers: ["Vritika (Lead)", "Alex M."],
          description:
            "Demo OCR extract — set GEMINI_API_KEY in .env.local for live Gemini Vision extraction.",
        },
        demo: true,
      });
    }

    // Real Gemini Vision extraction
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/png";

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `You are an expert OCR and data extractor for hackathons.
Analyze this flyer, advertisement, or screenshot of a hackathon and extract the key information.
Output ONLY a JSON object matching this schema:
{
  "name": "string (name of the hackathon)",
  "platform": "string (Devpost, Devfolio, Unstop, etc.) or null",
  "platformUrl": "string (website URL) or null",
  "registrationDeadline": "string in YYYY-MM-DD format or null",
  "submissionDeadline": "string in YYYY-MM-DD format or null",
  "prizePool": "string (total prize money or perks) or null",
  "teamMembers": ["array of team member names if listed"] or [],
  "description": "brief description or theme of the hackathon" or null
}
If a field is not found in the image, set it to null (or [] for teamMembers). Do not guess dates without evidence in the image.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType: mimeType,
        },
      },
    ]);

    const rawText = result.response.text();
    let extracted;

    try {
      extracted = JSON.parse(rawText);
    } catch {
      // Fallback clean regex in case markdown fences are returned
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) {
        return Response.json(
          { error: "Could not parse JSON from AI model", raw: rawText },
          { status: 422 }
        );
      }
      extracted = JSON.parse(match[0]);
    }

    // Normalize date fields to YYYY-MM-DD for standard HTML date inputs
    if (extracted.registrationDeadline) {
      extracted.registrationDeadline = normalizeDate(
        extracted.registrationDeadline
      );
    }
    if (extracted.submissionDeadline) {
      extracted.submissionDeadline = normalizeDate(
        extracted.submissionDeadline
      );
    }

    return Response.json({ extracted, demo: false });
  } catch (error) {
    console.error("Extract route error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
