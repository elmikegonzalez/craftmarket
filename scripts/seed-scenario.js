require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' }); // Fallback to .env if .env.local doesn't exist

const { StreamChat } = require('stream-chat');

// Get credentials from environment variables
const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || 'ybj2ymh82q34';
const apiSecret = process.env.STREAM_API_SECRET || '24y9r689yjzr5htyxynf3eacm9xjxajg5xb9peusyjb6fknkjd2wn4du5vawe3eq';

// Initialize Stream Chat server client
const serverClient = StreamChat.getInstance(apiKey, apiSecret);

// Product listing ID
const LISTING_ID = 'CM-123456789';
const CHANNEL_ID = `listing-${LISTING_ID}`;

// =============================================================================
// CONVERSATION SCENARIOS
// =============================================================================
const scenarios = {
  empty: {
    name: 'Empty Chat',
    description: 'Just the initial seller message - fresh conversation',
    messages: [], // Just the initial message will be sent
  },
  active: {
    name: 'Active Conversation',
    description: 'Buyer and seller having a conversation about the product',
    messages: [
      {
        user_id: 'buyer-carlos',
        text: 'Hi! I\'m interested in this vase set. Is it still available?',
        delay: 0, // Carlos starts the conversation
      },
      {
        user_id: 'seller-maria',
        text: 'Yes, it\'s still available! All pieces are in perfect condition and ready to ship.',
        delay: 2000,
      },
      {
        user_id: 'buyer-carlos',
        text: 'Great! How long does shipping usually take?',
        delay: 1500,
      },
      {
        user_id: 'seller-maria',
        text: 'Free shipping is included and typically takes 3-5 business days within Mexico. I ship from Baja California.',
        delay: 2000,
      },
      {
        user_id: 'buyer-carlos',
        text: 'Perfect! And each piece is unique, right?',
        delay: 1500,
      },
      {
        user_id: 'seller-maria',
        text: 'Exactly! Each vase is handcrafted, so no two are identical. They all have the beautiful Baja Blue glaze.',
        delay: 2000,
      },
      {
        user_id: 'buyer-carlos',
        text: 'That sounds amazing. I think I\'m ready to purchase. Is the price negotiable?',
        delay: 2000,
      },
    ],
  },
  issue: {
    name: 'Issue Scenario',
    description: 'Buyer has a problem and might need to escalate',
    messages: [
      {
        user_id: 'buyer-carlos',
        text: 'Hello, I received my order but one of the vases arrived broken.',
        delay: 1000,
      },
      {
        user_id: 'seller-maria',
        text: 'Oh no! I\'m so sorry to hear that. Can you send me a photo of the damage?',
        delay: 2000,
      },
      {
        user_id: 'buyer-carlos',
        text: 'Yes, I can send a photo. But I already paid and this is really disappointing.',
        delay: 2000,
      },
      {
        user_id: 'seller-maria',
        text: 'I completely understand your frustration. Once I see the photo, I\'ll process a replacement immediately.',
        delay: 2500,
      },
      {
        user_id: 'buyer-carlos',
        text: 'I\'ve been waiting for a response for 2 days now. This is taking too long.',
        delay: 2000,
      },
    ],
  },
};

// =============================================================================
// SEED CHANNEL WITH SCENARIO
// =============================================================================
async function seedScenario(scenarioName) {
  const scenario = scenarios[scenarioName];

  if (!scenario) {
    console.error(`❌ Unknown scenario: ${scenarioName}`);
    console.log('\nAvailable scenarios:');
    Object.keys(scenarios).forEach((key) => {
      console.log(`   - ${key}: ${scenarios[key].name} - ${scenarios[key].description}`);
    });
    process.exit(1);
  }

  console.log(`\n🌱 Seeding channel with scenario: ${scenario.name}\n`);
  console.log(`   ${scenario.description}\n`);

  try {
    const channel = serverClient.channel('messaging', CHANNEL_ID);

    // Check if channel exists, create if not
    try {
      await channel.query({});
      console.log('   ✅ Channel found');
    } catch (error) {
      if (error.message?.includes('not found') || error.code === 4) {
        console.log('   ℹ️  Channel does not exist. Creating it...');
        await channel.create({
          name: 'Handmade Ceramic Vase Set - Baja Blue',
          image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400',
          members: ['buyer-carlos', 'seller-maria'],
          created_by_id: 'seller-maria',
          listing_id: LISTING_ID,
          listing_price: '$89.99',
        });
        console.log('   ✅ Channel created');
      } else {
        throw error;
      }
    }

    // Don't send initial message - Carlos (buyer) should start the conversation
    // Maria will respond after Carlos asks something

    // Send scenario messages with delays to make it feel natural
    if (scenario.messages.length > 0) {
      console.log(`   Sending ${scenario.messages.length} conversation message(s)...`);

      for (let i = 0; i < scenario.messages.length; i++) {
        const msg = scenario.messages[i];
        await new Promise((resolve) => setTimeout(resolve, msg.delay || 500));
        await channel.sendMessage({
          text: msg.text,
          user_id: msg.user_id,
        });
        console.log(`   ✅ Message ${i + 1}/${scenario.messages.length} sent`);
      }
    }

    console.log('\n✨ Scenario seeded successfully!\n');
    console.log(`   Channel is ready with: ${scenario.name}\n`);

    return { success: true, messagesSent: scenario.messages.length + 1 };
  } catch (error) {
    console.error('❌ Error seeding scenario:', error.message);
    if (error.response) {
      console.error('   Response:', error.response);
    }
    process.exit(1);
  }
}

// =============================================================================
// MAIN
// =============================================================================
const scenarioName = process.argv[2];

if (!scenarioName) {
  console.log('Usage: node scripts/seed-scenario.js <scenario-name>\n');
  console.log('Available scenarios:');
  Object.keys(scenarios).forEach((key) => {
    console.log(`   - ${key}: ${scenarios[key].name}`);
    console.log(`     ${scenarios[key].description}\n`);
  });
  process.exit(1);
}

seedScenario(scenarioName)
  .then((result) => {
    console.log(`📊 Summary: ${result.messagesSent} message(s) in channel\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
