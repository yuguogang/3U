"use client";

import { useAuthStore } from "@/store/auth.store";

interface FetchOptions extends Omit<RequestInit, "body"> {
  auth?: boolean;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

export async function fetchClient<T>(
  input: RequestInfo,
  options: FetchOptions = {},
): Promise<T> {
  const { auth = true, body, headers, query, ...rest } = options;

  const token = auth ? useAuthStore.getState().accessToken : null;
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010";

  let url = `${baseUrl}${input}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });
    const search = params.toString();
    if (search) {
      url += url.includes("?") ? `&${search}` : `?${search}`;
    }
  }

  const response = await fetch(url, {
    ...rest,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (response.status === 401) {
    useAuthStore.getState().logout();
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
