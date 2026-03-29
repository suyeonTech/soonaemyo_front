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
  const [newAdmin, setNewAdmin] = useState({
    loginId: "",
    password: "",
    name: "",
  });
  const [adminError, setAdminError] = useState("");

  // 비밀번호 변경 (ROOT 전용)
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
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

  async function handleDeleteStamp(
    s: StampRecord,
    stampKind: "FOOD" | "EXTRA"
  ) {
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
        prev.map((st) =>
          st.stampId === s.stampId ? { ...st, ...updated } : st
        )
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

  const inputCls =
    "border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition bg-white";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">순애묘</h1>
            <p className="text-sm text-gray-500 mt-0.5">관리자 페이지</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-white transition"
            >
              홈
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-white transition"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 관리자 목록 (ROOT 전용) */}
        {role === "ROOT" && (
          <section className="mb-6">
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">
                  관리자 목록
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowPasswordForm((v) => !v);
                      setPwError("");
                      setPwSuccess(false);
                    }}
                    className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition"
                  >
                    비밀번호 변경
                  </button>
                  <button
                    onClick={() => setEditMode((v) => !v)}
                    className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition"
                  >
                    {editMode ? "완료" : "수정"}
                  </button>
                </div>
              </div>

              {showPasswordForm && (
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <form
                    onSubmit={handleChangePassword}
                    className="space-y-3"
                  >
                    <p className="text-xs font-medium text-gray-600">
                      ROOT 비밀번호 변경
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <input
                        type="password"
                        placeholder="현재 비밀번호"
                        value={pwForm.currentPassword}
                        onChange={(e) =>
                          setPwForm((v) => ({
                            ...v,
                            currentPassword: e.target.value,
                          }))
                        }
                        required
                        className={inputCls + " flex-1 min-w-32"}
                      />
                      <input
                        type="password"
                        placeholder="새 비밀번호"
                        value={pwForm.newPassword}
                        onChange={(e) =>
                          setPwForm((v) => ({
                            ...v,
                            newPassword: e.target.value,
                          }))
                        }
                        required
                        className={inputCls + " flex-1 min-w-32"}
                      />
                      <input
                        type="password"
                        placeholder="새 비밀번호 확인"
                        value={pwForm.confirmPassword}
                        onChange={(e) =>
                          setPwForm((v) => ({
                            ...v,
                            confirmPassword: e.target.value,
                          }))
                        }
                        required
                        className={inputCls + " flex-1 min-w-32"}
                      />
                      <button
                        type="submit"
                        className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-gray-700 transition"
                      >
                        변경
                      </button>
                    </div>
                    {pwError && (
                      <p className="text-red-500 text-xs">{pwError}</p>
                    )}
                    {pwSuccess && (
                      <p className="text-green-600 text-xs">
                        비밀번호가 변경되었습니다.
                      </p>
                    )}
                  </form>
                </div>
              )}

              {editMode && (
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <form
                    onSubmit={handleCreateAdmin}
                    className="flex gap-2 flex-wrap"
                  >
                    <input
                      type="text"
                      placeholder="아이디"
                      value={newAdmin.loginId}
                      onChange={(e) =>
                        setNewAdmin((v) => ({ ...v, loginId: e.target.value }))
                      }
                      required
                      className={inputCls + " flex-1 min-w-24"}
                    />
                    <input
                      type="password"
                      placeholder="비밀번호"
                      value={newAdmin.password}
                      onChange={(e) =>
                        setNewAdmin((v) => ({
                          ...v,
                          password: e.target.value,
                        }))
                      }
                      required
                      className={inputCls + " flex-1 min-w-24"}
                    />
                    <input
                      type="text"
                      placeholder="이름"
                      value={newAdmin.name}
                      onChange={(e) =>
                        setNewAdmin((v) => ({ ...v, name: e.target.value }))
                      }
                      required
                      className={inputCls + " flex-1 min-w-24"}
                    />
                    <button
                      type="submit"
                      className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-gray-700 transition"
                    >
                      관리자 생성
                    </button>
                    {adminError && (
                      <p className="w-full text-red-500 text-xs">
                        {adminError}
                      </p>
                    )}
                  </form>
                </div>
              )}

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      이름
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      아이디
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      역할
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      생성일시
                    </th>
                    {editMode && <th className="px-6 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {admins.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {a.name}
                      </td>
                      <td className="px-6 py-3 text-gray-500">{a.loginId}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                            a.role === "ROOT"
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {a.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-400 text-xs">
                        {new Date(a.createdAt).toLocaleString("ko-KR")}
                      </td>
                      {editMode && (
                        <td className="px-6 py-3">
                          {a.role !== "ROOT" && (
                            <button
                              onClick={() => handleDeleteAdmin(a)}
                              className="text-xs text-red-500 border border-red-200 rounded-lg px-2 py-1 hover:bg-red-50 transition"
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
            </div>
          </section>
        )}

        {/* 스탬프 목록 */}
        <section>
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                스탬프 목록
              </h2>
              <Link
                href="/admin/members/new"
                className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition"
              >
                부원 추가
              </Link>
            </div>

            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <form
                onSubmit={handleStampSearch}
                className="flex gap-2 flex-wrap"
              >
                <input
                  type="text"
                  placeholder="이름 검색"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className={inputCls + " flex-1 min-w-28"}
                />
                <input
                  type="number"
                  placeholder="연도"
                  value={searchYear}
                  onChange={(e) => setSearchYear(e.target.value)}
                  className={inputCls + " w-24"}
                />
                <select
                  value={searchSemester}
                  onChange={(e) => setSearchSemester(e.target.value)}
                  className={inputCls}
                >
                  <option value="">전체 학기</option>
                  <option value="1">1학기</option>
                  <option value="2">2학기</option>
                </select>
                <button
                  type="submit"
                  disabled={stampsLoading}
                  className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50 transition"
                >
                  {stampsLoading ? "조회 중..." : "조회"}
                </button>
              </form>
              {stampError && (
                <p className="text-red-500 text-xs mt-2">{stampError}</p>
              )}
            </div>

            {stamps.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        이름
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        학번
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        급식소
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        기타
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        상품수령
                      </th>
                      <th
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide"
                        colSpan={2}
                      >
                        추가
                      </th>
                      <th
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide"
                        colSpan={2}
                      >
                        삭제
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stamps.map((s) => (
                      <tr
                        key={s.stampId}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {s.memberName}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {s.studentNum}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {s.feedStampNum}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {s.exStampNum}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {s.presentCount}
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() =>
                              handleGiveStamp(s.stampId, "FOOD")
                            }
                            className="px-2 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-100 transition whitespace-nowrap text-gray-700"
                          >
                            급식소 +1
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() =>
                              handleGiveStamp(s.stampId, "EXTRA")
                            }
                            className="px-2 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-100 transition whitespace-nowrap text-gray-700"
                          >
                            기타 +1
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => handleDeleteStamp(s, "FOOD")}
                            className="px-2 py-1 text-xs border border-red-200 rounded-lg hover:bg-red-50 transition whitespace-nowrap text-red-500"
                          >
                            급식소 -1
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => handleDeleteStamp(s, "EXTRA")}
                            className="px-2 py-1 text-xs border border-red-200 rounded-lg hover:bg-red-50 transition whitespace-nowrap text-red-500"
                          >
                            기타 -1
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-12">
                {stampsLoading
                  ? "조회 중..."
                  : "검색 조건을 입력 후 조회 버튼을 눌러주세요."}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
