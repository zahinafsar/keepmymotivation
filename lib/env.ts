function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

function optional(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export const env = {
  APP_URL: optional("APP_URL", "http://localhost:3000"),
  GEMINI_API_KEY: () => required("GEMINI_API_KEY"),
  PEXELS_API_KEY: () => required("PEXELS_API_KEY"),
  FIRECRAWL_API_KEY: () => optional("FIRECRAWL_API_KEY"),
  RESEND_API_KEY: () => required("RESEND_API_KEY"),
  RESEND_FROM: () => required("RESEND_FROM"),
  RESEND_REPLY_TO: () => optional("RESEND_REPLY_TO", "support@keepmymotivation.com"),
  LEMONSQUEEZY_WEBHOOK_SECRET: () => required("LEMONSQUEEZY_WEBHOOK_SECRET"),
  LEMONSQUEEZY_API_KEY: () => required("LEMONSQUEEZY_API_KEY"),
  LEMONSQUEEZY_CHECKOUT_PRO: () => required("LEMONSQUEEZY_CHECKOUT_PRO"),
  CRON_SECRET: () => required("CRON_SECRET"),
  SESSION_SECRET: () => required("SESSION_SECRET"),
};
