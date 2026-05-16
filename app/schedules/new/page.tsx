import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PLAN_ALLOWED_KINDS, PLAN_MAX_SCHEDULES } from "@/lib/plan";
import NewScheduleClient from "./NewScheduleClient";

export const dynamic = "force-dynamic";

export default async function NewSchedulePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const plan = user.subscription?.plan ?? "SPARK";
  const allowedKinds = PLAN_ALLOWED_KINDS[plan];
  const max = PLAN_MAX_SCHEDULES[plan];

  const count = await prisma.schedule.count({ where: { userId: user.id } });
  if (count >= max) redirect("/dashboard");

  return <NewScheduleClient allowedKinds={allowedKinds} timezone={user.timezone} />;
}
