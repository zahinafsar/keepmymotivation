import { prisma } from "./prisma";
import { sendEmail } from "./resend";
import { generateScheduledEmailCopy } from "./gemini";
import ScheduledEmail from "../emails/ScheduledEmail";
import { env } from "./env";

export async function sendScheduledEmailForUser(
  userId: string,
  opts: { preview?: boolean; scheduleId?: string; to?: string } = {}
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
      schedules: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!user || !user.subscription) throw new Error("User/sub missing");

  const schedule = opts.scheduleId
    ? user.schedules.find((s) => s.id === opts.scheduleId)
    : user.schedules[0];
  if (!schedule) throw new Error("Schedule missing");

  const dayIndex =
    (await prisma.emailLog.count({ where: { scheduleId: schedule.id } })) + 1;

  const copy = await generateScheduledEmailCopy({
    fullname: user.fullname,
    prompt: schedule.prompt,
    dayIndex,
  });

  const showUpgrade = user.subscription.status === "TRIALING";
  const manageUrl = `${env.APP_URL}/dashboard`;

  await sendEmail({
    to: opts.to ?? user.email,
    subject: copy.subject,
    react: ScheduledEmail({
      preview: copy.preview,
      markdown: copy.markdown,
      upgradeUrl: manageUrl,
      showUpgrade,
      manageUrl,
    }),
    unsubscribeUrl: manageUrl,
  });

  // Test sends to an external address don't count toward the schedule history.
  if (opts.to) return;

  await prisma.emailLog.create({
    data: {
      userId,
      scheduleId: schedule.id,
      subject: copy.subject,
      body: copy.markdown,
      imageUrl: null,
      plan: user.subscription.plan,
      preview: opts.preview ?? false,
    },
  });
}
