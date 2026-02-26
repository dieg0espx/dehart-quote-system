import { put, list, head } from "@vercel/blob";

const BLOB_KEY = "submissions.json";

export interface Submission {
  id: number;
  timestamp: string;
  name: string;
  email: string;
  phone: string | null;
  projectType: string | null;
  unitType: string | null;
  quality: string | null;
  access: string | null;
  sqft: string | null;
  estimateRange: string | null;
  message: string | null;
  status: "new" | "contacted" | "closed";
}

async function getBlob(): Promise<Submission[]> {
  try {
    const { blobs } = await list({ prefix: BLOB_KEY });
    if (blobs.length === 0) return [];
    const latest = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
    const res = await fetch(latest.url);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function saveBlob(submissions: Submission[]): Promise<void> {
  // Clean up old blobs
  const { blobs } = await list({ prefix: BLOB_KEY });
  for (const blob of blobs) {
    try {
      const { del } = await import("@vercel/blob");
      await del(blob.url);
    } catch { /* ignore */ }
  }
  await put(BLOB_KEY, JSON.stringify(submissions, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

export async function insertSubmission(data: Omit<Submission, "id" | "timestamp" | "status">) {
  const submissions = await getBlob();
  const nextId = submissions.length > 0 ? Math.max(...submissions.map((s) => s.id)) + 1 : 1;
  const newSubmission: Submission = {
    id: nextId,
    timestamp: new Date().toISOString(),
    ...data,
    status: "new",
  };
  submissions.unshift(newSubmission);
  await saveBlob(submissions);
  return nextId;
}

export async function getAllSubmissions(): Promise<Submission[]> {
  const submissions = await getBlob();
  return submissions.sort((a, b) => b.id - a.id);
}

export async function updateSubmissionStatus(id: number, status: string) {
  if (!["new", "contacted", "closed"].includes(status)) throw new Error("Invalid status");
  const submissions = await getBlob();
  const idx = submissions.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("Submission not found");
  submissions[idx].status = status as Submission["status"];
  await saveBlob(submissions);
  return { changes: 1 };
}

export async function getStats() {
  const submissions = await getBlob();
  const map: Record<string, number> = { new: 0, contacted: 0, closed: 0 };
  submissions.forEach((s) => { map[s.status] = (map[s.status] || 0) + 1; });
  return { total: submissions.length, ...map };
}
