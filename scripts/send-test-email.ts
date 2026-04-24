import { sendEmail } from "../lib/resend";
import MotivationEmail from "../emails/MotivationEmail";
import { env } from "../lib/env";

const to = process.argv[2];
if (!to) {
  console.error("Usage: bun scripts/send-test-email.ts <recipient>");
  process.exit(1);
}

const manageUrl = `${env.APP_URL}/dashboard`;

async function main() {
  const data = await sendEmail({
    to,
    subject: "Quick check-in on your goal",
    react: MotivationEmail({
      greeting: "Hey there,",
      body: "Small reminder: every focused block today moves the needle.\n\nThe compound effect of one good hour, repeated, is what separates outcomes a year from now. Pick the next concrete step and start it before you read another email.",
      quote: "Discipline is choosing between what you want now and what you want most.",
      quoteAuthor: "Abraham Lincoln",
      image: null,
      upgradeUrl: manageUrl,
      showUpgrade: false,
      manageUrl,
    }),
    unsubscribeUrl: manageUrl,
  });
  console.log("sent", data);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
