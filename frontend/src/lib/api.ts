import type { ForexCatalogue } from "@/types/forex";

/**
 * Client-side base URL of the API.
 *
 * Defaults to "" (same origin): the browser calls `/api/...`, which Next.js
 * rewrites to the internal backend (see next.config.mjs). This avoids CORS and
 * the build-time baking of a public backend URL, so a single domain is enough
 * in production. Can still be overridden with NEXT_PUBLIC_API_BASE_URL.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

/**
 * Server-only base URL used during SSR. The frontend container reaches the
 * backend directly over the internal network (compose service name).
 */
const SERVER_API_BASE_URL =
  process.env.API_BASE_URL_INTERNAL?.replace(/\/$/, "") ??
  "http://localhost:8000";

/** Client-side fetcher (used by SWR in the browser). */
export async function fetchCatalogue(): Promise<ForexCatalogue> {
  return request(API_BASE_URL);
}

/** Server-side fetcher (used during SSR for the initial payload). */
export async function fetchCatalogueServer(): Promise<ForexCatalogue> {
  return request(SERVER_API_BASE_URL, { cache: "no-store" });
}

async function request(
  base: string,
  init?: RequestInit,
): Promise<ForexCatalogue> {
  const res = await fetch(`${base}/api/forex/catalogue`, {
    headers: { Accept: "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Failed to load catalogue (HTTP ${res.status})`);
  }
  return res.json() as Promise<ForexCatalogue>;
}
