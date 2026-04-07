const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedExpenses() {
    try {
        console.log('🌱 Seeding sample expenses...');

        // Get the default organization
        const organization = await prisma.organization.findFirst();
        if (!organization) {
            console.log('❌ No organization found. Please run the main seed script first.');
            return;
        }

        const sampleExpenses = [
            {
                description: 'Office Stationery - Pens, Paper, and Notebooks',
                amount: 2500.00,
                date: new Date('2024-12-01'),
                category: 'Office Supplies',
                paymentMethod: 'Credit Card',
                status: 'Paid'
            },
            {
                description: 'Software License - Adobe Creative Suite',
                amount: 15000.00,
                date: new Date('2024-12-05'),
                category: 'Software',
                paymentMethod: 'Bank Transfer',
                status: 'Paid'
            },
            {
                description: 'Travel to Delhi for Client Meeting',
                amount: 8500.00,
                date: new Date('2024-12-10'),
                category: 'Travel',
                paymentMethod: 'Credit Card',
                status: 'Paid'
            },
            {
                description: 'Drone Maintenance Parts - Propellers and Motors',
                amount: 12000.00,
                date: new Date('2024-12-12'),
                category: 'Maintenance',
                paymentMethod: 'Cheque',
                status: 'Paid'
            },
            {
                description: 'Digital Marketing Campaign - Google Ads',
                amount: 25000.00,
                date: new Date('2024-12-15'),
                category: 'Marketing',
                paymentMethod: 'Bank Transfer',
                status: 'Pending'
            },
            {
                description: 'Employee Training - Drone Pilot Certification',
                amount: 18000.00,
                date: new Date('2024-12-18'),
                category: 'Training',
                paymentMethod: 'Credit Card',
                status: 'Paid'
            },
            {
                description: 'Office Internet and Phone Bills',
                amount: 4200.00,
                date: new Date('2024-12-20'),
                category: 'Utilities',
                paymentMethod: 'Bank Transfer',
                status: 'Paid'
            },
            {
                description: 'Legal Consultation - Contract Review',
                amount: 15000.00,
                date: new Date('2024-12-22'),
                category: 'Legal',
                paymentMethod: 'Cheque',
                status: 'Pending'
            },
            {
                description: 'Equipment Insurance Premium',
                amount: 25000.00,
                date: new Date('2024-12-25'),
                category: 'Insurance',
                paymentMethod: 'Bank Transfer',
                status: 'Paid'
            },
            {
                description: 'Consulting Services - Technical Advisor',
                amount: 35000.00,
                date: new Date('2024-12-28'),
                category: 'Consulting',
                paymentMethod: 'Bank Transfer',
                status: 'Paid'
            }
        ];

        for (const expense of sampleExpenses) {
            await prisma.expense.create({
                data: {
                    ...expense,
                    organizationId: organization.id
                }
            });
            console.log(`✅ Created expense: ${expense.description}`);
        }

        console.log('🎉 Sample expenses seeded successfully!');
        console.log(`📊 Created ${sampleExpenses.length} sample expenses`);

    } catch (error) {
        console.error('❌ Error seeding expenses:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedExpenses();