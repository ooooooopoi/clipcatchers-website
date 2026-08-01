import { PrismaClient, type CampaignStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays, startOfDay } from "date-fns";

const prisma = new PrismaClient();

const EMAIL = process.env.SEED_EMAIL ?? "demo@clipcatchers.com";
const PASSWORD = process.env.SEED_PASSWORD ?? "ClipCatchers!2026";

const CAMPAIGNS = [
  {
    name: "Midnight Drive — Single Push",
    brandName: "Northwind Records",
    status: "RUNNING" as CampaignStatus,
    budget: 750_000,
    spent: 486_200,
    views: 12_480_000,
    reach: 8_930_000,
    platforms: ["TikTok", "Instagram"],
    goal: "Brand Awareness",
    description:
      "Clip the chorus of Midnight Drive over driving, night-time or gameplay footage. Hook in the first two seconds, track credited in the caption.",
    startOffset: -24,
    endOffset: 18,
  },
  {
    name: "Season 4 Launch Blitz",
    brandName: "Apex Interactive",
    status: "RUNNING" as CampaignStatus,
    budget: 1_200_000,
    spent: 402_500,
    views: 7_640_000,
    reach: 5_120_000,
    platforms: ["TikTok", "YouTube", "X"],
    goal: "Product Launch",
    description:
      "Highlight the new season's weapons and map rotation. Gameplay only, no face cams, keep clips under 30 seconds.",
    startOffset: -12,
    endOffset: 30,
  },
  {
    name: "Summer Capsule Drop",
    brandName: "Lumen Apparel",
    status: "APPROVED" as CampaignStatus,
    budget: 400_000,
    spent: 0,
    views: 0,
    reach: 0,
    platforms: ["Instagram", "TikTok"],
    goal: "Sales / Conversions",
    description:
      "Try-on and styling clips featuring the summer capsule. Natural light, outdoor settings, discount code in caption.",
    startOffset: 3,
    endOffset: 45,
  },
  {
    name: "Founders Podcast Clips",
    brandName: "Signal Media",
    status: "PAUSED" as CampaignStatus,
    budget: 250_000,
    spent: 118_400,
    views: 2_310_000,
    reach: 1_640_000,
    platforms: ["TikTok", "Instagram", "YouTube"],
    goal: "Community Growth",
    description:
      "Cut the strongest 45 seconds from each episode. Captions burned in, episode number in the caption.",
    startOffset: -40,
    endOffset: 12,
  },
  {
    name: "Winter Album Rollout",
    brandName: "Northwind Records",
    status: "COMPLETED" as CampaignStatus,
    budget: 600_000,
    spent: 598_700,
    views: 18_920_000,
    reach: 12_400_000,
    platforms: ["TikTok", "Instagram"],
    goal: "Brand Awareness",
    description: "Album rollout clips across the full tracklist. Wrapped in December.",
    startOffset: -120,
    endOffset: -20,
  },
  {
    name: "Creator Referral Test",
    brandName: "Apex Interactive",
    status: "PENDING" as CampaignStatus,
    budget: 150_000,
    spent: 0,
    views: 0,
    reach: 0,
    platforms: ["TikTok"],
    goal: "Content Volume",
    description: "Small test campaign to benchmark referral-driven clip volume before scaling.",
    startOffset: 7,
    endOffset: 37,
  },
];

