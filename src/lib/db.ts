import { neon } from "@neondatabase/serverless";

export interface Submission {
  id: number;
  timestamp: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  projectType: string | null;
  unitType: string | null;
  quality: string | null;
  access: string | null;
  sqft: string | null;
  estimateRange: string | null;
  message: string | null;
  status: "new" | "contacted" | "closed" | "archived";
}

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  return neon(process.env.DATABASE_URL);
}

export async function insertSubmission(data: Omit<Submission, "id" | "timestamp" | "status">) {
  const sql = getDb();
  const result = await sql`
    INSERT INTO submissions (name, email, phone, address, project_type, unit_type, quality, access, sqft, estimate_range, message, status)
    VALUES (${data.name}, ${data.email}, ${data.phone}, ${data.address}, ${data.projectType}, ${data.unitType}, ${data.quality}, ${data.access}, ${data.sqft}, ${data.estimateRange}, ${data.message}, 'new')
    RETURNING id
  `;
  return result[0].id;
}

export async function getAllSubmissions(): Promise<Submission[]> {
  const sql = getDb();
  const results = await sql`
    SELECT
      id,
      timestamp,
      name,
      email,
      phone,
      address,
      project_type as "projectType",
      unit_type as "unitType",
      quality,
      access,
      sqft,
      estimate_range as "estimateRange",
      message,
      status
    FROM submissions
    ORDER BY id DESC
  `;
  return results as Submission[];
}

export async function updateSubmissionStatus(id: number, status: string) {
  if (!["new", "contacted", "closed", "archived"].includes(status)) {
    throw new Error("Invalid status");
  }
  const sql = getDb();
  await sql`
    UPDATE submissions
    SET status = ${status}
    WHERE id = ${id}
  `;
  return { changes: 1 };
}

export async function getStats() {
  const sql = getDb();
  const results = await sql`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new,
      SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
    FROM submissions
  `;
  return {
    total: Number(results[0].total),
    new: Number(results[0].new),
    contacted: Number(results[0].contacted),
    closed: Number(results[0].closed),
  };
}
