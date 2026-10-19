import { prisma } from '../src/lib/prisma';

async function main() {
    const sessions = await prisma.dailySession.findMany({
        orderBy: { openedAt: 'desc' },
        take: 5
    });
    console.log("RECENT SESSIONS:", JSON.stringify(sessions, null, 2));

    const items = await prisma.item.findMany({
        where: { name: { contains: 'cvv', mode: 'insensitive' } },
        include: { stocks: true }
    });
    console.log("ITEM CVV:", JSON.stringify(items, null, 2));

    // Locations
    const locations = await prisma.location.findMany();
    console.log("LOCATIONS:", JSON.stringify(locations, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
