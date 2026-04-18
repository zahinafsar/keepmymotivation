// PM2-invoked cron wrapper. Hits the Next API route that dispatches due emails.
require("dotenv").config();

const appUrl = process.env.APP_URL || "http://localhost:3000";
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("Missing CRON_SECRET in env");
  process.exit(1);
}

(async () => {
  try {
    const res = await fetch(`${appUrl}/api/cron/send-emails`, {
      method: "POST",
      headers: { "x-cron-secret": secret },
    });
    const data = await res.json();
    console.log(JSON.stringify({ status: res.status, ...data }));
    if (!res.ok) process.exit(1);
  } catch (e) {
    console.error("cron:send failed", e);
    process.exit(1);
  }
})();
