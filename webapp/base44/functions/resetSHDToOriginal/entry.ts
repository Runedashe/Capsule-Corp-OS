import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // SHD allocation based on registration order
    const allocationMap = {
      1: 5_000_000,
      2: 1_000_000,
      3: 1_000_000,
      4: 1_000_000,
      5: 1_000_000,
      6: 1_000_000,
      7: 1_000_000,
      8: 1_000_000,
      9: 1_000_000,
      10: 1_000_000
    };

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    let resetCount = 0;
    const errors = [];

    for (const userRecord of allUsers) {
      try {
        const allocationOrder = userRecord.allocation_order || 0;
        let originalAmount = 1000; // Default for users 1000+

        if (allocationOrder >= 1 && allocationOrder <= 10) {
          originalAmount = allocationMap[allocationOrder] || 1_000_000;
        } else if (allocationOrder >= 11 && allocationOrder <= 100) {
          originalAmount = 100_000;
        } else if (allocationOrder >= 101 && allocationOrder <= 1000) {
          originalAmount = 10_000;
        }

        // Update user with original SHD amount and mark as reset
        await base44.asServiceRole.entities.User.update(userRecord.id, {
          shard_balance: originalAmount,
          manual_reset_applied: true
        });

        resetCount++;
      } catch (error) {
        errors.push(`Failed to reset ${userRecord.email}: ${error.message}`);
      }
    }

    return Response.json({
      success: true,
      message: `Reset ${resetCount} users to original SHD amounts`,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});