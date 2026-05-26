import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const ADMIN_EMAIL = "shabeenashfak@gmail.com";
const ADMIN_ALLOCATION = 2000000000;
const USER_POOL = 147483647;

const getAllocatedAmount = (order) => {
    if (order === 0) return 5000000;
    if (order >= 1 && order <= 9) return 1000000;
    if (order >= 10 && order <= 99) return 100000;
    if (order >= 100 && order <= 999) return 10000;
    return 1000;
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { userEmail, action } = body;

        // Use service role for all DB operations so no admin privilege is needed
        const db = base44.asServiceRole;

        // Special action: get next allocation order (used during new user init)
        // This doesn't require authentication since new users call it
        if (action === "getNextOrder") {
            const allUsers = await db.entities.User.list();
            const initializedNonAdmins = allUsers.filter(u =>
                u.email !== ADMIN_EMAIL &&
                typeof u.allocation_order === 'number' &&
                u.allocation_order >= 0
            );
            let nextOrder = 0;
            if (initializedNonAdmins.length > 0) {
                initializedNonAdmins.sort((a, b) => (b.allocation_order || 0) - (a.allocation_order || 0));
                nextOrder = (initializedNonAdmins[0].allocation_order || 0) + 1;
            }
            return Response.json({ nextOrder });
        }

        // For other actions, verify the caller is authenticated
        const callerUser = await base44.auth.me();
        if (!callerUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only allow users to trigger their own allocation, or admins to trigger for others
        if (callerUser.email !== userEmail && !callerUser.is_admin) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const users = await db.entities.User.filter({ email: userEmail });
        if (users.length === 0) {
            return Response.json({ error: `User ${userEmail} not found.` }, { status: 404 });
        }
        const user = users[0];

        // Handle admin allocation
        if (user.email === ADMIN_EMAIL) {
            await db.entities.User.update(user.id, { shard_balance: ADMIN_ALLOCATION });
            return Response.json({ success: true, message: `Admin balance set to ${ADMIN_ALLOCATION.toLocaleString()} SHD.` });
        }

        // Skip if already allocated
        if (user.shard_balance > 0) {
            return Response.json({ success: false, message: 'User has already been allocated SHD.' });
        }

        const allocationAmount = getAllocatedAmount(user.allocation_order);

        // Check pool capacity
        const allUsers = await db.entities.User.list();
        const nonAdminUsers = allUsers.filter(u => u.email !== ADMIN_EMAIL);
        const totalAllocated = nonAdminUsers.reduce((sum, u) => sum + (u.shard_balance || 0), 0);

        if (totalAllocated + allocationAmount > USER_POOL) {
            return Response.json({ success: false, message: 'Allocation pool exhausted.' });
        }

        await db.entities.User.update(user.id, { shard_balance: allocationAmount });

        await db.entities.ShardTransaction.create({
            from_user: "System",
            to_user: user.email,
            from_user_wallet: "allocation_pool",
            to_user_wallet: "in-app",
            amount: allocationAmount,
            transaction_type: 'allocation',
            status: 'completed',
        });

        return Response.json({
            success: true,
            message: `Allocated ${allocationAmount.toLocaleString()} SHD to ${user.email}.`
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});