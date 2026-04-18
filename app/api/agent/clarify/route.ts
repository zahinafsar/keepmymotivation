import { NextRequest, NextResponse } from "next/server";
import { nextClarifyStep, type ClarifyTurn } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { goal, history } = (await req.json()) as {
    goal: string;
    history: ClarifyTurn[];
  };

  if (typeof goal !== "string" || goal.trim().length < 4) {
    return NextResponse.json({ error: "Goal too short" }, { status: 400 });
  }
  const safeHistory = Array.isArray(history) ? history.slice(0, 2) : [];

  try {
    const step = await nextClarifyStep(goal, safeHistory);
    return NextResponse.json(step);
  } catch (e) {
    console.error("clarify error", e);
    return NextResponse.json({ error: "Agent failed" }, { status: 500 });
  }
}
