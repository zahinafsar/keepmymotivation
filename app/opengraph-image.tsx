import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "KeepMyMotivation — schedule any email, written by AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0b0b0f 0%, #1a0f1f 50%, #0b0b0f 100%)",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #ffffff, #f97316, #a855f7)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          KeepMyMotivation
        </div>
        <div
          style={{
            fontSize: 84,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            marginTop: 24,
            marginBottom: 24,
            color: "white",
          }}
        >
          Schedule any email.
          <br />
          AI writes every send.
        </div>
        <div style={{ fontSize: 30, color: "#9999a3", maxWidth: 900 }}>
          Daily, weekly, or monthly. Describe what you want once — we deliver it
          in your timezone.
        </div>
      </div>
    ),
    { ...size }
  );
}
