import { useAuthStore } from "@/store/auth.store";

interface FetchOptions extends Omit<RequestInit, "body"> {
  auth?: boolean; // 是否自动注入 Bearer
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

export async function fetchClient<T>(
  input: RequestInfo,
  options: FetchOptions = {},
): Promise<T> {
  const { auth = true, headers, query, body, ...rest } = options;

  const token = auth ? useAuthStore.getState().accessToken : null;
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010";

  let url = `${baseUrl}${input}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.set(k, String(v));
    });
    const search = params.toString();
    if (search) url += (url.includes("?") ? "&" : "?") + search;
  }

  const res = await fetch(url, {
    ...rest,
    ...(body !== undefined && { body: JSON.stringify(body) }),
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  });

  if (res.status === 401) {
    useAuthStore.getState().logout();
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Request failed");
  }

  return res.json();
}
