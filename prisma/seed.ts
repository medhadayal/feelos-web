import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function pick<T>(arr: T[]) { return arr[Math.floor(Math.random()*arr.length)]; }

async function main() {
  const names = ["Ava","Liam","Noah","Mia","Ethan","Zoe","Oliver","Sophia","Lucas","Isabella"];
  const roles = ["Frontend Engineer","Backend Engineer","Data Scientist","Product Manager","DevOps Engineer"];
  const companies = ["Acme Corp","Globex","Initech","Stark Industries","Wayne Tech","Umbrella","Wonka Labs"];
  const locations = ["Remote","San Francisco, CA","New York, NY","Austin, TX","Seattle, WA"];
  const statuses = ["Applied","Phone Screen","Interview","Offer","Rejected"];

  for (let i = 0; i < 25; i++) {
    const name = `${pick(names)} ${String.fromCharCode(65+(i%26))}.`;
    const email = `user${i+1}@feelos.dev`;

    const user = await prisma.user.upsert({ where: { email }, update: {}, create: { email, name } });

    for (let m = 0; m < 5; m++) {
      await prisma.moodEntry.create({ data: { userId: user.id, mood: pick(["happy","neutral","concerned"]), note: "seed" } });
    }
    for (let k = 0; k < 5; k++) {
      await prisma.conversationMessage.create({ data: { userId: user.id, role: pick(["user","assistant"]), content: `Seed message ${k+1} for ${user.email}` } });
    }
    await prisma.dailyPlan.upsert({
      where: { userId: user.id },
      update: { date: new Date(), focusItems: JSON.stringify(["Plan morning","Deep work","Sync with team"]), selfCare: "5-minute breathing" },
      create: { userId: user.id, date: new Date(), focusItems: JSON.stringify(["Plan morning","Deep work","Sync with team"]), selfCare: "5-minute breathing" },
    });

    for (let j = 0; j < 10; j++) {
      await prisma.jobApplication.create({
        data: {
          userId: user.id,
          company: pick(companies),
          role: pick(roles),
          location: pick(locations),
          status: pick(statuses),
          jdUrl: "https://example.com/jd",
          notes: "Seeded entry",
        },
      });
    }
  }

  console.log("Seed complete");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
