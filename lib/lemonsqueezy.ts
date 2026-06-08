import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";
import type { SubStatus } from "@prisma/client";

export function verifyLemonSignature(rawBody: string, sigHeader: string | null): boolean {
  if (!sigHeader) return false;
  const expected = createHmac("sha256", env.LEMONSQUEEZY_WEBHOOK_SECRET())
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(sigHeader, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function checkoutUrlForPro(): string {
  return env.LEMONSQUEEZY_CHECKOUT_PRO();
}

const LS_API = "https://api.lemonsqueezy.com/v1";

async function lsFetch(path: string, init: RequestInit): Promise<unknown> {
  const res = await fetch(`${LS_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${env.LEMONSQUEEZY_API_KEY()}`,
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`LS API ${res.status}: ${text.slice(0, 200)}`);
  }
  return text ? JSON.parse(text) : null;
}

export async function cancelLsSubscription(lsSubscriptionId: string): Promise<void> {
  await lsFetch(`/subscriptions/${lsSubscriptionId}`, { method: "DELETE" });
}

export function mapLsStatus(status: string): SubStatus {
  switch (status) {
    case "active":
    case "on_trial":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "cancelled":
    case "expired":
    case "paused":
    default:
      return "CANCELED";
  }
}

export type LsSubscriptionPayload = {
  meta: {
    event_name: string;
    custom_data?: { user_id?: string; plan?: string };
  };
  data: {
    type: string;
    id: string;
    attributes: {
      customer_id: number;
      status: string;
      renews_at: string | null;
      ends_at: string | null;
    };
  };
};

export type LsInvoicePayload = {
  meta: {
    event_name: string;
    custom_data?: { user_id?: string; plan?: string };
  };
  data: {
    type: string;
    id: string;
    attributes: {
      subscription_id: number;
      status: string;
    };
  };
};
