const { StreamChat } = require('stream-chat');

// Get credentials from environment variables
const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || 'ybj2ymh82q34';
const apiSecret = process.env.STREAM_API_SECRET || '24y9r689yjzr5htyxynf3eacm9xjxajg5xb9peusyjb6fknkjd2wn4du5vawe3eq';

// User ID from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: User ID required');
  console.log('\nUsage: node scripts/generate-token.js <user-id>');
  console.log('Example: node scripts/generate-token.js buyer-carlos\n');
  process.exit(1);
}

// Initialize Stream Chat server client
const serverClient = StreamChat.getInstance(apiKey, apiSecret);

// Generate token for the user
const token = serverClient.createToken(userId);

console.log('\n✅ Token generated successfully!\n');
console.log('User ID:', userId);
console.log('Token:', token);
console.log('\n📋 Add this to your .env.local file:');
console.log(`NEXT_PUBLIC_STREAM_USER_TOKEN=${token}\n`);
