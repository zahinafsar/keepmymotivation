import { prisma } from "../lib/prisma";
import { sendScheduledEmailForUser } from "../lib/email-dispatcher";

const TO = process.argv[2] ?? "afsarzahin@gmail.com";

async function main() {
  const schedule = await prisma.schedule.findFirst({
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!schedule) throw new Error("No schedules found");

  console.log(
    `Sending test of schedule ${schedule.id} (owner ${schedule.user.email}) to ${TO}…`
  );
  console.log(`Prompt: ${schedule.prompt}`);

  await sendScheduledEmailForUser(schedule.userId, {
    scheduleId: schedule.id,
    to: TO,
  });

  console.log("Sent.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
