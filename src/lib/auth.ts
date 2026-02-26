export function checkAdminPassword(password: string | null): boolean {
  const expected = process.env.ADMIN_PASSWORD || "dehart2026";
  return password === expected;
}
