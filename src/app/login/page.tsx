"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password }),
      });

      if (res.status === 401) {
        const msg = await res.text();
        setError(msg || "아이디 또는 비밀번호가 올바르지 않습니다.");
        return;
      }

      if (!res.ok) {
        setError("로그인 중 오류가 발생했습니다.");
        return;
      }

      // 응답 바디에서 role 읽기 (백엔드 수정 후 동작)
      let role = "ADMIN";
      try {
        const data = await res.json();
        if (data?.role) role = data.role.toUpperCase();
      } catch {
        // 바디 없을 경우 기본값 ADMIN
      }
      sessionStorage.setItem("role", role);
      router.push("/admin");
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-gray-900">순애묘</h1>
          <p className="text-sm text-gray-500 mt-1">관리자 로그인</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                아이디
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            {error && (
              <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>

        <div className="mt-5 text-center">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
