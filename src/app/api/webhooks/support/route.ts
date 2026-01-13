import { NextRequest, NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';

// =============================================================================
// ZENDESK CONFIGURATION
// In production, these would come from environment variables
// =============================================================================
const ZENDESK_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN || 'craftmarket-demo';
const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL || 'support@craftmarket.com'; // Admin account for API operations
const ZENDESK_API_TOKEN = process.env.ZENDESK_API_TOKEN || 'demo-token';
const ZENDESK_AGENT_EMAIL = process.env.ZENDESK_AGENT_EMAIL || ''; // Agent email for ticket assignment

// =============================================================================
// STREAM CHAT CONFIGURATION
// =============================================================================
const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';
const STREAM_API_SECRET = process.env.STREAM_API_SECRET || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// =============================================================================
// TYPES
// =============================================================================
interface SupportRequest {
  channelId: string;
  channelName: string;
  userId: string;
  userName: string;
  listingId: string;
  message: string;
}

interface ZendeskTicket {
  id: number;
  url: string;
  subject: string;
  status: string;
  created_at: string;
}

// =============================================================================
// ADD AGENT TO STREAM CHAT CHANNEL
// =============================================================================
async function addAgentToChannel(channelId: string) {
  if (!STREAM_API_KEY || !STREAM_API_SECRET) {
    console.warn('⚠️ Stream Chat credentials not configured. Skipping agent addition.');
    return;
  }

  try {
    const serverClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);

    // Create or update agent user
    const agentUser = {
      id: 'agent-support',
      name: 'Craft Market Support',
      role: 'admin',
      image: 'https://getstream.io/random_png/?name=Support',
    };

    await serverClient.upsertUsers([agentUser]);
    console.log('✅ Agent user created/updated');

    // Get the channel and add agent as member
    const channel = serverClient.channel('messaging', channelId);
    await channel.addMembers(['agent-support']);
    console.log('✅ Agent added to channel:', channelId);

    // Send a system message that agent joined
    await channel.sendMessage({
      text: '👋 Hello! A Craft Market support agent has joined to help you.',
      user_id: 'agent-support',
    });
  } catch (error) {
    console.error('❌ Error adding agent to channel:', error);
    // Don't throw - we still want to create the Zendesk ticket even if this fails
  }
}

// =============================================================================
// GET ZENDESK AGENT USER ID
// =============================================================================
async function getZendeskAgentUserId(): Promise<number | null> {
  if (!ZENDESK_AGENT_EMAIL) {
    console.log('⚠️  ZENDESK_AGENT_EMAIL not configured. Tickets will not be assigned.');
    return null;
  }

  try {
    const response = await fetch(
      `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/users/search.json?query=email:${encodeURIComponent(ZENDESK_AGENT_EMAIL)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${ZENDESK_EMAIL}/token:${ZENDESK_API_TOKEN}`).toString('base64')}`,
        },
      }
    );

    if (!response.ok) {
      console.warn(`⚠️  Could not find agent user: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const users = data.users || [];
    
    if (users.length === 0) {
      console.warn(`⚠️  Agent user not found: ${ZENDESK_AGENT_EMAIL}`);
      return null;
    }

    const agentUser = users.find((u: any) => u.email === ZENDESK_AGENT_EMAIL && u.role === 'agent');
    if (!agentUser) {
      console.warn(`⚠️  User ${ZENDESK_AGENT_EMAIL} is not an agent. Tickets will not be assigned.`);
      return null;
    }

    console.log(`✅ Found agent user ID: ${agentUser.id} (${ZENDESK_AGENT_EMAIL})`);
    return agentUser.id;
  } catch (error) {
    console.warn('⚠️  Error fetching agent user ID:', error);
    return null;
  }
}

