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

// User IDs to remove
const USER_IDS = ['buyer-carlos', 'seller-maria', 'agent-support'];

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
// DELETE STREAM CHAT CHANNEL
// =============================================================================
async function deleteChannel() {
  try {
    console.log('🗑️  Deleting Stream Chat channel...');

    const channel = serverClient.channel('messaging', CHANNEL_ID);
    
    // Try to delete the channel
    try {
      await channel.delete();
      console.log('✅ Channel deleted');
      return { deleted: true };
    } catch (error) {
      if (error.message?.includes('not found') || error.code === 4) {
        console.log('   ℹ️  Channel does not exist (already deleted)');
        return { deleted: false };
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Error deleting channel:', error.message);
    return { deleted: false, error: error.message };
  }
}

// =============================================================================
// DELETE STREAM CHAT USERS
// =============================================================================
async function deleteUsers() {
  try {
    console.log('🗑️  Deleting Stream Chat users...');

    let deletedCount = 0;
    for (const userId of USER_IDS) {
      try {
        await serverClient.deleteUser(userId);
        console.log(`   ✅ Deleted user: ${userId}`);
        deletedCount++;
      } catch (error) {
        if (error.message?.includes('not found')) {
          console.log(`   ℹ️  User ${userId} does not exist (already deleted)`);
        } else {
          console.log(`   ⚠️  Failed to delete user ${userId}: ${error.message}`);
        }
      }
    }

    console.log(`✅ Deleted ${deletedCount} user(s)`);
    return { deleted: deletedCount };
  } catch (error) {
    console.error('❌ Error deleting users:', error.message);
    return { deleted: 0, error: error.message };
  }
}

// =============================================================================
// MAIN CLEANUP FUNCTION
// =============================================================================
async function fullCleanup() {
  console.log('\n🧹 Starting FULL CLEANUP...\n');
  console.log('⚠️  This will:');
  console.log('   - Delete Stream Chat channel');
  console.log('   - Delete Stream Chat users (buyer, seller, agent)');
  console.log('   - Delete all Zendesk tickets with "craftmarket" tag\n');

  const results = {
    zendesk: { deleted: 0 },
    channel: { deleted: false },
    users: { deleted: 0 },
  };

  try {
    // 1. Delete Zendesk tickets
    results.zendesk = await deleteZendeskTickets();
    console.log('');

    // 2. Delete channel
    results.channel = await deleteChannel();
    console.log('');

    // 3. Delete users
    results.users = await deleteUsers();
    console.log('');

    console.log('✨ Full cleanup complete!\n');
    console.log('📊 Summary:');
    console.log(`   Zendesk tickets deleted: ${results.zendesk.deleted}`);
    console.log(`   Channel deleted: ${results.channel.deleted ? 'Yes' : 'No'}`);
    console.log(`   Users deleted: ${results.users.deleted}`);
    console.log('\n💡 Run "npm run setup-users" to recreate users and start fresh.\n');

    return results;
  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
fullCleanup()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
