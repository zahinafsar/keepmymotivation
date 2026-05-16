import { GoogleGenAI, Type } from "@google/genai";
import { env } from "./env";

let _client: GoogleGenAI | null = null;
function client() {
  if (!_client) _client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY() });
  return _client;
}

const MODEL_ID = "gemini-2.5-flash";

export type ClarifyTurn = { q: string; a: string };

export type ClarifyStep =
  | { done: false; question: string }
  | {
      done: true;
      brief: string;
      imageKeyword: string;
      subjectHint: string;
    };

const CLARIFY_SYSTEM = `You help shape a recurring scheduled email for a user. The user provides a free-text prompt describing what they want emailed to them on a schedule (motivation, news recap, recipe, study tip, prayer reminder, fitness nudge — anything).

YOUR JOB:
- If the prompt already gives you enough to write a strong email, FINALIZE immediately.
- Otherwise ask AT MOST TWO short clarifying questions to pin down audience, purpose, tone, depth, or any missing constraint.
- Questions must be SHORT: max 12 words, one question mark, plain language, no preamble.
- After 2 answered questions, you MUST finalize.

When asking: return { "done": false, "question": "..." } with brief, imageKeyword, subjectHint as empty strings.

When finalizing: return { "done": true, "brief": "...", "imageKeyword": "...", "subjectHint": "..." } with question empty.
- brief: ONE paragraph (40-90 words) describing exactly what each email should contain — audience, purpose, tone, structure, level of depth. This is the directive a copywriter follows every send.
- imageKeyword: 2-4 word visual search term IF a hero image fits the email. Leave empty string "" for text-only emails (technical/code/data/Q&A/very-short reminders usually don't need a hero image).
- subjectHint: short fragment that hints at subject-line style.

No markdown. No emojis.`;

const CLARIFY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    done: { type: Type.BOOLEAN },
    question: { type: Type.STRING },
    brief: { type: Type.STRING },
    imageKeyword: { type: Type.STRING },
    subjectHint: { type: Type.STRING },
  },
  required: ["done", "question", "brief", "imageKeyword", "subjectHint"],
  propertyOrdering: ["done", "question", "brief", "imageKeyword", "subjectHint"],
};

export async function nextClarifyStep(
  prompt: string,
  history: ClarifyTurn[]
): Promise<ClarifyStep> {
  const historyText =
    history.length === 0
      ? "(no questions asked yet)"
      : history.map((t, i) => `Q${i + 1}: ${t.q}\nA${i + 1}: ${t.a}`).join("\n");

  const mustFinalize = history.length >= 2;
  const userPrompt = `User prompt: ${prompt}
Turns so far: ${history.length} (max 2).
${historyText}

${mustFinalize ? "You MUST finalize now. Return done=true with brief, imageKeyword, subjectHint." : "If you can already write a strong brief, FINALIZE. Otherwise ask ONE short (<=12 words) question."}`;

  const res = await client().models.generateContent({
    model: MODEL_ID,
    contents: userPrompt,
    config: {
      systemInstruction: CLARIFY_SYSTEM,
      responseMimeType: "application/json",
      responseSchema: CLARIFY_SCHEMA,
    },
  });

  const text = res.text ?? "{}";
  const parsed = JSON.parse(text) as {
    done: boolean;
    question: string;
    brief: string;
    imageKeyword: string;
    subjectHint: string;
  };

  if (parsed.done || mustFinalize) {
    return {
      done: true,
      brief: parsed.brief || prompt,
      imageKeyword: (parsed.imageKeyword || "").trim(),
      subjectHint: parsed.subjectHint || "Your scheduled update",
    };
  }
  return { done: false, question: (parsed.question || "What outcome do you want from these emails?").trim() };
}

export type ScheduledEmailCopy = {
  subject: string;
  preview: string;
  markdown: string;
};

const COPY_SYSTEM = `You write a single scheduled email for a recipient, following a fixed brief.

Output strict JSON with three fields:
- subject: <60 chars, compelling, matches subjectHint style. Plain text, no markdown.
- preview: <90 chars, inbox-preview line (one sentence, no trailing period required). Plain text.
- markdown: the full email body in GitHub-flavored Markdown. This is rendered to HTML for Gmail and other clients.

MARKDOWN RULES (body):
- Start with a single H1 (\`# Title\`) — short, <70 chars.
- Use H2 (\`##\`) for section headings as needed.
- Use paragraphs, bulleted lists, numbered lists, **bold**, *italic*, \`inline code\`, fenced code blocks (\`\`\`), > blockquotes, and [links](https://...) — whatever fits the content.
- Tables, images, raw HTML: do NOT use (poor email-client support).
- Keep it tight. No filler, no throat-clearing, no platitudes.
- Vary structure across sends (use dayIndex hint to avoid repeating phrasing).
- Match the brief exactly: audience, purpose, depth, tone.
- No emojis unless the brief explicitly asks for them.`;

const COPY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING },
    preview: { type: Type.STRING },
    markdown: { type: Type.STRING },
  },
  required: ["subject", "preview", "markdown"],
  propertyOrdering: ["subject", "preview", "markdown"],
};

export async function generateScheduledEmailCopy(input: {
  fullname: string;
  prompt: string;
  clarifyQA: ClarifyTurn[];
  brief: string;
  subjectHint: string;
  dayIndex: number;
}): Promise<ScheduledEmailCopy> {
  const qaText = input.clarifyQA.map((t, i) => `Q${i + 1}: ${t.q}\nA${i + 1}: ${t.a}`).join("\n");
  const userPrompt = `Recipient first name: ${input.fullname.split(" ")[0]}
User prompt: ${input.prompt}
Brief (follow exactly): ${input.brief}
Subject style hint: ${input.subjectHint}
Clarifying QA:
${qaText || "(none)"}
This is email #${input.dayIndex} in their schedule. Keep it fresh — avoid repeating phrasing from earlier sends.`;

  const res = await client().models.generateContent({
    model: MODEL_ID,
    contents: userPrompt,
    config: {
      systemInstruction: COPY_SYSTEM,
      responseMimeType: "application/json",
      responseSchema: COPY_SCHEMA,
    },
  });

  const text = res.text ?? "{}";
  return JSON.parse(text) as ScheduledEmailCopy;
}
