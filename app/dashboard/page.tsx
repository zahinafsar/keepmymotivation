import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; upgraded?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const [lastEmail, goals] = await Promise.all([
    prisma.emailLog.findFirst({
      where: { userId: user.id },
      orderBy: { sentAt: "desc" },
    }),
    prisma.goal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <DashboardClient
      user={{
        fullname: user.fullname,
        email: user.email,
        timezone: user.timezone,
      }}
      subscription={
        user.subscription
          ? {
              plan: user.subscription.plan,
              status: user.subscription.status,
              currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString() ?? null,
            }
          : null
      }
      goals={goals.map((g) => ({
        id: g.id,
        goalText: g.goalText,
        kind: g.kind,
        hour: g.hour,
        dayOfWeek: g.dayOfWeek,
        dayOfMonth: g.dayOfMonth,
        active: g.active,
      }))}
      lastEmailAt={lastEmail?.sentAt.toISOString() ?? null}
      welcome={params.welcome === "1"}
      upgraded={params.upgraded === "1"}
    />
  );
}
