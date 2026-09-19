require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
};

async function main() {
    console.log('🔄 Restoring staff and user accounts into database...\n');

    const teamCSV = fs.readFileSync(path.join(__dirname, '../databackup/team_members.csv'), 'utf8');
    const usersCSV = fs.readFileSync(path.join(__dirname, '../databackup/users.csv'), 'utf8');

    const teamLines = teamCSV.split('\n').slice(1).filter(Boolean);
    const userLines = usersCSV.split('\n').slice(1).filter(Boolean);

    // 1. Restore Team Members
    console.log(`Restoring ${teamLines.length} team members...`);
    for (const line of teamLines) {
        const [id, accessId, name, phone, email, position] = parseCSVLine(line);
        await prisma.teamMember.upsert({
            where: { accessId },
            update: {
                name,
                phone,
                email,
                position,
            },
            create: {
                id,
                accessId,
                name,
                phone,
                email,
                position,
            }
        });
        console.log(`  ✓ Team Member: ${accessId} - ${name} (${email})`);
    }

    // 2. Restore Users
    console.log(`\nRestoring user accounts...`);
    for (const line of userLines) {
        const [id, username, email, fullName, phone, passwordHash, role, isActive, teamMemberId] = parseCSVLine(line);
        
        // Find matching team member if teamMemberId wasn't direct
        let finalTeamMemberId = teamMemberId || null;
        if (!finalTeamMemberId && email) {
            const tm = await prisma.teamMember.findFirst({ where: { email } });
            if (tm) finalTeamMemberId = tm.id;
        }

        // Check if user exists by email or username
        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });

        if (existing) {
            await prisma.user.update({
                where: { id: existing.id },
                data: {
                    fullName: fullName || existing.fullName,
                    passwordHash,
                    role: role || existing.role,
                    teamMemberId: finalTeamMemberId || existing.teamMemberId,
                    isActive: true,
                }
            });
            console.log(`  ✓ Updated User: ${email || username} (Role: ${role})`);
        } else {
            await prisma.user.create({
                data: {
                    id,
                    username: username || email,
                    email,
                    fullName,
                    passwordHash,
                    role: role || 'SOFTWARE',
                    teamMemberId: finalTeamMemberId,
                    isActive: true,
                }
            });
            console.log(`  ✓ Created User: ${email || username} (Role: ${role})`);
        }
    }

    // Ensure the 'admin' system account also has a working password hash
    const adminUser = await prisma.user.findFirst({ where: { username: 'admin' } });
    if (adminUser) {
        const adminHash = await bcrypt.hash('admin', 12);
        await prisma.user.update({
            where: { id: adminUser.id },
            data: {
                passwordHash: adminHash,
            }
        });
        console.log(`  ✓ Set password 'admin' for system user 'admin'`);
    }

    console.log('\n✅ Staff and accounts restoration completed successfully!');
}

main()
    .catch((e) => {
        console.error('Restoration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
