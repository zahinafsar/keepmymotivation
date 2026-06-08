import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { hasAccess } from "@/lib/plan";
import NewScheduleClient from "./NewScheduleClient";

export const dynamic = "force-dynamic";

export default async function NewSchedulePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (!user.subscription || !hasAccess(user.subscription, new Date())) {
    redirect("/dashboard");
  }

  return <NewScheduleClient />;
}
