"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface StampRecord {
  stampId: number;
  memberId: number;
  memberName: string;
  studentNum: string;
  year: number;
  semester: number;
  feedStampNum: number;
  exStampNum: number;
  presentCount: number;
}

interface AdminRecord {
  id: number;
  loginId: string;
  name: string;
  role: string;
  createdAt: string;
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}

export default function AdminPage() {
  const router = useRouter();
  const [role, setRole] = useState<string>("");

  // 스탬프 섹션
  const [searchName, setSearchName] = useState("");
  const [searchYear, setSearchYear] = useState("");
  const [searchSemester, setSearchSemester] = useState("");
  const [stamps, setStamps] = useState<StampRecord[]>([]);
  const [stampsLoading, setStampsLoading] = useState(false);
  const [stampError, setStampError] = useState("");

  // 관리자 섹션 (ROOT 전용)
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ loginId: "", password: "", name: "" });
  const [adminError, setAdminError] = useState("");

  // 비밀번호 변경 (ROOT 전용)
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    const r = sessionStorage.getItem("role") || "";
    setRole(r);

    // 쿠키에서 이전 검색값 복원
    const savedYear = getCookie("stamp_filter_year");
    const savedSemester = getCookie("stamp_filter_semester");
    if (savedYear) setSearchYear(savedYear);
    if (savedSemester) setSearchSemester(savedSemester);
  }, []);

  useEffect(() => {
    if (role === "ROOT") {
      fetchAdmins();
    }
  }, [role]);

  async function fetchAdmins() {
    try {
      const res = await api.getAdmins();
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch {
      // 무시
    }
  }

  const fetchStamps = useCallback(async () => {
    setStampsLoading(true);
    setStampError("");
    try {
      const params: Record<string, string> = {};
      if (searchName) params.name = searchName;
      if (searchYear) params.year = searchYear;
      if (searchSemester) params.semester = searchSemester;
      const res = await api.getStamps(params);
      if (!res.ok) {
        setStampError("조회 중 오류가 발생했습니다.");
        return;
      }
      const data: StampRecord[] = await res.json();
      setStamps(data);
    } catch {
      setStampError("조회 중 오류가 발생했습니다.");
    } finally {
      setStampsLoading(false);
    }
  }, [searchName, searchYear, searchSemester]);

  async function handleStampSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchStamps();
  }

  async function handleGiveStamp(stampId: number, stampKind: "FOOD" | "EXTRA") {
    try {
      const res = await api.giveStamp(stampId, stampKind);
      if (!res.ok) return;
      const updated: StampRecord = await res.json();
      setStamps((prev) =>
        prev.map((s) => (s.stampId === stampId ? { ...s, ...updated } : s))
      );
    } catch {
      // 무시
    }
  }

  async function handleDeleteStamp(s: StampRecord, stampKind: "FOOD" | "EXTRA") {
    try {
      const res = await api.deleteStamp(s.stampId, stampKind);
      if (res.status === 400) {
        const msg = await res.text();
        alert(msg || "스탬프 수가 이미 0입니다.");
        return;
      }
      if (!res.ok) return;
      const updated: StampRecord = await res.json();
      setStamps((prev) =>
        prev.map((st) => (st.stampId === s.stampId ? { ...st, ...updated } : st))
      );
    } catch {
      // 무시
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    try {
      const res = await api.changePassword(pwForm);
      if (res.status === 400) {
        const msg = await res.text();
        setPwError(msg || "입력값을 확인해주세요.");
        return;
      }
      if (!res.ok) {
        setPwError("비밀번호 변경 중 오류가 발생했습니다.");
        return;
      }
      setPwSuccess(true);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setPwError("비밀번호 변경 중 오류가 발생했습니다.");
    }
  }

  async function handleLogout() {
    await api.logout();
    sessionStorage.removeItem("role");
    router.push("/login");
  }

  async function handleDeleteAdmin(admin: AdminRecord) {
    if (!window.confirm(`${admin.name} 관리자를 삭제하시겠습니까?`)) return;
    try {
      const res = await api.deleteAdmin(admin.id);
      if (res.status === 204) {
        setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
      }
    } catch {
      // 무시
    }
  }

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAdminError("");
    try {
      const res = await api.createAdmin(newAdmin);
      if (res.status === 400) {
        const msg = await res.text();
        setAdminError(msg || "이미 존재하는 아이디입니다.");
        return;
      }
      if (!res.ok) {
        setAdminError("관리자 생성 중 오류가 발생했습니다.");
        return;
      }
      const created: AdminRecord = await res.json();
      setAdmins((prev) => [...prev, created]);
      setNewAdmin({ loginId: "", password: "", name: "" });
    } catch {
      setAdminError("관리자 생성 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">관리자 페이지</h1>
        <div className="flex gap-2">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            홈
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 관리자 목록 (ROOT 전용) */}
      {role === "ROOT" && (
        <section className="mb-10">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">관리자 목록</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPasswordForm((v) => !v);
                  setPwError("");
                  setPwSuccess(false);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                비밀번호 변경
              </button>
              <button
                onClick={() => setEditMode((v) => !v)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                {editMode ? "완료" : "수정"}
              </button>
            </div>
          </div>

          {showPasswordForm && (
            <form onSubmit={handleChangePassword} className="mb-4 p-4 border border-gray-200 rounded space-y-3">
              <p className="text-sm font-medium">ROOT 비밀번호 변경</p>
              <div className="flex gap-3 flex-wrap">
                <input
                  type="password"
                  placeholder="현재 비밀번호"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm((v) => ({ ...v, currentPassword: e.target.value }))}
                  required
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-32"
                />
                <input
                  type="password"
                  placeholder="새 비밀번호"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm((v) => ({ ...v, newPassword: e.target.value }))}
                  required
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-32"
                />
                <input
                  type="password"
                  placeholder="새 비밀번호 확인"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm((v) => ({ ...v, confirmPassword: e.target.value }))}
                  required
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-32"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-black text-white rounded hover:bg-gray-800"
                >
                  변경
                </button>
              </div>
              {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
              {pwSuccess && <p className="text-green-600 text-sm">비밀번호가 변경되었습니다.</p>}
            </form>
          )}


          {editMode && (
            <form
              onSubmit={handleCreateAdmin}
              className="flex gap-2 mb-4 flex-wrap"
            >
              <input
                type="text"
                placeholder="아이디"
                value={newAdmin.loginId}
                onChange={(e) =>
                  setNewAdmin((v) => ({ ...v, loginId: e.target.value }))
                }
                required
                className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-24"
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={newAdmin.password}
                onChange={(e) =>
                  setNewAdmin((v) => ({ ...v, password: e.target.value }))
                }
                required
                className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-24"
              />
              <input
                type="text"
                placeholder="이름"
                value={newAdmin.name}
                onChange={(e) =>
                  setNewAdmin((v) => ({ ...v, name: e.target.value }))
                }
                required
                className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-24"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-sm bg-black text-white rounded hover:bg-gray-800"
              >
                관리자 생성
              </button>
              {adminError && (
                <p className="w-full text-red-500 text-sm">{adminError}</p>
              )}
            </form>
          )}

          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-2 text-left">이름</th>
                <th className="border border-gray-200 px-4 py-2 text-left">아이디</th>
                <th className="border border-gray-200 px-4 py-2 text-left">역할</th>
                <th className="border border-gray-200 px-4 py-2 text-left">생성일시</th>
                {editMode && (
                  <th className="border border-gray-200 px-4 py-2"></th>
                )}
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2">{a.name}</td>
                  <td className="border border-gray-200 px-4 py-2">{a.loginId}</td>
                  <td className="border border-gray-200 px-4 py-2">{a.role}</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">
                    {new Date(a.createdAt).toLocaleString("ko-KR")}
                  </td>
                  {editMode && (
                    <td className="border border-gray-200 px-4 py-2">
                      {a.role !== "ROOT" && (
                        <button
                          onClick={() => handleDeleteAdmin(a)}
                          className="px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50"
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* 스탬프 목록 */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">스탬프 목록</h2>
          <Link
            href="/admin/members/new"
            className="px-3 py-1.5 text-sm bg-black text-white rounded hover:bg-gray-800"
          >
            부원 추가
          </Link>
        </div>

        <form onSubmit={handleStampSearch} className="flex gap-2 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="이름 검색"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-28"
          />
          <input
            type="number"
            placeholder="연도"
            value={searchYear}
            onChange={(e) => setSearchYear(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-24"
          />
          <select
            value={searchSemester}
            onChange={(e) => setSearchSemester(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
          >
            <option value="">전체 학기</option>
            <option value="1">1학기</option>
            <option value="2">2학기</option>
          </select>
          <button
            type="submit"
            disabled={stampsLoading}
            className="px-4 py-1.5 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {stampsLoading ? "조회 중..." : "조회"}
          </button>
        </form>

        {stampError && <p className="text-red-500 text-sm mb-3">{stampError}</p>}

        {stamps.length > 0 && (
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left">이름</th>
                <th className="border border-gray-200 px-3 py-2 text-left">학번</th>
                <th className="border border-gray-200 px-3 py-2 text-right">급식소</th>
                <th className="border border-gray-200 px-3 py-2 text-right">기타</th>
                <th className="border border-gray-200 px-3 py-2 text-right">상품수령</th>
                <th className="border border-gray-200 px-3 py-2 text-center" colSpan={2}>
                  스탬프 추가
                </th>
                <th className="border border-gray-200 px-3 py-2 text-center" colSpan={2}>
                  스탬프 삭제
                </th>
              </tr>
            </thead>
            <tbody>
              {stamps.map((s) => (
                <tr key={s.stampId} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2">{s.memberName}</td>
                  <td className="border border-gray-200 px-3 py-2">{s.studentNum}</td>
                  <td className="border border-gray-200 px-3 py-2 text-right">{s.feedStampNum}</td>
                  <td className="border border-gray-200 px-3 py-2 text-right">{s.exStampNum}</td>
                  <td className="border border-gray-200 px-3 py-2 text-right">{s.presentCount}</td>
                  <td className="border border-gray-200 px-3 py-2">
                    <button
                      onClick={() => handleGiveStamp(s.stampId, "FOOD")}
                      className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
                    >
                      급식소 +1
                    </button>
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    <button
                      onClick={() => handleGiveStamp(s.stampId, "EXTRA")}
                      className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
                    >
                      기타 +1
                    </button>
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    <button
                      onClick={() => handleDeleteStamp(s, "FOOD")}
                      className="px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 whitespace-nowrap"
                    >
                      급식소 -1
                    </button>
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    <button
                      onClick={() => handleDeleteStamp(s, "EXTRA")}
                      className="px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 whitespace-nowrap"
                    >
                      기타 -1
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {stamps.length === 0 && !stampsLoading && (
          <p className="text-gray-400 text-sm text-center py-8">
            검색 조건을 입력 후 조회 버튼을 눌러주세요.
          </p>
        )}
      </section>
    </div>
  );
}