async function main() {
  console.log("Seeding Clip Catchers dashboard…");

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { passwordHash, emailVerified: new Date() },
    create: {
      email: EMAIL,
      name: "Alex Rivera",
      company: "Northwind Records",
      passwordHash,
      emailVerified: new Date(),
      plan: "GROWTH",
      planRenewsAt: addDays(new Date(), 21),
      settings: { create: {} },
    },
  });

  // Start clean so re-seeding is idempotent.
  await prisma.campaignMetric.deleteMany({ where: { campaign: { userId: user.id } } });
  await prisma.campaign.deleteMany({ where: { userId: user.id } });
  await prisma.invoice.deleteMany({ where: { userId: user.id } });
  await prisma.notification.deleteMany({ where: { userId: user.id } });
  await prisma.paymentMethod.deleteMany({ where: { userId: user.id } });
  await prisma.ticketMessage.deleteMany({ where: { ticket: { userId: user.id } } });
  await prisma.supportTicket.deleteMany({ where: { userId: user.id } });

  for (const spec of CAMPAIGNS) {
    const campaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        name: spec.name,
        brandName: spec.brandName,
        website: "https://example.com",
        discord: "discord.gg/clipcatchers",
        description: spec.description,
        goal: spec.goal,
        status: spec.status,
        budgetCents: spec.budget,
        spentCents: spec.spent,
        totalViews: spec.views,
        estimatedReach: spec.reach,
        platforms: spec.platforms,
        startDate: addDays(new Date(), spec.startOffset),
        endDate: addDays(new Date(), spec.endOffset),
      },
    });

    if (spec.views === 0) continue;

    // Spread delivery over the last 45 days with a believable ramp.
    const days = 45;
    const weights = Array.from({ length: days }, (_, i) => {
      const ramp = Math.min(1, (i + 1) / 12);
      const wobble = 0.75 + Math.sin(i * 1.7) * 0.18 + Math.random() * 0.2;
      return ramp * wobble;
    });
    const weightTotal = weights.reduce((a, b) => a + b, 0);

    await prisma.campaignMetric.createMany({
      data: weights.map((weight, i) => {
        const share = weight / weightTotal;
        return {
          campaignId: campaign.id,
          date: startOfDay(subDays(new Date(), days - 1 - i)),
          views: Math.round(spec.views * share),
          reach: Math.round(spec.reach * share),
          spendCents: Math.round(spec.spent * share),
        };
      }),
    });
  }

  await prisma.invoice.createMany({
    data: [
      {
        userId: user.id,
        number: "CC-2026-0001",
        description: "Winter Album Rollout — final",
        amountCents: 598_700,
        status: "PAID",
        issuedAt: subDays(new Date(), 96),
        paidAt: subDays(new Date(), 92),
      },
      {
        userId: user.id,
        number: "CC-2026-0002",
        description: "Growth plan — monthly subscription",
        amountCents: 79_900,
        status: "PAID",
        issuedAt: subDays(new Date(), 38),
        paidAt: subDays(new Date(), 38),
      },
      {
        userId: user.id,
        number: "CC-2026-0003",
        description: "Midnight Drive — milestone 1",
        amountCents: 300_000,
        status: "PAID",
        issuedAt: subDays(new Date(), 18),
        paidAt: subDays(new Date(), 15),
      },
      {
        userId: user.id,
        number: "CC-2026-0004",
        description: "Season 4 Launch Blitz — milestone 1",
        amountCents: 402_500,
        status: "OPEN",
        issuedAt: subDays(new Date(), 4),
        dueAt: addDays(new Date(), 10),
      },
    ],
  });

  await prisma.paymentMethod.create({
    data: {
      userId: user.id,
      brand: "visa",
      last4: "4242",
      expMonth: 8,
      expYear: 2028,
      isDefault: true,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: "CAMPAIGN_RUNNING",
        title: "Season 4 Launch Blitz is live",
        body: "First clips are publishing now — expect view data within 6 hours.",
        link: "/campaigns",
        createdAt: subDays(new Date(), 1),
      },
      {
        userId: user.id,
        type: "CAMPAIGN_APPROVED",
        title: "Summer Capsule Drop approved",
        body: "We're briefing creators now. Delivery starts on your scheduled date.",
        link: "/campaigns",
        createdAt: subDays(new Date(), 2),
      },
      {
        userId: user.id,
        type: "INVOICE_PAID",
        title: "Invoice CC-2026-0003 paid",
        body: "Thanks — $3,000.00 received for Midnight Drive milestone 1.",
        link: "/billing",
        read: true,
        createdAt: subDays(new Date(), 15),
      },
      {
        userId: user.id,
        type: "CAMPAIGN_COMPLETED",
        title: "Winter Album Rollout completed",
        body: "Final numbers: 18.9M views across 214 clips.",
        link: "/campaigns",
        read: true,
        createdAt: subDays(new Date(), 20),
      },
    ],
  });

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: user.id,
      subject: "Can we add YouTube Shorts to Midnight Drive?",
      status: "PENDING",
      priority: "NORMAL",
      createdAt: subDays(new Date(), 3),
    },
  });

  await prisma.ticketMessage.createMany({
    data: [
      {
        ticketId: ticket.id,
        authorId: user.id,
        body: "We're seeing strong pull on TikTok — would like to extend Midnight Drive to YouTube Shorts if the budget allows.",
        createdAt: subDays(new Date(), 3),
      },
      {
        ticketId: ticket.id,
        authorId: user.id,
        fromStaff: true,
        body: "Absolutely — Shorts typically runs a slightly higher CPM, around $3.10 vs the $2.40 you're seeing on TikTok. We can shift 20% of the remaining budget across without touching your end date. Want us to go ahead?",
        createdAt: subDays(new Date(), 2),
      },
    ],
  });

  console.log(`\nSeed complete.\n  Email:    ${EMAIL}\n  Password: ${PASSWORD}\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
