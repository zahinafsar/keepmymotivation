import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { env } from "./env";
import { searchWeb, scrapeUrl } from "./firecrawl";

let _google: ReturnType<typeof createGoogleGenerativeAI> | null = null;
function model() {
  if (!_google) _google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY() });
  return _google(MODEL_ID);
}

const MODEL_ID = "gemini-2.5-flash";

export type ScheduledEmailCopy = {
  subject: string;
  preview: string;
  markdown: string;
};

const DRAFT_SYSTEM = `You write the BODY of a single scheduled email, following the recipient's request.

Output ONLY the email body in GitHub-flavored Markdown — no preamble, no code fence around the whole thing, no "here is your email".

DECIDE EVERYTHING the request leaves open (tone, depth, length, audience level, structure) with sensible defaults that fit the topic. Don't ask — just produce a strong email.

LIVE SOURCES (tools):
- You may have two tools: webSearch (fresh info from a query) and scrapeUrl (read one URL as markdown).
- If the request needs CURRENT information, call webSearch first. If it names specific URLs to read, call scrapeUrl on them.
- Base any factual content STRICTLY on tool results — never invent figures, dates, quotes, or links beyond what they return.
- If a tool returns nothing usable, write from your own knowledge. Never mention tools, searches, fetch failures, or sources to the reader.
- Don't call tools when the email needs no live data (timeless motivation, evergreen tips, code/Q&A).

- Write in the same language as the fetched source content (or the request when there are no sources).

MARKDOWN RULES (body):
- Start with a single H1 (\`# Title\`) — short, <70 chars.
- Use H2 (\`##\`) for section headings as needed.
- Use paragraphs, bulleted lists, numbered lists, **bold**, *italic*, \`inline code\`, fenced code blocks (\`\`\`), > blockquotes, and [links](https://...) — whatever fits the content.
- Tables, images, raw HTML: do NOT use (poor email-client support).
- Keep it tight. No filler, no throat-clearing, no platitudes.
- Vary structure across sends (use dayIndex hint to avoid repeating phrasing).
- No emojis unless the request explicitly asks for them.

SEQUENCING:
- If an "Already sent" list is provided, treat it as the topics already covered in this schedule.
- When the request implies an ordered series (a course, lessons, chapters, "one topic per day"), continue from where that list leaves off — pick the NEXT logical topic, never one already listed.
- When the request is open-ended (tips, news, motivation), just pick a fresh angle not already covered.`;

const SUBJECT_SYSTEM = `You write the inbox subject line and preview text for a finished email body.

Return:
- subject: <60 chars, compelling, fits the email. Plain text, no markdown.
- preview: <90 chars, one-sentence inbox-preview line (no trailing period required). Plain text.

Write both in the SAME language as the email body. No markdown, no emojis unless the body uses them.`;

const subjectSchema = z.object({
  subject: z.string(),
  preview: z.string(),
});

const searchWebTool = tool({
  description:
    "Search the web for current, up-to-date information. Returns markdown snippets from the top results. Use when the email needs fresh facts, news, prices, scores, or anything time-sensitive.",
  inputSchema: z.object({
    query: z.string().describe("A concise web search query."),
  }),
  execute: async ({ query }) => (await searchWeb(query)) ?? "No results found.",
});

const scrapeUrlTool = tool({
  description:
    "Fetch the main content of one specific URL as markdown. Use when the user prompt names a URL to read or summarize.",
  inputSchema: z.object({
    url: z.string().describe("An absolute http(s) URL to fetch."),
  }),
  execute: async ({ url }) => (await scrapeUrl(url)) ?? "Could not fetch this URL.",
});

export async function generateScheduledEmailCopy(input: {
  fullname: string;
  prompt: string;
  dayIndex: number;
  priorTopics?: string[];
}): Promise<ScheduledEmailCopy> {
  const priorBlock = input.priorTopics?.length
    ? `\nAlready sent (newest first):\n${input.priorTopics
        .map((t) => `- ${t}`)
        .join("\n")}\nCover the NEXT topic in the series; do NOT repeat any of the above.`
    : "";

  const userPrompt = `Recipient first name: ${input.fullname.split(" ")[0]}
Request: ${input.prompt}
This is email #${input.dayIndex} in their schedule. Keep it fresh — avoid repeating phrasing from earlier sends.${priorBlock}`;

  // Tools need Firecrawl; only offer them when configured.
  // NOTE: Gemini can't combine function-calling with JSON output in one call,
  // so we draft the body with tools (plain text), then format subject/preview.
  const tools = env.FIRECRAWL_API_KEY()
    ? { webSearch: searchWebTool, scrapeUrl: scrapeUrlTool }
    : undefined;

  const draft = await generateText({
    model: model(),
    system: DRAFT_SYSTEM,
    prompt: userPrompt,
    tools,
    stopWhen: stepCountIs(5),
  });
  const markdown = draft.text.trim();

  const { object } = await generateObject({
    model: model(),
    schema: subjectSchema,
    system: SUBJECT_SYSTEM,
    prompt: `Email body:\n${markdown}`,
  });

  return { subject: object.subject, preview: object.preview, markdown };
}
