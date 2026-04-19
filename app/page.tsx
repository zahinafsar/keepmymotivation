import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return <HomeClient />;
}
