"use client";

import { useEffect, useState } from "react";

type Props = {
  timezone?: string;
  size?: number;
};

function localParts(timezone: string) {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = fmt.formatToParts(new Date());
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
    return { h: get("hour") % 12, m: get("minute"), s: get("second") };
  } catch {
    const d = new Date();
    return { h: d.getHours() % 12, m: d.getMinutes(), s: d.getSeconds() };
  }
}

export default function AnalogClock({ timezone = "UTC", size = 160 }: Props) {
  const [now, setNow] = useState(() => localParts(timezone));

  useEffect(() => {
    const tick = () => setNow(localParts(timezone));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timezone]);

  const secondAngle = now.s * 6;
  const minuteAngle = now.m * 6 + now.s * 0.1;
  const hourAngle = now.h * 30 + now.m * 0.5;

  const cx = 50;
  const cy = 50;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-label="Analog clock"
      role="img"
    >
      <defs>
        <radialGradient id="clockFace" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="rgba(249,115,22,0.1)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </radialGradient>
      </defs>

      <circle
        cx={cx}
        cy={cy}
        r={48}
        fill="url(#clockFace)"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
      />

      {/* Minute ticks */}
      {Array.from({ length: 60 }).map((_, i) => {
        if (i % 5 === 0) return null;
        const angle = (i * 6 * Math.PI) / 180;
        const r1 = 44;
        const r2 = 46;
        return (
          <line
            key={`m${i}`}
            x1={cx + Math.sin(angle) * r1}
            y1={cy - Math.cos(angle) * r1}
            x2={cx + Math.sin(angle) * r2}
            y2={cy - Math.cos(angle) * r2}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={0.5}
            strokeLinecap="round"
          />
        );
      })}

      {/* Hour numbers */}
      {Array.from({ length: 12 }).map((_, i) => {
        const num = i === 0 ? 12 : i;
        const angle = (i * 30 * Math.PI) / 180;
        const r = 38;
        const x = cx + Math.sin(angle) * r;
        const y = cy - Math.cos(angle) * r;
        return (
          <text
            key={`n${i}`}
            x={x}
            y={y}
            fill={num === 12 ? "#f97316" : "#e4e4e7"}
            fontSize={num === 12 ? 8 : 7}
            fontWeight={num === 12 ? 800 : 600}
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {num}
          </text>
        );
      })}

      {/* Hour hand */}
      <g style={{ transform: `rotate(${hourAngle}deg)`, transformOrigin: "50px 50px", transition: "transform 0.3s" }}>
        <line x1={cx} y1={cy + 5} x2={cx} y2={cy - 22} stroke="#fafafa" strokeWidth={2.5} strokeLinecap="round" />
      </g>

      {/* Minute hand */}
      <g style={{ transform: `rotate(${minuteAngle}deg)`, transformOrigin: "50px 50px", transition: "transform 0.3s" }}>
        <line x1={cx} y1={cy + 6} x2={cx} y2={cy - 30} stroke="#fafafa" strokeWidth={1.8} strokeLinecap="round" />
      </g>

      {/* Second hand */}
      <g style={{ transform: `rotate(${secondAngle}deg)`, transformOrigin: "50px 50px" }}>
        <line x1={cx} y1={cy + 8} x2={cx} y2={cy - 32} stroke="#f97316" strokeWidth={0.9} strokeLinecap="round" />
      </g>

      <circle cx={cx} cy={cy} r={2} fill="#f97316" />
      <circle cx={cx} cy={cy} r={0.8} fill="#0b0b0f" />
    </svg>
  );
}
