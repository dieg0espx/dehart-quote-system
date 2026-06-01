"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface Submission {
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
  status: "new" | "contacted" | "closed" | "archived";
}

interface Stats {
  total: number;
  new: number;
  contacted: number;
  closed: number;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-yellow-100 text-yellow-800 border-yellow-300",
  contacted: "bg-blue-100 text-blue-800 border-blue-300",
  closed: "bg-green-100 text-green-800 border-green-300",
  archived: "bg-gray-100 text-gray-700 border-gray-300",
};

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const SESSION_KEY = "dehart_admin_session";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, new: 0, contacted: 0, closed: 0 });
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Save session to localStorage
  const saveSession = useCallback((pw: string) => {
    const session = {
      password: pw,
      expiresAt: Date.now() + SESSION_DURATION,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, []);

  // Load session from localStorage
  const loadSession = useCallback(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (!stored) return null;

      const session = JSON.parse(stored);
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }

      return session.password;
    } catch {
      return null;
    }
  }, []);

  // Clear session from localStorage
  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const fetchData = useCallback(async (pw: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions", {
        headers: { "x-admin-password": pw },
      });
      if (!res.ok) {
        if (res.status === 401) {
          setError("Invalid password");
          setAuthenticated(false);
          clearSession();
        }
        else setError("Failed to load data");
        return;
      }
      const data = await res.json();
      setSubmissions(data.submissions);
      setStats(data.stats);
      setError("");
    } catch {
      setError("Failed to connect");
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticated(true);
    saveSession(password);
    fetchData(password);
  };

  // Check for existing session on mount
  useEffect(() => {
    const storedPassword = loadSession();
    if (storedPassword) {
      setPassword(storedPassword);
      setAuthenticated(true);
      fetchData(storedPassword);
    }
  }, [loadSession, fetchData]);

  useEffect(() => {
    if (authenticated) fetchData(password);
  }, [authenticated, password, fetchData]);

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ status }),
    });
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: status as Submission["status"] } : s))
    );
    // Update stats locally (archived is not tracked in the Stats card grid)
    setStats((prev) => {
      const old = submissions.find((s) => s.id === id)!;
      const next = { ...prev };
      if (old.status in next) {
        const k = old.status as keyof Stats;
        next[k] = (next[k] as number) - 1;
      }
      if (status in next) {
        const k = status as keyof Stats;
        next[k] = (next[k] as number) + 1;
      }
      return next;
    });
  };

  const filtered = submissions.filter((s) => {
    if (!showArchived && s.status === "archived") return false;
    if (showArchived && s.status !== "archived") return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 mb-3">
              <Image src="/logo.png" alt="DeHart HVAC" width={56} height={56} className="object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Enter password to continue</p>
          </div>
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-[#EC2225] focus:outline-none transition"
            placeholder="Password"
            autoFocus
          />
          <button
            type="submit"
            className="w-full px-6 py-3 bg-[#DC2626] text-white font-semibold rounded-xl hover:bg-[#B91C1C] transition shadow-md cursor-pointer"
          >
            Sign In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10">
              <Image src="/logo.png" alt="DeHart HVAC" width={40} height={40} className="object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">DeHart HVAC Admin</h1>
              <p className="text-gray-500 text-sm">Quote submissions dashboard</p>
            </div>
          </div>
          <button
            onClick={() => {
              setAuthenticated(false);
              setPassword("");
              clearSession();
            }}
            className="text-sm text-gray-500 hover:text-red-600 transition cursor-pointer"
          >
            Sign Out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: stats.total, color: "bg-white border-gray-200" },
            { label: "New", value: stats.new, color: "bg-yellow-50 border-yellow-200" },
            { label: "Contacted", value: stats.contacted, color: "bg-blue-50 border-blue-200" },
            { label: "Closed", value: stats.closed, color: "bg-green-50 border-green-200" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border-2 p-5 ${s.color}`}>
              <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-gray-900 focus:border-[#EC2225] focus:outline-none transition"
            placeholder="Search by name or email..."
          />
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition cursor-pointer ${
              showArchived
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
            }`}
          >
            {showArchived ? "Showing Archived" : "Show Archived"}
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No submissions found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["Date", "Name", "Email", "Phone", "Project", "Unit", "Quality", "Access", "SqFt", "Estimate", "Status"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {(() => {
                          const raw = s.timestamp?.replace(" ", "T");
                          const iso = raw && !/[Zz]|[+-]\d{2}:?\d{2}$/.test(raw) ? raw + "Z" : raw;
                          const d = iso ? new Date(iso) : null;
                          return d && !isNaN(d.getTime())
                            ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            : "—";
                        })()}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{s.name}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.email}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{s.phone || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.projectType || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.unitType || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.quality || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.access || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {s.sqft ? (s.sqft === ">1800" ? "> 1,800" : "< 1,800") : "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                        {s.estimateRange || "Special"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={s.status}
                          onChange={(e) => updateStatus(s.id, e.target.value)}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold cursor-pointer focus:outline-none ${STATUS_COLORS[s.status]}`}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="closed">Closed</option>
                          <option value="archived">Archived</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
