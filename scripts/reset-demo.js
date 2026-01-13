const { StreamChat } = require('stream-chat');

// Get credentials from environment variables
const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || 'ybj2ymh82q34';
const apiSecret = process.env.STREAM_API_SECRET || '24y9r689yjzr5htyxynf3eacm9xjxajg5xb9peusyjb6fknkjd2wn4du5vawe3eq';

// Initialize Stream Chat server client
const serverClient = StreamChat.getInstance(apiKey, apiSecret);

// Product listing ID (matches the one in MarketplaceChat.tsx)
const LISTING_ID = 'CM-123456789';
const CHANNEL_ID = `listing-${LISTING_ID}`;

async function resetDemo() {
  console.log('\n🔄 Resetting Craft Market demo environment...\n');

  try {
    // Get the channel
    const channel = serverClient.channel('messaging', CHANNEL_ID);
    
    // Check if channel exists
    const state = await channel.query({});
    
    if (!state) {
      console.log('⚠️  Channel does not exist. Creating it...');
      await channel.create();
      console.log('✅ Channel created');
    } else {
      console.log('✅ Channel found');
    }

    // Get all messages
    const messagesResponse = await channel.query({
      messages: { limit: 100 },
    });

    const messages = messagesResponse.messages || [];
    console.log(`📝 Found ${messages.length} messages to delete`);

    // Delete all messages
    if (messages.length > 0) {
      const messageIds = messages.map((msg) => msg.id);
      
      // Delete messages in batches (Stream API limit)
      const batchSize = 100;
      for (let i = 0; i < messageIds.length; i += batchSize) {
        const batch = messageIds.slice(i, i + batchSize);
        await channel.deleteManyMessages(batch);
        console.log(`   Deleted ${Math.min(i + batchSize, messageIds.length)}/${messageIds.length} messages`);
      }
      console.log('✅ All messages deleted');
    } else {
      console.log('ℹ️  No messages to delete');
    }

    // Remove agent from channel (if present)
    const members = await channel.queryMembers({});
    const agentMember = members.members.find((m) => m.user_id === 'agent-support');
    
    if (agentMember) {
      await channel.removeMembers(['agent-support']);
      console.log('✅ Agent removed from channel');
    } else {
      console.log('ℹ️  Agent not in channel');
    }

    // Send fresh initial message from seller
    const sellerMessage = {
      text: 'Hello! Thanks for your interest. Here are the product details:',
      user_id: 'seller-maria',
      attachments: [
        {
          type: 'product',
          title: 'Handmade Ceramic Vase Set - Baja Blue',
          price: '$89.99',
          originalPrice: '$120.00',
          image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400',
          description: 'Handcrafted ceramic vase set. Each piece is unique. Free shipping included.',
        },
      ],
    };

    await channel.sendMessage(sellerMessage);
    console.log('✅ Fresh initial message sent from seller');

    console.log('\n✨ Demo reset complete!');
    console.log('   Channel is ready for a fresh demo.\n');

    return {
      success: true,
      messagesDeleted: messages.length,
      agentRemoved: !!agentMember,
    };
  } catch (error) {
    console.error('❌ Error resetting demo:', error.message);
    if (error.response) {
      console.error('   Response:', error.response);
    }
    process.exit(1);
  }
}

// Run the reset
resetDemo()
  .then((result) => {
    console.log('📊 Reset summary:');
    console.log(`   Messages deleted: ${result.messagesDeleted}`);
    console.log(`   Agent removed: ${result.agentRemoved ? 'Yes' : 'No'}\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