// =============================================================================
// ZENDESK TICKET CREATION
// =============================================================================
async function createZendeskTicket(data: SupportRequest): Promise<ZendeskTicket> {
  const { channelId, channelName, userId, userName, listingId, message } = data;

  // Validate Zendesk configuration
  if (!ZENDESK_SUBDOMAIN || ZENDESK_SUBDOMAIN === 'craftmarket-demo') {
    throw new Error('ZENDESK_SUBDOMAIN not configured. Please set it in your .env file.');
  }
  if (!ZENDESK_EMAIL || ZENDESK_EMAIL === 'support@craftmarket.com') {
    throw new Error('ZENDESK_EMAIL not configured. Please set it in your .env file.');
  }
  if (!ZENDESK_API_TOKEN || ZENDESK_API_TOKEN === 'demo-token') {
    throw new Error('ZENDESK_API_TOKEN not configured. Please set it in your .env file.');
  }

  // Get agent user ID for ticket assignment
  const agentUserId = await getZendeskAgentUserId();

  console.log('\n📝 Creating Zendesk ticket:');
  console.log(`   Subdomain: ${ZENDESK_SUBDOMAIN}`);
  console.log(`   Subject: Craft Market - Support: ${channelName || listingId}`);
  console.log(`   Requester: ${userName} (${userId})`);
  console.log(`   Channel: ${channelId}`);
  console.log(`   Listing: ${listingId}`);
  if (agentUserId) {
    console.log(`   Assigning to agent: ${ZENDESK_AGENT_EMAIL} (ID: ${agentUserId})`);
  } else {
    console.log(`   ⚠️  No agent assignment (ZENDESK_AGENT_EMAIL not configured)`);
  }

  const ticketData: any = {
    subject: `Craft Market - Support: ${channelName || listingId}`,
    comment: {
      body: `
User: ${userName} (${userId})
Listing: ${listingId}
Chat Channel: ${channelId}

User Message:
${message}

---
This ticket was automatically created from the Craft Market chat.

💬 Join the conversation as support agent: ${APP_URL}?channel=${encodeURIComponent(channelId)}&user=agent-support
      `.trim(),
    },
    requester: {
      name: userName,
      email: `${userId}@marketplace.craftmarket.com`,
    },
    priority: 'normal',
    tags: ['craftmarket', 'chat-escalation', 'marketplace', listingId],
  };

  // Assign ticket to agent if agent user ID was found
  if (agentUserId) {
    ticketData.assignee_id = agentUserId;
  }

  const response = await fetch(
    `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/tickets.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${ZENDESK_EMAIL}/token:${ZENDESK_API_TOKEN}`).toString('base64')}`,
      },
      body: JSON.stringify({
        ticket: ticketData,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Zendesk API error:', response.status, errorText);
    throw new Error(`Zendesk API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`✅ Zendesk ticket created: #${result.ticket.id}`);
  return result.ticket;
}

// =============================================================================
// API ROUTE HANDLER
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const body: SupportRequest = await request.json();

    console.log('\n🎫 Support escalation received:');
    console.log(JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.channelId || !body.userId) {
      return NextResponse.json(
        { error: 'Missing required fields: channelId, userId' },
        { status: 400 }
      );
    }

    // Create Zendesk ticket
    const ticket = await createZendeskTicket(body);

    console.log(`✅ Ticket created: #${ticket.id}`);

    // Add agent to Stream Chat channel
    await addAgentToChannel(body.channelId);

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      ticketUrl: ticket.url,
      channelId: body.channelId,
      chatUrl: `${APP_URL}?channel=${encodeURIComponent(body.channelId)}&user=agent-support`,
      message: `Ticket #${ticket.id} created successfully`,
    });
  } catch (error) {
    console.error('❌ Error processing support request:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('not configured') ? 500 : 500;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        ...(errorMessage.includes('not configured') && {
          hint: 'Please configure ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, and ZENDESK_API_TOKEN in your .env file',
        }),
      },
      { status: statusCode }
    );
  }
}

// =============================================================================
// HEALTH CHECK (GET)
// =============================================================================
export async function GET() {
  const zendeskConfigured =
    ZENDESK_SUBDOMAIN &&
    ZENDESK_SUBDOMAIN !== 'craftmarket-demo' &&
    ZENDESK_EMAIL &&
    ZENDESK_EMAIL !== 'support@craftmarket.com' &&
    ZENDESK_API_TOKEN &&
    ZENDESK_API_TOKEN !== 'demo-token';

  return NextResponse.json({
    status: 'ok',
    service: 'Craft Market Support Webhook',
    timestamp: new Date().toISOString(),
    zendesk: {
      configured: zendeskConfigured,
      subdomain: zendeskConfigured ? ZENDESK_SUBDOMAIN : 'not configured',
    },
    endpoints: {
      POST: '/api/webhooks/support - Create support ticket',
    },
  });
}
