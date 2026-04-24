import { Resend } from "resend";
import { env } from "./env";

let client: Resend | null = null;
function getClient(): Resend {
  if (!client) client = new Resend(env.RESEND_API_KEY());
  return client;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  react?: React.ReactElement;
  html?: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  unsubscribeUrl?: string;
}) {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${opts.unsubscribeUrl}>`;
  }
  const { data, error } = await getClient().emails.send({
    from: env.RESEND_FROM(),
    to: opts.to,
    subject: opts.subject,
    react: opts.react,
    html: opts.html,
    text: opts.text,
    replyTo: opts.replyTo ?? env.RESEND_REPLY_TO(),
    headers,
  } as Parameters<Resend["emails"]["send"]>[0]);
  if (error) throw new Error(`Resend error: ${error.message ?? JSON.stringify(error)}`);
  return data;
}
