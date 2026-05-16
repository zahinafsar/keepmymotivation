import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KeepMyMotivation",
    short_name: "KeepMyMotivation",
    description:
      "Schedule any recurring email and let AI write it. Daily, weekly, or monthly delivery in your timezone.",
    start_url: "/",
    display: "standalone",
    background_color: "#07070b",
    theme_color: "#07070b",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    categories: ["productivity", "lifestyle", "self-improvement"],
  };
}
