import { PrismaClient } from "@prisma/client";
import { generateAvatar } from "../src/lib/utils";

const prisma = new PrismaClient();

async function main() {
  const doctors = await prisma.doctor.findMany();

  for (const d of doctors) {
    const shouldReplace =
      !d.imageUrl ||
      d.imageUrl.includes("avtar.iran.liara.run") ||
      d.imageUrl.includes("avatar.iran.liara.run");

    if (shouldReplace) {
      await prisma.doctor.update({
        where: { id: d.id },
        data: {
          imageUrl: generateAvatar(d.name || "Doctor", (d as any).gender),
        },
      });
    }
  }

  console.log("Doctor avatars backfilled.");
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());