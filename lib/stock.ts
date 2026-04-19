import { env } from "./env";

export type StockImage = {
  url: string;
  alt: string;
  credit: { name: string; link: string; source: "Pexels" };
};

export async function searchPexels(keyword: string): Promise<StockImage | null> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
    keyword
  )}&orientation=landscape&per_page=10`;
  const res = await fetch(url, {
    headers: { Authorization: env.PEXELS_API_KEY() },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    photos: Array<{
      src: { large: string; large2x?: string; medium?: string };
      alt: string | null;
      photographer: string;
      photographer_url: string;
    }>;
  };
  if (!data.photos?.length) return null;
  const pick = data.photos[Math.floor(Math.random() * Math.min(data.photos.length, 10))];
  return {
    url: pick.src.large2x ?? pick.src.large,
    alt: pick.alt ?? keyword,
    credit: { name: pick.photographer, link: pick.photographer_url, source: "Pexels" },
  };
}
