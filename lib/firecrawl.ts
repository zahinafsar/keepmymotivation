import { env } from "./env";

const FC_API = "https://api.firecrawl.dev/v2";
const MAX_URLS = 3;
const MAX_CHARS = 6000;
const SEARCH_LIMIT = 5;
const TIMEOUT_MS = 20000;

function truncate(md: string): string {
  return md.length > MAX_CHARS ? md.slice(0, MAX_CHARS) + "\n…(truncated)" : md;
}

export function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s<>")\]]+/gi) ?? [];
  const cleaned = matches.map((u) => u.replace(/[.,;:)\]]+$/, ""));
  return Array.from(new Set(cleaned)).slice(0, MAX_URLS);
}

async function fcFetch(path: string, body: unknown): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${FC_API}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.FIRECRAWL_API_KEY()}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`Firecrawl ${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error(`Firecrawl ${path} failed`, e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function scrapeUrl(url: string): Promise<string | null> {
  const json = (await fcFetch("/scrape", {
    url,
    formats: ["markdown"],
    onlyMainContent: true,
  })) as { data?: { markdown?: string } } | null;
  const md = json?.data?.markdown?.trim();
  return md ? truncate(md) : null;
}

export async function searchWeb(query: string): Promise<string | null> {
  const json = (await fcFetch("/search", {
    query,
    limit: SEARCH_LIMIT,
    scrapeOptions: { formats: ["markdown"] },
  })) as { data?: { web?: Array<{ url?: string; title?: string; markdown?: string }> } } | null;

  const results = json?.data?.web ?? [];
  const blocks = results
    .map((r) => {
      const md = r.markdown?.trim();
      if (!md) return null;
      return `### ${r.title ?? r.url ?? "Result"}\n${r.url ?? ""}\n${truncate(md)}`;
    })
    .filter((b): b is string => !!b);

  return blocks.length ? blocks.join("\n\n") : null;
}
