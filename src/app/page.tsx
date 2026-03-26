"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface StampRecord {
  year: number;
  semester: number;
  feedStampNum: number;
  exStampNum: number;
}

export default function Home() {
  const [name, setName] = useState("");
  const [studentNum, setStudentNum] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [records, setRecords] = useState<StampRecord[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !studentNum.trim()) {
      setError("이름과 학번을 모두 입력해주세요.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const params: Record<string, string> = {
        name: name.trim(),
        studentNum: studentNum.trim(),
      };
      if (year) params.year = year;
      if (semester) params.semester = semester;
      const res = await api.getMemberStamps(params);
      if (res.status === 400) {
        setError("이름과 학번을 모두 입력해주세요.");
        setRecords(null);
        return;
      }
      if (!res.ok) {
        setError("조회 중 오류가 발생했습니다.");
        setRecords(null);
        return;
      }
      const data: StampRecord[] = await res.json();
      setRecords(data);
    } catch {
      setError("조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">순애묘 스탬프 조회</h1>
        <Link
          href="/login"
          className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
        >
          관리자 로그인
        </Link>
      </div>

      <form onSubmit={handleSearch} className="space-y-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              학번 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={studentNum}
              onChange={(e) => setStudentNum(e.target.value)}
              placeholder="학번을 입력하세요"
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">연도 (선택)</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="예: 2025"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">학기 (선택)</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">전체</option>
              <option value="1">1학기</option>
              <option value="2">2학기</option>
            </select>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "조회 중..." : "조회"}
        </button>
      </form>

      {records !== null && (
        <div>
          {records.length === 0 ? (
            <p className="text-gray-500 text-center py-8">조회 결과가 없습니다.</p>
          ) : (
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left">연도</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">학기</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">급식소 스탬프</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">기타 스탬프</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">{r.year}</td>
                    <td className="border border-gray-200 px-4 py-2">{r.semester}학기</td>
                    <td className="border border-gray-200 px-4 py-2 text-right">{r.feedStampNum}</td>
                    <td className="border border-gray-200 px-4 py-2 text-right">{r.exStampNum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
