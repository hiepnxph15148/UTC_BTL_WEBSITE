"use client";

import { useCallback, useEffect, useState } from "react";
import { identityApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";

type IdentityUser = {
  id?: string;
  userName?: string | null;
  email?: string | null;
  name?: string | null;
};

type IdentityRole = {
  id?: string;
  name?: string | null;
};

export default function AdminUsersPage() {
  const { isAuthenticated } = useAuth();
  const { t } = useLocale();
  const [users, setUsers] = useState<IdentityUser[]>([]);
  const [roles, setRoles] = useState<IdentityRole[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userRoleNames, setUserRoleNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    userName: "",
    email: "",
    password: "",
  });

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setUsers([]);
      setRoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        identityApi.getUsers({ MaxResultCount: 100 }),
        identityApi.getRoles({ MaxResultCount: 50 }),
      ]);
      setUsers((usersRes.items || []) as IdentityUser[]);
      setRoles((rolesRes.items || []) as IdentityRole[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được users");
      setUsers([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await identityApi.createUser({
        userName: form.userName.trim(),
        emailAddress: form.email.trim(),
        password: form.password,
        isActive: true,
      });
      setForm({ userName: "", email: "", password: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo user thất bại");
    } finally {
      setBusy(false);
    }
  };

  const openRoles = async (id: string) => {
    setSelectedId(id);
    setError(null);
    try {
      const res = await identityApi.getUserRoles(id);
      const items = (res.items || []) as IdentityRole[];
      setUserRoleNames(
        items.map((r) => r.name).filter((n): n is string => Boolean(n)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải roles");
      setUserRoleNames([]);
    }
  };

  const saveRoles = async () => {
    if (!selectedId || busy) return;
    setBusy(true);
    setError(null);
    try {
      await identityApi.updateUserRoles(selectedId, userRoleNames);
      await openRoles(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gán role thất bại");
    } finally {
      setBusy(false);
    }
  };

  const toggleRole = (name: string) => {
    setUserRoleNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {t("admin.usersTitle")}
        </h1>
        <p className="mt-1 text-sm text-white/55">{t("admin.usersSubtitle")}</p>
        {error ? (
          <p className="mt-1 text-xs text-amber-200/80">{error}</p>
        ) : null}
      </div>

      {!isAuthenticated ? (
        <div className="admin-card p-6 text-sm text-white/60">
          {t("admin.usersNeedPerm")}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={create} className="admin-card space-y-3 p-5">
            <h2 className="text-lg font-bold">Tạo user</h2>
            <label className="block text-xs text-white/50">
              {t("admin.userName")}
              <input
                required
                value={form.userName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, userName: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
              />
            </label>
            <label className="block text-xs text-white/50">
              {t("admin.email")}
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
              />
            </label>
            <label className="block text-xs text-white/50">
              {t("admin.password")}
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-[#ed3b6b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              Tạo user
            </button>
          </form>

          <div className="admin-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Danh sách</h2>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15"
              >
                Làm mới
              </button>
            </div>
            {loading ? (
              <p className="py-10 text-center text-sm text-white/45">Đang tải…</p>
            ) : (
              <ul className="space-y-2">
                {users.map((u) => (
                  <li
                    key={u.id}
                    className={`rounded-xl border px-4 py-3 ${
                      selectedId === u.id
                        ? "border-[#ed3b6b]/50 bg-[#ed3b6b]/10"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => u.id && void openRoles(u.id)}
                    >
                      <p className="font-semibold">{u.userName || "—"}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {u.email || "—"}
                      </p>
                    </button>
                  </li>
                ))}
                {!users.length ? (
                  <li className="py-8 text-center text-sm text-white/45">
                    Không có user
                  </li>
                ) : null}
              </ul>
            )}

            {selectedId ? (
              <div className="mt-5 border-t border-white/10 pt-4">
                <h3 className="mb-3 text-sm font-bold">Gán roles</h3>
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => {
                    const name = role.name || "";
                    if (!name) return null;
                    const on = userRoleNames.includes(name);
                    return (
                      <button
                        key={role.id || name}
                        type="button"
                        onClick={() => toggleRole(name)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          on
                            ? "bg-[#ed3b6b] text-white"
                            : "bg-white/10 text-white/70"
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveRoles()}
                  className="mt-3 rounded-xl bg-[#ed3b6b] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  Lưu roles
                </button>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold"
                    onClick={async () => {
                      if (!selectedId) return;
                      setBusy(true);
                      try {
                        const detail = (await identityApi.getUser(
                          selectedId,
                        )) as IdentityUser & { concurrencyStamp?: string };
                        const name = window.prompt(
                          "Sửa name",
                          detail.name || "",
                        );
                        if (name === null) return;
                        await identityApi.updateUser(selectedId, {
                          ...detail,
                          name,
                          roleNames: userRoleNames,
                        });
                        await load();
                      } catch (err) {
                        setError(
                          err instanceof Error
                            ? err.message
                            : "Update user thất bại",
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Sửa user
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold"
                    onClick={async () => {
                      if (!selectedId) return;
                      const perm = window.prompt(
                        "Permission name (vd ShoeStore.Orders.Manage)",
                      );
                      if (!perm) return;
                      const grant = window.confirm(t("admin.grantConfirm"));
                      setBusy(true);
                      try {
                        await identityApi.getPermissions("U", selectedId);
                        await identityApi.updatePermissions("U", selectedId, {
                          permissions: [{ name: perm, isGranted: grant }],
                        });
                      } catch (err) {
                        setError(
                          err instanceof Error
                            ? err.message
                            : "Permission thất bại",
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {t("admin.setPermission")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded-xl border border-orange-400/40 px-3 py-2 text-xs font-bold text-orange-200"
                    onClick={async () => {
                      if (!selectedId) return;
                      setBusy(true);
                      try {
                        await identityApi.deleteUser(selectedId);
                        setSelectedId(null);
                        await load();
                      } catch (err) {
                        setError(
                          err instanceof Error ? err.message : "Xóa thất bại",
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Xóa user
                  </button>
                </div>
                <div className="mt-4 border-t border-white/10 pt-3">
                  <p className="mb-2 text-xs font-bold text-white/50">
                    {t("admin.rolesCrud")}
                  </p>
                  <button
                    type="button"
                    className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold"
                    onClick={async () => {
                      const name = window.prompt("Tên role mới");
                      if (!name) return;
                      setBusy(true);
                      try {
                        await identityApi.createRole({ name, isDefault: false, isPublic: false });
                        await load();
                      } catch (err) {
                        setError(
                          err instanceof Error ? err.message : "Tạo role thất bại",
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    + Role
                  </button>
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-white/55">
                    {roles.map((r) => (
                      <li key={r.id} className="flex justify-between gap-2">
                        <span>{r.name}</span>
                        <span className="flex gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!r.id) return;
                              try {
                                const detail = (await identityApi.getRole(
                                  r.id,
                                )) as IdentityRole;
                                const next = window.prompt(
                                  "Đổi tên role",
                                  detail.name || "",
                                );
                                if (!next) return;
                                await identityApi.updateRole(r.id, {
                                  name: next,
                                  isDefault: false,
                                  isPublic: false,
                                });
                                await load();
                              } catch (err) {
                                setError(
                                  err instanceof Error
                                    ? err.message
                                    : "Sửa role thất bại",
                                );
                              }
                            }}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="text-orange-200"
                            onClick={async () => {
                              if (!r.id) return;
                              try {
                                await identityApi.deleteRole(r.id);
                                await load();
                              } catch (err) {
                                setError(
                                  err instanceof Error
                                    ? err.message
                                    : "Xóa role thất bại",
                                );
                              }
                            }}
                          >
                            Xóa
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
