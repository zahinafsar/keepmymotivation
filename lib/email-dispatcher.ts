import { prisma } from "./prisma";
import { sendEmail } from "./resend";
import { searchPexels } from "./stock";
import { generateMotivationCopy, type ClarifyTurn } from "./gemini";
import MotivationEmail from "../emails/MotivationEmail";
import { env } from "./env";

export async function sendMotivationEmailForUser(
  userId: string,
  opts: { preview?: boolean; goalId?: string } = {}
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
      goals: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!user || !user.subscription) throw new Error("User/sub missing");

  const goal = opts.goalId
    ? user.goals.find((g) => g.id === opts.goalId)
    : user.goals[0];
  if (!goal) throw new Error("Goal missing");

  const dayIndex =
    (await prisma.emailLog.count({ where: { goalId: goal.id } })) + 1;

  const [copy, image] = await Promise.all([
    generateMotivationCopy({
      fullname: user.fullname,
      goal: goal.goalText,
      clarifyQA: goal.clarifyQA as unknown as ClarifyTurn[],
      theme: goal.theme,
      subjectHint: goal.subjectHint,
      dayIndex,
    }),
    searchPexels(goal.imageKeyword).catch(() => null),
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
      goalId: goal.id,
      subject: copy.subject,
      body: copy.body,
      imageUrl: image?.url ?? null,
      plan: user.subscription.plan,
      preview: opts.preview ?? false,
    },
  });
}
