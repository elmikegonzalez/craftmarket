const { StreamChat } = require('stream-chat');

// Get credentials from environment variables
const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || 'ybj2ymh82q34';
const apiSecret = process.env.STREAM_API_SECRET || '24y9r689yjzr5htyxynf3eacm9xjxajg5xb9peusyjb6fknkjd2wn4du5vawe3eq';

// Initialize Stream Chat server client
const serverClient = StreamChat.getInstance(apiKey, apiSecret);

// Define users to create
const users = [
  {
    id: 'buyer-carlos',
    name: 'Carlos (Buyer)',
    image: 'https://getstream.io/random_png/?name=Carlos',
  },
  {
    id: 'seller-maria',
    name: 'María (Seller)',
    image: 'https://getstream.io/random_png/?name=Maria',
  },
  {
    id: 'agent-support',
    name: 'Craft Market Support',
    role: 'admin',
    image: 'https://getstream.io/random_png/?name=Support',
  },
];

async function setupUsers() {
  console.log('\n🚀 Setting up Stream Chat users for Craft Market...\n');

  try {
    // Upsert users (create or update if they exist)
    console.log('📝 Creating/updating users...');
    await serverClient.upsertUsers(users);
    console.log('✅ Users created/updated successfully!\n');

    // Generate tokens for each user
    console.log('🔑 Generating tokens...\n');
    const tokens = {};

    for (const user of users) {
      const token = serverClient.createToken(user.id);
      tokens[user.id] = token;
      console.log(`✅ ${user.name} (${user.id})`);
      console.log(`   Token: ${token}\n`);
    }

    // Output .env format
    console.log('📋 Copy these to your .env.local file:\n');
    console.log('NEXT_PUBLIC_STREAM_API_KEY=ybj2ymh82q34');
    console.log(`NEXT_PUBLIC_STREAM_USER_TOKEN=${tokens['buyer-carlos']}`);
    console.log('STREAM_API_SECRET=24y9r689yjzr5htyxynf3eacm9xjxajg5xb9peusyjb6fknkjd2wn4du5vawe3eq');
    console.log('\n💡 Note: The buyer token is used by default in the app.');
    console.log('   To switch users, update NEXT_PUBLIC_STREAM_USER_TOKEN with the seller token.\n');

    // Verify users exist
    console.log('🔍 Verifying users...');
    const response = await serverClient.queryUsers({ id: { $in: users.map(u => u.id) } });
    console.log(`✅ Verified ${response.users.length} users exist in Stream Chat\n`);

    return { users, tokens };
  } catch (error) {
    console.error('❌ Error setting up users:', error.message);
    if (error.response) {
      console.error('   Response:', error.response);
    }
    process.exit(1);
  }
}

// Run the setup
setupUsers()
  .then(() => {
    console.log('✨ Setup complete! Your chat should work now.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
