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
  OPENAI_API_KEY: () => required("OPENAI_API_KEY"),
  UNSPLASH_ACCESS_KEY: () => required("UNSPLASH_ACCESS_KEY"),
  RESEND_API_KEY: () => required("RESEND_API_KEY"),
  RESEND_FROM: () => optional("RESEND_FROM", "KeepMyMotivation <noreply@keepmymotivation.com>"),
  LEMONSQUEEZY_WEBHOOK_SECRET: () => required("LEMONSQUEEZY_WEBHOOK_SECRET"),
  LEMONSQUEEZY_CHECKOUT_BOOST: () => required("LEMONSQUEEZY_CHECKOUT_BOOST"),
  LEMONSQUEEZY_CHECKOUT_DRIVE: () => required("LEMONSQUEEZY_CHECKOUT_DRIVE"),
  CRON_SECRET: () => required("CRON_SECRET"),
  SESSION_SECRET: () => required("SESSION_SECRET"),
};
