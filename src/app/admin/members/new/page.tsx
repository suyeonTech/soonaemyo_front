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

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin"
          className="text-sm text-gray-500 hover:underline"
        >
          ← 관리자 페이지
        </Link>
        <h1 className="text-2xl font-bold">부원 추가</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 현재 학기 정보 */}
        <div className="p-4 border border-gray-200 rounded">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">
            현재 학기 (스탬프판 생성 기준)
          </h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">연도</label>
              <input
                type="number"
                value={currentYear}
                onChange={(e) => setCurrentYear(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">학기</label>
              <select
                value={currentSemester}
                onChange={(e) => setCurrentSemester(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="1">1학기</option>
                <option value="2">2학기</option>
              </select>
            </div>
          </div>
        </div>

        {/* 부원 목록 */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-gray-600">
              부원 정보 ({members.length}/5명)
            </h2>
            {members.length < 5 && (
              <button
                type="button"
                onClick={addMember}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                + 부원 추가
              </button>
            )}
          </div>

          <div className="space-y-4">
            {members.map((member, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded relative"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    {index + 1}번 부원
                  </span>
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      제거
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) =>
                        updateMember(index, "name", e.target.value)
                      }
                      required
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      학번 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={member.studentNum}
                      onChange={(e) =>
                        updateMember(index, "studentNum", e.target.value)
                      }
                      required
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      가입 연도 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={member.joinedYear}
                      onChange={(e) =>
                        updateMember(index, "joinedYear", e.target.value)
                      }
                      required
                      placeholder="예: 2024"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      가입 학기 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={member.joinedSemester}
                      onChange={(e) =>
                        updateMember(index, "joinedSemester", e.target.value)
                      }
                      required
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
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
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "등록 중..." : `부원 ${members.length}명 등록`}
        </button>
      </form>
    </div>
  );
}
