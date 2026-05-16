import { NextRequest, NextResponse } from "next/server";
import { nextClarifyStep, type ClarifyTurn } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { prompt, history } = (await req.json()) as {
    prompt: string;
    history: ClarifyTurn[];
  };

  if (typeof prompt !== "string" || prompt.trim().length < 4) {
    return NextResponse.json({ error: "Prompt too short" }, { status: 400 });
  }
  const safeHistory = Array.isArray(history) ? history.slice(0, 2) : [];

  try {
    const step = await nextClarifyStep(prompt, safeHistory);
    return NextResponse.json(step);
  } catch (e) {
    console.error("clarify error", e);
    return NextResponse.json({ error: "Agent failed" }, { status: 500 });
  }
}
