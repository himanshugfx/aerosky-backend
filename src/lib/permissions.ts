// Permission constants and role mappings for RBAC
// This file defines all available permissions and their role assignments

import { Role } from '@prisma/client';

// ============================================
// PERMISSION DEFINITIONS
// ============================================

export const PERMISSIONS = {
    // Drones
    DRONE_VIEW: 'drone:view',
    DRONE_CREATE: 'drone:create',
    DRONE_EDIT: 'drone:edit',
    DRONE_DELETE: 'drone:delete',

    // Orders
    ORDER_VIEW: 'order:view',
    ORDER_CREATE: 'order:create',
    ORDER_EDIT: 'order:edit',
    ORDER_DELETE: 'order:delete',

    // Team
    TEAM_VIEW: 'team:view',
    TEAM_CREATE: 'team:create',
    TEAM_EDIT: 'team:edit',
    TEAM_DELETE: 'team:delete',

    // Subcontractors
    SUBCONTRACTOR_VIEW: 'subcontractor:view',
    SUBCONTRACTOR_CREATE: 'subcontractor:create',
    SUBCONTRACTOR_EDIT: 'subcontractor:edit',
    SUBCONTRACTOR_DELETE: 'subcontractor:delete',

    // Batteries
    BATTERY_VIEW: 'battery:view',
    BATTERY_CREATE: 'battery:create',
    BATTERY_EDIT: 'battery:edit',
    BATTERY_DELETE: 'battery:delete',

    // Inventory
    INVENTORY_VIEW: 'inventory:view',
    INVENTORY_IN: 'inventory:in',
    INVENTORY_OUT: 'inventory:out',
    INVENTORY_MANAGE: 'inventory:manage', // for adding component types

    // Compliance
    COMPLIANCE_VIEW: 'compliance:view',
    COMPLIANCE_UPLOAD: 'compliance:upload',
    COMPLIANCE_APPROVE: 'compliance:approve',

    // Reports
    REPORT_VIEW: 'report:view',
    REPORT_EXPORT: 'report:export',

    // Settings
    SETTINGS_VIEW: 'settings:view',
    SETTINGS_EDIT: 'settings:edit',
    SETTINGS_ADMIN: 'settings:admin',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ============================================
// ROLE-PERMISSION MAPPINGS
// ============================================

const ALL_VIEW_PERMISSIONS: Permission[] = [
    PERMISSIONS.DRONE_VIEW,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.SUBCONTRACTOR_VIEW,
    PERMISSIONS.BATTERY_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.COMPLIANCE_VIEW,
    PERMISSIONS.REPORT_VIEW,
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    SUPER_ADMIN: Object.values(PERMISSIONS),

    ADMIN: [
        // Full CRUD on all resources except admin settings
        ...Object.values(PERMISSIONS).filter((p) => p !== PERMISSIONS.SETTINGS_ADMIN),
    ],

    OPERATIONS_MANAGER: [
        // Drones - full CRUD
        PERMISSIONS.DRONE_VIEW,
        PERMISSIONS.DRONE_CREATE,
        PERMISSIONS.DRONE_EDIT,
        // Orders - full CRUD
        PERMISSIONS.ORDER_VIEW,
        PERMISSIONS.ORDER_CREATE,
        PERMISSIONS.ORDER_EDIT,
        // Team - full CRUD
        PERMISSIONS.TEAM_VIEW,
        PERMISSIONS.TEAM_CREATE,
        PERMISSIONS.TEAM_EDIT,
        // Subcontractors - full CRUD
        PERMISSIONS.SUBCONTRACTOR_VIEW,
        PERMISSIONS.SUBCONTRACTOR_CREATE,
        PERMISSIONS.SUBCONTRACTOR_EDIT,
        // Batteries - full CRUD
        PERMISSIONS.BATTERY_VIEW,
        PERMISSIONS.BATTERY_CREATE,
        PERMISSIONS.BATTERY_EDIT,
        // Inventory - full access
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.INVENTORY_IN,
        PERMISSIONS.INVENTORY_OUT,
        PERMISSIONS.INVENTORY_MANAGE,
        // Compliance
        PERMISSIONS.COMPLIANCE_VIEW,
        PERMISSIONS.COMPLIANCE_UPLOAD,
        // Reports
        PERMISSIONS.REPORT_VIEW,
        PERMISSIONS.REPORT_EXPORT,
        // Settings - view only
        PERMISSIONS.SETTINGS_VIEW,
    ],

    QA_MANAGER: [
        // View permissions
        PERMISSIONS.DRONE_VIEW,
        PERMISSIONS.DRONE_EDIT, // Can edit compliance fields
        PERMISSIONS.ORDER_VIEW,
        PERMISSIONS.TEAM_VIEW,
        PERMISSIONS.SUBCONTRACTOR_VIEW,
        PERMISSIONS.BATTERY_VIEW,
        // Compliance - full access
        PERMISSIONS.COMPLIANCE_VIEW,
        PERMISSIONS.COMPLIANCE_UPLOAD,
        PERMISSIONS.COMPLIANCE_APPROVE, // Key permission
        // Reports
        PERMISSIONS.REPORT_VIEW,
        PERMISSIONS.REPORT_EXPORT,
    ],

    PILOT: [
        // View permissions for relevant resources
        PERMISSIONS.DRONE_VIEW,
        PERMISSIONS.TEAM_VIEW,
        PERMISSIONS.BATTERY_VIEW,
        // Compliance
        PERMISSIONS.COMPLIANCE_VIEW,
        PERMISSIONS.COMPLIANCE_UPLOAD, // Can upload flight logs
    ],

    TECHNICIAN: [
        // Drones - view
        PERMISSIONS.DRONE_VIEW,
        // Batteries - can manage
        PERMISSIONS.BATTERY_VIEW,
        PERMISSIONS.BATTERY_CREATE,
        PERMISSIONS.BATTERY_EDIT,
        // Team - view
        PERMISSIONS.TEAM_VIEW,
        // Compliance
        PERMISSIONS.COMPLIANCE_VIEW,
        PERMISSIONS.COMPLIANCE_UPLOAD,
    ],

    VIEWER: [
        // Read-only access to most resources
        PERMISSIONS.DRONE_VIEW,
        PERMISSIONS.ORDER_VIEW,
        PERMISSIONS.TEAM_VIEW,
        PERMISSIONS.SUBCONTRACTOR_VIEW,
        PERMISSIONS.BATTERY_VIEW,
        PERMISSIONS.COMPLIANCE_VIEW,
        PERMISSIONS.REPORT_VIEW,
    ],
};

// ============================================
// PERMISSION METADATA
// ============================================

export const PERMISSION_METADATA: Record<
    Permission,
    { description: string; category: string }
> = {
    [PERMISSIONS.DRONE_VIEW]: { description: 'View drones', category: 'drones' },
    [PERMISSIONS.DRONE_CREATE]: { description: 'Create drones', category: 'drones' },
    [PERMISSIONS.DRONE_EDIT]: { description: 'Edit drones', category: 'drones' },
    [PERMISSIONS.DRONE_DELETE]: { description: 'Delete drones', category: 'drones' },

    [PERMISSIONS.ORDER_VIEW]: { description: 'View orders', category: 'orders' },
    [PERMISSIONS.ORDER_CREATE]: { description: 'Create orders', category: 'orders' },
    [PERMISSIONS.ORDER_EDIT]: { description: 'Edit orders', category: 'orders' },
    [PERMISSIONS.ORDER_DELETE]: { description: 'Delete orders', category: 'orders' },

    [PERMISSIONS.TEAM_VIEW]: { description: 'View team members', category: 'team' },
    [PERMISSIONS.TEAM_CREATE]: { description: 'Create team members', category: 'team' },
    [PERMISSIONS.TEAM_EDIT]: { description: 'Edit team members', category: 'team' },
    [PERMISSIONS.TEAM_DELETE]: { description: 'Delete team members', category: 'team' },

    [PERMISSIONS.SUBCONTRACTOR_VIEW]: { description: 'View subcontractors', category: 'subcontractors' },
    [PERMISSIONS.SUBCONTRACTOR_CREATE]: { description: 'Create subcontractors', category: 'subcontractors' },
    [PERMISSIONS.SUBCONTRACTOR_EDIT]: { description: 'Edit subcontractors', category: 'subcontractors' },
    [PERMISSIONS.SUBCONTRACTOR_DELETE]: { description: 'Delete subcontractors', category: 'subcontractors' },

    [PERMISSIONS.BATTERY_VIEW]: { description: 'View batteries', category: 'batteries' },
    [PERMISSIONS.BATTERY_CREATE]: { description: 'Create batteries', category: 'batteries' },
    [PERMISSIONS.BATTERY_EDIT]: { description: 'Edit batteries', category: 'batteries' },
    [PERMISSIONS.BATTERY_DELETE]: { description: 'Delete batteries', category: 'batteries' },

    [PERMISSIONS.INVENTORY_VIEW]: { description: 'View inventory', category: 'inventory' },
    [PERMISSIONS.INVENTORY_IN]: { description: 'Record inventory arrival', category: 'inventory' },
    [PERMISSIONS.INVENTORY_OUT]: { description: 'Record inventory usage', category: 'inventory' },
    [PERMISSIONS.INVENTORY_MANAGE]: { description: 'Manage inventory items', category: 'inventory' },

    [PERMISSIONS.COMPLIANCE_VIEW]: { description: 'View compliance documents', category: 'compliance' },
    [PERMISSIONS.COMPLIANCE_UPLOAD]: { description: 'Upload compliance documents', category: 'compliance' },
    [PERMISSIONS.COMPLIANCE_APPROVE]: { description: 'Approve compliance items', category: 'compliance' },

    [PERMISSIONS.REPORT_VIEW]: { description: 'View reports', category: 'reports' },
    [PERMISSIONS.REPORT_EXPORT]: { description: 'Export reports', category: 'reports' },

    [PERMISSIONS.SETTINGS_VIEW]: { description: 'View settings', category: 'settings' },
    [PERMISSIONS.SETTINGS_EDIT]: { description: 'Edit settings', category: 'settings' },
    [PERMISSIONS.SETTINGS_ADMIN]: { description: 'Admin settings', category: 'settings' },
};
