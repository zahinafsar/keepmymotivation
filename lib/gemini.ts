import OpenAI from "openai";
import { env } from "./env";

let _client: OpenAI | null = null;
function client() {
  if (!_client) _client = new OpenAI({ apiKey: env.OPENAI_API_KEY() });
  return _client;
}

const MODEL_ID = "gpt-4o-mini";

export type ClarifyTurn = { q: string; a: string };

export type ClarifyStep =
  | { done: false; question: string }
  | {
      done: true;
      theme: string;
      imageKeyword: string;
      subjectHint: string;
    };

const CLARIFY_SYSTEM = `You are a motivational coach. User shares a goal. Ask at most TWO short clarifying questions to pinpoint the WHY + imagery that will motivate them.

CRITICAL RULES:
- Prefer finalizing early. Only ask a question if you genuinely cannot guess a motivating theme from what you have.
- If the goal or the first answer is already clear enough to pick a theme + image keyword, FINALIZE — do not ask for more.
- Never ask more than 2 total questions.
- After 2 answers, you MUST finalize.
- Questions must be SHORT: max 10 words, one question mark, plain language, no preamble.
  Good: "Why does this matter to you?"
  Good: "What does winning look like?"
  Bad: "What specifically about going to the gym excites you most or makes you feel good about yourself?"

When asking: return { "done": false, "question": "..." } with theme, imageKeyword, subjectHint as empty strings.
When finalizing: return { "done": true, "theme": "short phrase", "imageKeyword": "2-4 word image search", "subjectHint": "short subject fragment" } with question as empty string.

Examples of final output:
- theme: "attractive physique" · imageKeyword: "muscular bodybuilder silhouette" · subjectHint: "Your stronger self is watching"
- theme: "financial freedom" · imageKeyword: "sunrise city skyline" · subjectHint: "Future you is counting on today"

No markdown. No emojis.`;

const CLARIFY_SCHEMA = {
  name: "clarify_step",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      done: { type: "boolean" },
      question: { type: "string" },
      theme: { type: "string" },
      imageKeyword: { type: "string" },
      subjectHint: { type: "string" },
    },
    required: ["done", "question", "theme", "imageKeyword", "subjectHint"],
  },
} as const;

export async function nextClarifyStep(
  goal: string,
  history: ClarifyTurn[]
): Promise<ClarifyStep> {
  const historyText =
    history.length === 0
      ? "(no questions asked yet)"
      : history.map((t, i) => `Q${i + 1}: ${t.q}\nA${i + 1}: ${t.a}`).join("\n");

  const mustFinalize = history.length >= 2;
  const userPrompt = `User goal: ${goal}
Turns so far: ${history.length} (max 2).
${historyText}

${mustFinalize ? "You MUST finalize now. Return done=true with theme, imageKeyword, subjectHint." : "If you can already pick a strong theme + image keyword, FINALIZE. Otherwise ask ONE short (<=10 words) question."}`;

  const res = await client().chat.completions.create({
    model: MODEL_ID,
    messages: [
      { role: "system", content: CLARIFY_SYSTEM },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_schema", json_schema: CLARIFY_SCHEMA },
  });

  const text = res.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(text) as {
    done: boolean;
    question: string;
    theme: string;
    imageKeyword: string;
    subjectHint: string;
  };

  if (parsed.done || mustFinalize) {
    return {
      done: true,
      theme: parsed.theme || "personal growth",
      imageKeyword: parsed.imageKeyword || "sunrise mountain runner",
      subjectHint: parsed.subjectHint || "Keep going",
    };
  }
  return { done: false, question: (parsed.question || "Why does this matter to you?").trim() };
}

export type MotivationCopy = {
  subject: string;
  greeting: string;
  body: string;
  quote: string;
  quoteAuthor: string;
};

const COPY_SYSTEM = `You write ultra-short, punchy motivational emails. Output strict JSON.
- subject: compelling, <60 chars.
- greeting: 1 line, warm, uses first name.
- body: 2 short paragraphs MAX, ~40-70 words TOTAL (plain text, \\n separated). Speak directly to the goal + theme. One concrete image. No filler, no platitudes, no throat-clearing.
- quote: one real motivational quote relevant to the theme (kept for metadata, not displayed).
- quoteAuthor: attribution.
Absolutely no markdown, no emojis.`;

const COPY_SCHEMA = {
  name: "motivation_copy",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      subject: { type: "string" },
      greeting: { type: "string" },
      body: { type: "string" },
      quote: { type: "string" },
      quoteAuthor: { type: "string" },
    },
    required: ["subject", "greeting", "body", "quote", "quoteAuthor"],
  },
} as const;

export async function generateMotivationCopy(input: {
  fullname: string;
  goal: string;
  clarifyQA: ClarifyTurn[];
  theme: string;
  subjectHint: string;
  dayIndex: number;
}): Promise<MotivationCopy> {
  const qaText = input.clarifyQA.map((t, i) => `Q${i + 1}: ${t.q}\nA${i + 1}: ${t.a}`).join("\n");
  const userPrompt = `Recipient first name: ${input.fullname.split(" ")[0]}
Goal: ${input.goal}
Theme: ${input.theme}
Subject style hint: ${input.subjectHint}
Clarifying QA:
${qaText}
This is email #${input.dayIndex} in their journey. Keep it fresh — avoid repeating phrasing common to day 1.`;

  const res = await client().chat.completions.create({
    model: MODEL_ID,
    messages: [
      { role: "system", content: COPY_SYSTEM },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_schema", json_schema: COPY_SCHEMA },
  });

  const text = res.choices[0]?.message?.content ?? "{}";
  return JSON.parse(text) as MotivationCopy;
}
