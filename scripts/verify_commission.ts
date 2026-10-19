
import { PrismaClient } from '@prisma/client';
import { DashboardService } from './src/services/dashboard.service';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting verification...');

    // 1. Create/Find a test user
    const userEmail = `test_salesman_${Date.now()}@example.com`;
    const user = await prisma.user.create({
        data: {
            email: userEmail,
            fullName: 'Test Salesman',
            username: `salesman_${Date.now()}`,
            password: 'hashed_password', // Mock
            roleId: (await prisma.role.findFirst({ where: { name: 'Salesman' } }))?.id || '',
            commissionRate: 0.10, // 10%
        },
    });

    console.log(`Created test user: ${user.id}`);

    // 2. Create a dummy session (needed for dashboard to return non-zero)
    const session = await prisma.dailySession.create({
        data: {
            openedAt: new Date(),
            status: 'OPEN',
            openedBy: user.id,
            openingCashBalance: 1000,
        },
    });

    console.log(`Created test session: ${session.id}`);

    // 3. Create a dummy sale
    const sale = await prisma.sale.create({
        data: {
            receiptNumber: `REC-${Date.now()}`,
            totalAmount: 100,
            subTotal: 100,
            totalCost: 50,
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            salesmanId: user.id,
            sessionId: session.id,
            locationId: (await prisma.location.findFirst())?.id || '',
            cashierId: user.id,
        }
    });

    console.log(`Created test sale: ${sale.id}`);

    // 4. Create a dummy commission record
    // Profit = 100 - 50 = 50. Commission = 50 * 0.10 = 5.
    await prisma.commission.create({
        data: {
            userId: user.id,
            saleId: sale.id,
            amount: 5.00,
            rate: 0.10,
            profitSnapshot: 50.00,
            createdAt: new Date(),
        }
    });

    console.log('Created commission record');

    // 5. Test DashboardService
    try {
        const dashboard = await DashboardService.getSalesmanDashboard(user.id);
        console.log('Dashboard Result:', JSON.stringify(dashboard, null, 2));

        const commissionToday = dashboard.commissionEarned.today;
        const commissionMonth = dashboard.commissionEarned.month;

        console.log(`Commission Today: ${commissionToday}`);
        console.log(`Commission Month: ${commissionMonth}`);

        if (Number(commissionToday) === 5 && Number(commissionMonth) === 5) {
            console.log('SUCCESS: Dashboard returned correct commission values.');
        } else {
            console.error(`FAILURE: Dashboard returned incorrect values. Expected 5, got Today: ${commissionToday}, Month: ${commissionMonth}`);
        }

    } catch (error) {
        console.error('Error fetching dashboard:', error);
    } finally {
        // Cleanup
        try {
            await prisma.commission.deleteMany({ where: { userId: user.id } });
            await prisma.sale.delete({ where: { id: sale.id } });
            await prisma.dailySession.delete({ where: { id: session.id } });
            await prisma.user.delete({ where: { id: user.id } });
        } catch (e) {
            console.error('Error during cleanup:', e);
        }
        await prisma.$disconnect();
    }
}

main();
