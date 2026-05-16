import { prisma } from "./prisma";
import { sendEmail } from "./resend";
import { generateScheduledEmailCopy, type ClarifyTurn } from "./gemini";
import ScheduledEmail from "../emails/ScheduledEmail";
import { env } from "./env";

export async function sendScheduledEmailForUser(
  userId: string,
  opts: { preview?: boolean; scheduleId?: string } = {}
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
    clarifyQA: schedule.clarifyQA as unknown as ClarifyTurn[],
    brief: schedule.brief,
    subjectHint: schedule.subjectHint,
    dayIndex,
  });

  const showUpgrade = user.subscription.plan === "SPARK";
  const manageUrl = `${env.APP_URL}/dashboard`;

  await sendEmail({
    to: user.email,
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
