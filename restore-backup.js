const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const csv = require('csv-parse/sync');

const prisma = new PrismaClient();

// Helper function to parse CSV file
function parseCSV(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = csv.parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
    });
    return records;
}

// Convert string boolean to boolean
function toBoolean(value) {
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }
    return !!value;
}

// Main restore function
async function restoreBackup() {
    try {
        console.log('🔄 Starting database restore from backup...\n');

        // Get default organization or create one
        let defaultOrg = await prisma.organization.findFirst();
        if (!defaultOrg) {
            defaultOrg = await prisma.organization.create({
                data: {
                    name: 'Default Organization',
                    email: 'default@aerosysaviation.in',
                    phone: '+91-8000',
                    address: 'India',
                },
            });
            console.log('✓ Created default organization:', defaultOrg.id);
        } else {
            console.log('✓ Using existing organization:', defaultOrg.id);
        }

        // 1. Restore Users
        console.log('\n📥 Restoring Users...');
        const usersData = parseCSV(path.join(__dirname, 'databackup/users.csv'));
        for (const user of usersData) {
            try {
                await prisma.user.create({
                    data: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        fullName: user.full_name,
                        phone: user.phone || null,
                        passwordHash: user.password_hash,
                        role: user.role,
                        isActive: toBoolean(user.is_active),
                        teamMemberId: user.team_member_id || null,
                        organizationId: defaultOrg.id,
                        createdAt: new Date(user.created_at),
                        updatedAt: new Date(user.updated_at),
                    },
                });
                console.log(`  ✓ User: ${user.username} (${user.role})`);
            } catch (error) {
                if (error.code === 'P2002') {
                    console.log(`  ℹ User already exists: ${user.username}`);
                } else {
                    console.error(`  ✗ Error creating user ${user.username}:`, error.message);
                }
            }
        }

        // 2. Restore Team Members
        console.log('\n📥 Restoring Team Members...');
        const teamData = parseCSV(path.join(__dirname, 'databackup/team_members.csv'));
        for (const member of teamData) {
            try {
                await prisma.teamMember.create({
                    data: {
                        id: member.id,
                        accessId: member.access_id,
                        name: member.name,
                        phone: member.phone || null,
                        email: member.email || null,
                        position: member.position || null,
                        organizationId: defaultOrg.id,
                        createdAt: new Date(member.created_at),
                    },
                });
                console.log(`  ✓ Team Member: ${member.name} (${member.access_id})`);
            } catch (error) {
                if (error.code === 'P2002') {
                    console.log(`  ℹ Team member already exists: ${member.name}`);
                } else {
                    console.error(`  ✗ Error creating team member ${member.name}:`, error.message);
                }
            }
        }

        // 3. Restore Leads
        console.log('\n📥 Restoring Leads...');
        const leadsData = parseCSV(path.join(__dirname, 'databackup/leads.csv'));
        
        // First get or create funnel stages
        let stages = await prisma.funnelStage.findMany();
        if (stages.length === 0) {
            stages = await prisma.funnelStage.createMany({
                data: [
                    { name: 'NEW', order: 1, color: '#e0e0e0' },
                    { name: 'CONTACTED', order: 2, color: '#fff3cd' },
                    { name: 'QUALIFIED', order: 3, color: '#cfe2ff' },
                    { name: 'PROPOSAL', order: 4, color: '#cff4fc' },
                    { name: 'WON', order: 5, color: '#d1e7dd' },
                    { name: 'LOST', order: 6, color: '#f8d7da' },
                ],
            });
            console.log('  ✓ Created funnel stages');
            stages = await prisma.funnelStage.findMany();
        }

        for (const lead of leadsData) {
            try {
                // Verify stage exists
                const stage = await prisma.funnelStage.findUnique({
                    where: { id: lead.stage_id }
                });
                
                if (!stage) {
                    console.log(`  ⚠ Skipping lead ${lead.name} - stage ${lead.stage_id} not found`);
                    continue;
                }

                await prisma.lead.create({
                    data: {
                        id: lead.id,
                        name: lead.name,
                        email: lead.email || null,
                        phone: lead.phone || null,
                        company: lead.company || null,
                        source: lead.source || null,
                        stageId: lead.stage_id,
                        value: parseInt(lead.value) || 0,
                        notes: lead.notes || null,
                        convertedAt: lead.converted_at ? new Date(lead.converted_at) : null,
                        createdAt: new Date(lead.created_at),
                        updatedAt: new Date(lead.updated_at),
                    },
                });
                console.log(`  ✓ Lead: ${lead.name} (${lead.company})`);
            } catch (error) {
                if (error.code === 'P2002') {
                    console.log(`  ℹ Lead already exists: ${lead.name}`);
                } else {
                    console.error(`  ✗ Error creating lead ${lead.name}:`, error.message);
                }
            }
        }

        // 4. Restore Drones
        console.log('\n📥 Restoring Drones...');
        const dronesData = parseCSV(path.join(__dirname, 'databackup/drones.csv'));
        for (const drone of dronesData) {
            try {
                await prisma.drone.create({
                    data: {
                        id: drone.id,
                        modelName: drone.model_name,
                        isDgcaCertified: toBoolean(drone.is_dgca_certified),
                        organizationId: defaultOrg.id,
                        createdAt: new Date(drone.created_at),
                    },
                });
                console.log(`  ✓ Drone: ${drone.model_name}`);
            } catch (error) {
                if (error.code === 'P2002') {
                    console.log(`  ℹ Drone already exists: ${drone.model_name}`);
                } else {
                    console.error(`  ✗ Error creating drone ${drone.model_name}:`, error.message);
                }
            }
        }

        // 5. Restore Components
        console.log('\n📥 Restoring Components...');
        const componentFiles = fs.readdirSync(path.join(__dirname, 'databackup')).filter(f => f.startsWith('components'));
        const componentFile = componentFiles[0] || 'components (1).csv';
        const componentsData = parseCSV(path.join(__dirname, 'databackup', componentFile));
        for (const component of componentsData) {
            try {
                await prisma.component.create({
                    data: {
                        id: component.id,
                        name: component.name,
                        description: component.description || null,
                        quantity: parseInt(component.quantity) || 0,
                        category: component.category || 'Operational',
                        organizationId: defaultOrg.id,
                        createdAt: new Date(component.created_at),
                        updatedAt: new Date(component.updated_at),
                    },
                });
                console.log(`  ✓ Component: ${component.name} (Qty: ${component.quantity})`);
            } catch (error) {
                if (error.code === 'P2002') {
                    console.log(`  ℹ Component already exists: ${component.name}`);
                } else {
                    console.error(`  ✗ Error creating component ${component.name}:`, error.message);
                }
            }
        }

        // 6. Restore Lead Activities
        console.log('\n📥 Restoring Lead Activities...');
        const activitiesData = parseCSV(path.join(__dirname, 'databackup/lead_activities.csv'));
        for (const activity of activitiesData) {
            try {
                // Verify lead exists
                const lead = await prisma.lead.findUnique({
                    where: { id: activity.lead_id }
                });
                
                if (!lead) {
                    console.log(`  ⚠ Skipping activity - lead ${activity.lead_id} not found`);
                    continue;
                }

                await prisma.leadActivity.create({
                    data: {
                        id: activity.id,
                        leadId: activity.lead_id,
                        type: activity.type,
                        content: activity.content || '',
                        createdAt: new Date(activity.created_at),
                    },
                });
                console.log(`  ✓ Activity: ${activity.type} for Lead ${activity.lead_id}`);
            } catch (error) {
                if (error.code === 'P2002') {
                    console.log(`  ℹ Activity already exists`);
                } else {
                    console.error(`  ✗ Error creating activity:`, error.message);
                }
            }
        }

        console.log('\n✅ Backup restoration completed successfully!');
        console.log(`\n📊 Summary:`);
        console.log(`  • Users: ${usersData.length}`);
        console.log(`  • Team Members: ${teamData.length}`);
        console.log(`  • Leads: ${leadsData.length}`);
        console.log(`  • Drones: ${dronesData.length}`);
        console.log(`  • Components: ${componentsData.length}`);
        console.log(`  • Lead Activities: ${activitiesData.length}`);

    } catch (error) {
        console.error('\n❌ Error during restore:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the restore
restoreBackup();
