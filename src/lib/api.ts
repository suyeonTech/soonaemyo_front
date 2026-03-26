async function request(path: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  return res;
}

export const api = {
  login: (body: { loginId: string; password: string }) =>
    request("/api/admin/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  logout: () => request("/api/admin/logout", { method: "POST" }),

  getAdmins: () => request("/api/admins"),

  createAdmin: (body: { loginId: string; password: string; name: string }) =>
    request("/api/admins", { method: "POST", body: JSON.stringify(body) }),

  deleteAdmin: (id: number) =>
    request(`/api/admins/${id}`, { method: "DELETE" }),

  getStamps: (params: Record<string, string>) =>
    request("/api/stamps?" + new URLSearchParams(params)),

  giveStamp: (stampId: number, stampKind: "FOOD" | "EXTRA") =>
    request(`/api/stamps/${stampId}/give`, {
      method: "POST",
      body: JSON.stringify({ stampKind }),
    }),

  getMemberStamps: (params: Record<string, string>) =>
    request("/api/member/stamps?" + new URLSearchParams(params)),

  deleteStamp: (stampId: number, stampKind: "FOOD" | "EXTRA") =>
    request(`/api/stamps/${stampId}/give`, {
      method: "DELETE",
      body: JSON.stringify({ stampKind }),
    }),

  changePassword: (body: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) =>
    request("/api/admin/password", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  registerMembers: (body: {
    members: {
      name: string;
      studentNum: string;
      joinedYear: number;
      joinedSemester: number;
    }[];
    currentYear: number;
    currentSemester: number;
  }) => request("/api/members", { method: "POST", body: JSON.stringify(body) }),
};
