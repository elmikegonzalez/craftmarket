require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' }); // Fallback to .env if .env.local doesn't exist

const { StreamChat } = require('stream-chat');

// Get credentials from environment variables
const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || 'ybj2ymh82q34';
const apiSecret = process.env.STREAM_API_SECRET || '24y9r689yjzr5htyxynf3eacm9xjxajg5xb9peusyjb6fknkjd2wn4du5vawe3eq';

// Zendesk configuration
const ZENDESK_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN || 'bajacraft';
const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL || '';
const ZENDESK_API_TOKEN = process.env.ZENDESK_API_TOKEN || '';

// Initialize Stream Chat server client
const serverClient = StreamChat.getInstance(apiKey, apiSecret);

// Product listing ID
const LISTING_ID = 'CM-123456789';
const CHANNEL_ID = `listing-${LISTING_ID}`;

// =============================================================================
// DELETE ZENDESK TICKETS
// =============================================================================
async function deleteZendeskTickets() {
  if (!ZENDESK_SUBDOMAIN || !ZENDESK_EMAIL || !ZENDESK_API_TOKEN) {
    console.log('⚠️  Zendesk credentials not configured. Skipping ticket deletion.');
    return { deleted: 0 };
  }

  try {
    console.log('🗑️  Deleting Zendesk tickets...');

    // Search for tickets with craftmarket tag
    const searchResponse = await fetch(
      `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/search.json?query=tags:craftmarket`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${ZENDESK_EMAIL}/token:${ZENDESK_API_TOKEN}`).toString('base64')}`,
        },
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`Zendesk API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const tickets = searchData.results || [];

    if (tickets.length === 0) {
      console.log('   ℹ️  No tickets found to delete');
      return { deleted: 0 };
    }

    console.log(`   Found ${tickets.length} ticket(s) to delete`);

    // Delete tickets
    let deletedCount = 0;
    for (const ticket of tickets) {
      const deleteResponse = await fetch(
        `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/tickets/${ticket.id}.json`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Basic ${Buffer.from(`${ZENDESK_EMAIL}/token:${ZENDESK_API_TOKEN}`).toString('base64')}`,
          },
        }
      );

      if (deleteResponse.ok) {
        deletedCount++;
        console.log(`   ✅ Deleted ticket #${ticket.id}`);
      } else {
        console.log(`   ⚠️  Failed to delete ticket #${ticket.id}`);
      }
    }

    console.log(`✅ Deleted ${deletedCount} Zendesk ticket(s)`);
    return { deleted: deletedCount };
  } catch (error) {
    console.error('❌ Error deleting Zendesk tickets:', error.message);
    return { deleted: 0, error: error.message };
  }
}

// =============================================================================
// CLEAN CHANNEL (DELETE AND RECREATE FOR CLEAN STATE)
// =============================================================================
async function cleanChannel() {
  try {
    console.log('🧹 Cleaning Stream Chat channel...');

    const channel = serverClient.channel('messaging', CHANNEL_ID);
    
    // Delete the channel entirely (this removes all messages cleanly)
    try {
      await channel.query({});
      console.log('   ✅ Channel found, deleting...');
      await channel.delete();
      console.log('   ✅ Channel deleted');
      // Wait a moment for deletion to complete
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      if (error.message?.includes('not found') || error.code === 4) {
        console.log('   ℹ️  Channel does not exist or already deleted');
      } else {
        console.log(`   ⚠️  Error checking channel: ${error.message}`);
        // Continue anyway - try to create fresh channel
      }
    }

    // Recreate the channel fresh
    console.log('   Creating fresh channel...');
    const freshChannel = serverClient.channel('messaging', CHANNEL_ID, {
      name: 'Handmade Ceramic Vase Set - Baja Blue',
      image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400',
      members: ['buyer-carlos', 'seller-maria'],
      created_by_id: 'seller-maria', // Required for server-side channel creation
      listing_id: LISTING_ID,
      listing_price: '$89.99',
    });

    try {
      await freshChannel.create();
      console.log('   ✅ Fresh channel created');

      // Watch the channel to ensure it's ready
      await freshChannel.watch();
      console.log('   ✅ Channel watched and ready');
    } catch (error) {
      // Channel might already exist, try to watch it
      if (error.message?.includes('already exists') || error.code === 4) {
        console.log('   ℹ️  Channel already exists, watching...');
        await freshChannel.watch();
        console.log('   ✅ Channel watched and ready');
      } else {
        throw error;
      }
    }

    // Channel is empty - no initial message
    // Maria will respond after Carlos asks something
    console.log('   ✅ Channel is empty and ready');

    return {
      channelRecreated: true,
      agentRemoved: true, // Agent is removed since channel was recreated
    };
  } catch (error) {
    console.error('❌ Error cleaning channel:', error.message);
    return { error: error.message };
  }
}

// =============================================================================
// MAIN CLEAN FUNCTION
// =============================================================================
async function cleanDemo() {
  console.log('\n🧹 Cleaning demo environment...\n');
  console.log('⚠️  This will:');
  console.log('   - Delete all messages from the channel');
  console.log('   - Remove agent from channel');
  console.log('   - Delete all Zendesk tickets with "craftmarket" tag');
  console.log('   - Create empty channel (no initial message)');
  console.log('   - Keep users and channel structure intact\n');

  const results = {
    zendesk: { deleted: 0 },
    channel: { messagesDeleted: 0, agentRemoved: false },
  };

  try {
    // 1. Delete Zendesk tickets
    results.zendesk = await deleteZendeskTickets();
    console.log('');

    // 2. Clean channel
    results.channel = await cleanChannel();
    console.log('');

    console.log('✨ Demo cleaned and ready!\n');
    console.log('📊 Summary:');
    console.log(`   Zendesk tickets deleted: ${results.zendesk.deleted}`);
    console.log(`   Channel recreated: ${results.channel.channelRecreated ? 'Yes' : 'No'}`);
    console.log(`   Agent removed: ${results.channel.agentRemoved ? 'Yes' : 'No'}`);
    console.log('\n💡 Channel is ready for a fresh demo (no "message deleted" indicators).\n');

    return results;
  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanDemo()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
