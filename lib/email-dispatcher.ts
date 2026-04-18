import { prisma } from "./prisma";
import { sendEmail } from "./resend";
import { searchUnsplash } from "./stock";
import { generateMotivationCopy, type ClarifyTurn } from "./gemini";
import MotivationEmail from "../emails/MotivationEmail";
import { env } from "./env";

export async function sendMotivationEmailForUser(
  userId: string,
  opts: { preview?: boolean } = {}
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { goal: true, subscription: true, emailLogs: { orderBy: { sentAt: "desc" }, take: 1 } },
  });
  if (!user || !user.goal || !user.subscription) throw new Error("User/goal/sub missing");

  const dayIndex = (await prisma.emailLog.count({ where: { userId } })) + 1;

  const [copy, image] = await Promise.all([
    generateMotivationCopy({
      fullname: user.fullname,
      goal: user.goal.goalText,
      clarifyQA: user.goal.clarifyQA as unknown as ClarifyTurn[],
      theme: user.goal.theme,
      subjectHint: user.goal.subjectHint,
      dayIndex,
    }),
    searchUnsplash(user.goal.imageKeyword).catch(() => null),
  ]);

  const showUpgrade = user.subscription.plan === "SPARK";

  await sendEmail({
    to: user.email,
    subject: copy.subject,
    react: MotivationEmail({
      greeting: copy.greeting,
      body: copy.body,
      quote: copy.quote,
      quoteAuthor: copy.quoteAuthor,
      image,
      upgradeUrl: `${env.APP_URL}/dashboard`,
      showUpgrade,
    }),
  });

  await prisma.emailLog.create({
    data: {
      userId,
      subject: copy.subject,
      body: copy.body,
      imageUrl: image?.url ?? null,
      plan: user.subscription.plan,
      preview: opts.preview ?? false,
    },
  });
}
