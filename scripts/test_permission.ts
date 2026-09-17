import { Role } from '@prisma/client';
import { hasPermission } from './src/lib/rbac';
import { PERMISSIONS } from './src/lib/permissions';

console.log('Testing hasPermission for SOFTWARE:', hasPermission('SOFTWARE' as Role, PERMISSIONS.DRONE_VIEW));
