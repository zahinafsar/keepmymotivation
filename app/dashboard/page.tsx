import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; upgraded?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const lastEmail = await prisma.emailLog.findFirst({
    where: { userId: user.id },
    orderBy: { sentAt: "desc" },
  });

  return (
    <DashboardClient
      user={{
        fullname: user.fullname,
        email: user.email,
        timezone: user.timezone,
      }}
      goal={user.goal ? { goalText: user.goal.goalText, sendHour: user.goal.sendHour } : null}
      subscription={
        user.subscription
          ? {
              plan: user.subscription.plan,
              status: user.subscription.status,
              currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString() ?? null,
            }
          : null
      }
      lastEmailAt={lastEmail?.sentAt.toISOString() ?? null}
      welcome={params.welcome === "1"}
      upgraded={params.upgraded === "1"}
    />
  );
}
