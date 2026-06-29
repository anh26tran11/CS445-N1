// Route Permissions Configuration
// Maps each route to the roles that can access it

export const routePermissions = {
    // Products - ADMIN only
    '/dashboard/category': ['ADMIN'],
    '/dashboard/sub-category': ['ADMIN'],
    '/dashboard/product': ['ADMIN'],

    // Restaurant Management
    '/dashboard/table': ['ADMIN', 'MANAGER'],
    '/dashboard/table-orders': ['ADMIN', 'MANAGER', 'WAITER'],
    '/dashboard/booking': ['ADMIN', 'MANAGER', 'WAITER'],
    '/dashboard/bill': ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER'],
    '/dashboard/report': ['ADMIN', 'MANAGER'],

    // HR Management
    '/dashboard/employee-management': ['ADMIN', 'MANAGER'],
    '/dashboard/shift-management': ['ADMIN', 'MANAGER'],
    '/dashboard/attendance-management': ['ADMIN', 'MANAGER'],

    // Reports & Vouchers
    '/dashboard/voucher': ['ADMIN'],

    // Employee Features
    '/dashboard/employee-dashboard': ['MANAGER', 'WAITER', 'CHEF', 'CASHIER'],
    '/dashboard/my-shifts': ['MANAGER', 'WAITER', 'CHEF', 'CASHIER'],
    '/dashboard/my-performance': ['MANAGER', 'WAITER', 'CHEF', 'CASHIER'],

    // Personal - USER only
    '/dashboard/address': ['USER'],
    '/dashboard/my-orders': ['USER'],

    // Profile (all users)
    '/dashboard/profile': ['ADMIN', 'MANAGER', 'WAITER', 'CHEF', 'CASHIER', 'USER'],

    // Dashboard home (all users)
    '/dashboard': ['ADMIN', 'MANAGER', 'WAITER', 'CHEF', 'CASHIER', 'USER'],
};

// Helper function to check if user has permission for a route
export const hasRoutePermission = (userRole, pathname) => {
    // Check exact match first
    if (routePermissions[pathname]) {
        return routePermissions[pathname].includes(userRole);
    }

    // Check if pathname starts with any configured route (for nested routes)
    for (const [route, roles] of Object.entries(routePermissions)) {
        if (pathname.startsWith(route) && route !== '/dashboard') {
            return roles.includes(userRole);
        }
    }

    // Default: allow if ADMIN, otherwise deny
    return userRole === 'ADMIN';
};
