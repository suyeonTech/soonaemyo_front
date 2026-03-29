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

const TOTAL_STAMPS = 10;

function StampCard({ record }: { record: StampRecord }) {
  const filled = Math.min(
    record.feedStampNum + record.exStampNum,
    TOTAL_STAMPS
  );
  const isComplete = filled >= TOTAL_STAMPS;

  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-md transition ${
        isComplete
          ? "ring-2 ring-blue-950"
          : "ring-1 ring-gray-200"
      } bg-white`}
    >
      {/* 카드 헤더 */}
      <div className="bg-blue-950 px-5 py-3.5 flex items-center justify-between">
        <span className="text-white font-semibold text-sm tracking-wide">
          {record.year}년 {record.semester}학기
        </span>
        <div className="flex items-center gap-2">
          {isComplete && (
            <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
              완성!
            </span>
          )}
          <span className="text-blue-300 text-xs font-medium tabular-nums">
            {filled} / {TOTAL_STAMPS}
          </span>
        </div>
      </div>

      {/* 스탬프 그리드 */}
      <div className="p-5">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: TOTAL_STAMPS }).map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-full flex items-center justify-center transition-all ${
                i < filled
                  ? "bg-blue-950 shadow-sm"
                  : "border-2 border-dashed border-gray-200"
              }`}
            />
          ))}
        </div>

        {/* 스탬프 상세 */}
        <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-950" />
            급식소{" "}
            <span className="font-semibold text-gray-900">
              {record.feedStampNum}
            </span>
          </div>
          <div className="h-3 w-px bg-gray-200" />
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-800" />
            기타{" "}
            <span className="font-semibold text-gray-900">
              {record.exStampNum}
            </span>
          </div>
          <div className="ml-auto">
            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-950 rounded-full transition-all"
                style={{ width: `${(filled / TOTAL_STAMPS) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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

  const inputCls =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent transition bg-white placeholder:text-gray-400";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="px-4 pt-10 pb-4">
        {/* 관리자 로그인 링크 */}
        <div className="flex justify-end max-w-xl mx-auto mb-8">
          <Link
            href="/login"
            className="text-xs text-gray-400 hover:text-gray-700 transition"
          >
            관리자 로그인 →
          </Link>
        </div>

        {/* 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-950 tracking-tight">
            순애묘
          </h1>
          <p className="text-gray-400 mt-1.5 text-sm">
            나의 스탬프를 확인하세요
          </p>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 pb-12">
        {/* 검색 카드 */}
        <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-100 p-6 mb-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            스탬프 조회
          </h2>
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  이름 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름"
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  학번 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={studentNum}
                  onChange={(e) => setStudentNum(e.target.value)}
                  placeholder="학번"
                  required
                  className={inputCls}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  연도{" "}
                  <span className="text-gray-400 font-normal">(선택)</span>
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="예: 2025"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  학기{" "}
                  <span className="text-gray-400 font-normal">(선택)</span>
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className={inputCls}
                >
                  <option value="">전체</option>
                  <option value="1">1학기</option>
                  <option value="2">2학기</option>
                </select>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-950 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 disabled:opacity-50 transition"
            >
              {loading ? "조회 중..." : "조회하기"}
            </button>
          </form>
        </div>

        {/* 조회 결과 */}
        {records !== null && (
          <div className="space-y-4">
            {records.length === 0 ? (
              <div className="text-center py-14">
                <p className="text-gray-400 text-sm font-medium">
                  조회 결과가 없습니다.
                </p>
                <p className="text-gray-300 text-xs mt-1">
                  이름과 학번을 다시 확인해주세요.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 text-center">
                  {records.length}개의 스탬프 기록
                </p>
                {records.map((r, i) => (
                  <StampCard key={i} record={r} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
