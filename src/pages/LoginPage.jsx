import React, { useState } from "react";
import { BookOpen, LogIn } from "lucide-react";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        onLogin(data.user);
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[#092f6d] text-white shadow-lg">
            <BookOpen size={30} strokeWidth={1.8} />
          </div>
          <h1 className="text-[24px] font-bold text-[#1a345c]">CampusCore</h1>
          <p className="mt-1 text-[13px] text-[#8b98aa]">Super Admin Panel</p>
        </div>

        <div className="rounded-xl border border-[#e5eaf1] bg-white p-6 shadow-soft">
          <h2 className="mb-1 text-[18px] font-bold text-[#1a345c]">Sign In</h2>
          <p className="mb-5 text-[12px] text-[#8b98aa]">Enter your credentials to access the dashboard</p>

          {error && (
            <div className="mb-4 rounded-lg bg-[#fff0f0] px-3 py-2 text-[12px] font-medium text-[#e05252]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#1b78ff] text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(27,120,255,.25)] hover:bg-[#1560e0] disabled:opacity-60"
            >
              <LogIn size={16} />
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
