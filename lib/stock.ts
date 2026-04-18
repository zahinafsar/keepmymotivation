import { env } from "./env";

export async function searchUnsplash(keyword: string): Promise<{
  url: string;
  alt: string;
  credit: { name: string; link: string };
} | null> {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    keyword
  )}&orientation=landscape&per_page=10`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY()}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    results: Array<{
      urls: { regular: string };
      alt_description: string | null;
      user: { name: string; links: { html: string } };
    }>;
  };
  if (!data.results?.length) return null;
  const pick = data.results[Math.floor(Math.random() * Math.min(data.results.length, 10))];
  return {
    url: pick.urls.regular,
    alt: pick.alt_description ?? keyword,
    credit: { name: pick.user.name, link: pick.user.links.html },
  };
}
