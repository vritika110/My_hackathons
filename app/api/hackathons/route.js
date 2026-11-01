import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const DATA_FILE = path.join(process.cwd(), "data", "hackathons.json");

async function readData() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeData(data) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// GET /api/hackathons
export async function GET() {
  const hackathons = await readData();
  return Response.json(hackathons);
}

// POST /api/hackathons
export async function POST(request) {
  try {
    const body = await request.json();
    const hackathons = await readData();

    const newHackathon = {
      id: uuidv4(),
      name: body.name || "Untitled Hackathon",
      platform: body.platform || "",
      platformUrl: body.platformUrl || "",
      registrationDeadline: body.registrationDeadline || "",
      submissionDeadline: body.submissionDeadline || "",
      prizePool: body.prizePool || "TBA",
      teamMembers: Array.isArray(body.teamMembers)
        ? body.teamMembers
        : body.teamMembers
        ? body.teamMembers.split(",").map((m) => m.trim()).filter(Boolean)
        : [],
      description: body.description || "",
      status: "upcoming",
      createdAt: new Date().toISOString(),
    };

    hackathons.unshift(newHackathon);
    await writeData(hackathons);

    return Response.json(newHackathon, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/hackathons (update by id in body)
export async function PUT(request) {
  try {
    const body = await request.json();
    const hackathons = await readData();
    const idx = hackathons.findIndex((h) => h.id === body.id);
    if (idx === -1) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    hackathons[idx] = { ...hackathons[idx], ...body };
    await writeData(hackathons);
    return Response.json(hackathons[idx]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/hackathons?id=...
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const hackathons = await readData();
    const filtered = hackathons.filter((h) => h.id !== id);
    await writeData(filtered);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
