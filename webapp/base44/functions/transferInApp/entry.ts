import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        const sender = await base44.auth.me();
        if (!sender) {
            return new Response(JSON.stringify({ error: 'Sender not found' }), { status: 401 });
        }

        const { recipientEmail, amount, note } = await req.json();

        if (!recipientEmail || !amount) {
            return new Response(JSON.stringify({ error: 'Recipient and amount are required' }), { status: 400 });
        }
        
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
             return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400 });
        }

        if (sender.shard_balance < numericAmount) {
            return new Response(JSON.stringify({ error: 'Insufficient balance' }), { status: 400 });
        }

        const recipients = await base44.entities.User.filter({ email: recipientEmail });
        if (recipients.length === 0) {
            return new Response(JSON.stringify({ error: 'Recipient not found' }), { status: 404 });
        }
        const recipient = recipients[0];

        // Perform the transfer
        const senderNewBalance = (sender.shard_balance || 0) - numericAmount;
        const recipientNewBalance = (recipient.shard_balance || 0) + numericAmount;

        await base44.entities.User.update(sender.id, { shard_balance: senderNewBalance });
        await base44.entities.User.update(recipient.id, { shard_balance: recipientNewBalance });

        // Log the transaction
        await base44.entities.ShardTransaction.create({
            from_user: sender.email,
            to_user: recipient.email,
            from_user_wallet: "in-app",
            to_user_wallet: "in-app",
            amount: numericAmount,
            transaction_type: note ? 'marketplace_purchase' : 'transfer',
            status: 'completed',
            marketplace_item_id: note
        });

        return new Response(JSON.stringify({
            success: true,
            message: `Successfully transferred ${numericAmount} SHD to ${recipientEmail}`
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ 
            error: `Transfer failed: ${error.message}`
        }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});