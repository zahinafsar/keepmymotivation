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
  PEXELS_API_KEY: () => required("PEXELS_API_KEY"),
  RESEND_API_KEY: () => required("RESEND_API_KEY"),
  RESEND_FROM: () => optional("RESEND_FROM", "KeepMyMotivation <noreply@keepmymotivation.com>"),
  RESEND_REPLY_TO: () => optional("RESEND_REPLY_TO", "support@keepmymotivation.com"),
  LEMONSQUEEZY_WEBHOOK_SECRET: () => required("LEMONSQUEEZY_WEBHOOK_SECRET"),
  LEMONSQUEEZY_API_KEY: () => required("LEMONSQUEEZY_API_KEY"),
  LEMONSQUEEZY_CHECKOUT_BOOST: () => required("LEMONSQUEEZY_CHECKOUT_BOOST"),
  LEMONSQUEEZY_CHECKOUT_DRIVE: () => required("LEMONSQUEEZY_CHECKOUT_DRIVE"),
  LEMONSQUEEZY_VARIANT_BOOST: () => required("LEMONSQUEEZY_VARIANT_BOOST"),
  LEMONSQUEEZY_VARIANT_DRIVE: () => required("LEMONSQUEEZY_VARIANT_DRIVE"),
  CRON_SECRET: () => required("CRON_SECRET"),
  SESSION_SECRET: () => required("SESSION_SECRET"),
};
