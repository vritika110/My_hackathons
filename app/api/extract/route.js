import { GoogleGenerativeAI } from "@google/generative-ai";

const DEMO_MODE = process.env.DEMO_MODE === "true";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    // Demo mode: return mock extracted data
    if (DEMO_MODE || !process.env.GEMINI_API_KEY) {
      return Response.json({
        extracted: {
          name: "Sample Hackathon (Demo Extract)",
          platform: "Devpost",
          registrationDeadline: "2026-12-10",
          submissionDeadline: "2026-12-12",
          prizePool: "$10,000",
          description: "Demo extraction — connect Gemini API key for real OCR.",
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert at extracting hackathon information from images.
Analyze this hackathon advertisement/flyer image and extract the following fields.
Return ONLY a valid JSON object with these exact keys:
{
  "name": "hackathon name",
  "platform": "hosting platform or website",
  "registrationDeadline": "YYYY-MM-DD format or null",
  "submissionDeadline": "YYYY-MM-DD format or null",
  "prizePool": "prize amount as string or null",
  "description": "brief description or null"
}
If you cannot find a field, set it to null. Do not include any explanation, only the JSON.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType: mimeType,
        },
      },
    ]);

    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json(
        { error: "Could not parse AI response", raw: text },
        { status: 422 }
      );
    }

    const extracted = JSON.parse(jsonMatch[0]);
    return Response.json({ extracted, demo: false });
  } catch (error) {
    console.error("Extract error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
