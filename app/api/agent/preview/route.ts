import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/render";
import { generateScheduledEmailCopy } from "@/lib/gemini";
import { env } from "@/lib/env";
import ScheduledEmail from "@/emails/ScheduledEmail";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { prompt } = (await req.json().catch(() => ({}))) as { prompt?: string };

  if (typeof prompt !== "string" || prompt.trim().length < 4) {
    return NextResponse.json({ error: "Prompt too short" }, { status: 400 });
  }

  try {
    const copy = await generateScheduledEmailCopy({
      fullname: "there",
      prompt: prompt.trim(),
      dayIndex: 1,
    });

    const manageUrl = `${env.APP_URL}/dashboard`;
    const html = await render(
      ScheduledEmail({
        preview: copy.preview,
        markdown: copy.markdown,
        manageUrl,
        showUpgrade: false,
      })
    );

    return NextResponse.json({ subject: copy.subject, html });
  } catch (e) {
    console.error("preview error", e);
    return NextResponse.json({ error: "Could not generate preview" }, { status: 500 });
  }
}
