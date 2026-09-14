import { apiFetch } from "./client";

export type PagedResult<T = unknown> = {
  items?: T[];
  totalCount?: number;
};

export const identityApi = {
  getUsers(query: {
    Filter?: string;
    Sorting?: string;
    SkipCount?: number;
    MaxResultCount?: number;
  } = {}) {
    return apiFetch<PagedResult>("/api/identity/users", {
      auth: true,
      searchParams: query,
    });
  },

  createUser(body: Record<string, unknown>) {
    return apiFetch<unknown>("/api/identity/users", {
      method: "POST",
      auth: true,
      json: body,
    });
  },

  getUser(id: string) {
    return apiFetch<unknown>(`/api/identity/users/${id}`, { auth: true });
  },

  updateUser(id: string, body: Record<string, unknown>) {
    return apiFetch<unknown>(`/api/identity/users/${id}`, {
      method: "PUT",
      auth: true,
      json: body,
    });
  },

  deleteUser(id: string) {
    return apiFetch<void>(`/api/identity/users/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },

  getUserRoles(id: string) {
    return apiFetch<PagedResult | { items?: unknown[] }>(
      `/api/identity/users/${id}/roles`,
      { auth: true },
    );
  },

  updateUserRoles(id: string, roleNames: string[]) {
    return apiFetch<void>(`/api/identity/users/${id}/roles`, {
      method: "PUT",
      auth: true,
      json: { roleNames },
    });
  },

  getRoles(query: {
    Filter?: string;
    Sorting?: string;
    SkipCount?: number;
    MaxResultCount?: number;
  } = {}) {
    return apiFetch<PagedResult>("/api/identity/roles", {
      auth: true,
      searchParams: query,
    });
  },

  createRole(body: Record<string, unknown>) {
    return apiFetch<unknown>("/api/identity/roles", {
      method: "POST",
      auth: true,
      json: body,
    });
  },

  getRole(id: string) {
    return apiFetch<unknown>(`/api/identity/roles/${id}`, { auth: true });
  },

  updateRole(id: string, body: Record<string, unknown>) {
    return apiFetch<unknown>(`/api/identity/roles/${id}`, {
      method: "PUT",
      auth: true,
      json: body,
    });
  },

  deleteRole(id: string) {
    return apiFetch<void>(`/api/identity/roles/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },

  getPermissions(providerName: string, providerKey: string) {
    return apiFetch<unknown>("/api/permission-management/permissions", {
      auth: true,
      searchParams: { providerName, providerKey },
    });
  },

  updatePermissions(
    providerName: string,
    providerKey: string,
    body: unknown,
  ) {
    return apiFetch<void>("/api/permission-management/permissions", {
      method: "PUT",
      auth: true,
      searchParams: { providerName, providerKey },
      json: body,
    });
  },
};
