"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface MemberForm {
  name: string;
  studentNum: string;
  joinedYear: string;
  joinedSemester: string;
}

const EMPTY_MEMBER: MemberForm = {
  name: "",
  studentNum: "",
  joinedYear: "",
  joinedSemester: "",
};

export default function MembersNewPage() {
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState(
    String(new Date().getFullYear())
  );
  const [currentSemester, setCurrentSemester] = useState(
    new Date().getMonth() < 6 ? "1" : "2"
  );
  const [members, setMembers] = useState<MemberForm[]>([{ ...EMPTY_MEMBER }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function addMember() {
    if (members.length >= 5) return;
    setMembers((prev) => [...prev, { ...EMPTY_MEMBER }]);
  }

  function removeMember(index: number) {
    if (members.length <= 1) return;
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMember(index: number, field: keyof MemberForm, value: string) {
    setMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.registerMembers({
        members: members.map((m) => ({
          name: m.name.trim(),
          studentNum: m.studentNum.trim(),
          joinedYear: Number(m.joinedYear),
          joinedSemester: Number(m.joinedSemester),
        })),
        currentYear: Number(currentYear),
        currentSemester: Number(currentSemester),
      });

      if (res.status === 400) {
        const msg = await res.text();
        setError(msg || "입력값을 확인해주세요.");
        return;
      }
      if (!res.ok) {
        setError("등록 중 오류가 발생했습니다.");
        return;
      }
      router.push("/admin");
    } catch {
      setError("등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition bg-white";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/admin"
            className="text-gray-400 hover:text-gray-600 transition text-lg leading-none"
          >
            ←
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">부원 추가</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              스탬프판 생성 기준 학기를 먼저 설정하세요
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 현재 학기 */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              현재 학기
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  연도
                </label>
                <input
                  type="number"
                  value={currentYear}
                  onChange={(e) => setCurrentYear(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  학기
                </label>
                <select
                  value={currentSemester}
                  onChange={(e) => setCurrentSemester(e.target.value)}
                  className={inputCls}
                >
                  <option value="1">1학기</option>
                  <option value="2">2학기</option>
                </select>
              </div>
            </div>
          </div>

          {/* 부원 목록 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                부원 정보 ({members.length}/5)
              </span>
              {members.length < 5 && (
                <button
                  type="button"
                  onClick={addMember}
                  className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition"
                >
                  + 추가
                </button>
              )}
            </div>

            {members.map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-semibold text-gray-400">
                    {index + 1}번 부원
                  </span>
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="text-xs text-red-400 hover:text-red-600 transition"
                    >
                      제거
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      이름 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) =>
                        updateMember(index, "name", e.target.value)
                      }
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
                      value={member.studentNum}
                      onChange={(e) =>
                        updateMember(index, "studentNum", e.target.value)
                      }
                      required
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      가입 연도 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={member.joinedYear}
                      onChange={(e) =>
                        updateMember(index, "joinedYear", e.target.value)
                      }
                      required
                      placeholder="예: 2024"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      가입 학기 <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={member.joinedSemester}
                      onChange={(e) =>
                        updateMember(index, "joinedSemester", e.target.value)
                      }
                      required
                      className={inputCls}
                    >
                      <option value="">선택</option>
                      <option value="1">1학기</option>
                      <option value="2">2학기</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
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
            {loading ? "등록 중..." : `부원 ${members.length}명 등록`}
          </button>
        </form>
      </div>
    </div>
  );
}
