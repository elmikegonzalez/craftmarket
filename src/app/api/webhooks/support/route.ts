import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// ZENDESK CONFIGURATION
// In production, these would come from environment variables
// =============================================================================
const ZENDESK_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN || 'craftmarket-demo';
const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL || 'support@craftmarket.com';
const ZENDESK_API_TOKEN = process.env.ZENDESK_API_TOKEN || 'demo-token';

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
// ZENDESK TICKET CREATION
// =============================================================================
async function createZendeskTicket(data: SupportRequest): Promise<ZendeskTicket> {
  const { channelId, channelName, userId, userName, listingId, message } = data;

  // ==========================================================================
  // PRODUCTION: Uncomment this block to create real Zendesk tickets
  // ==========================================================================
  /*
  const response = await fetch(
    `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/tickets.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${ZENDESK_EMAIL}/token:${ZENDESK_API_TOKEN}`).toString('base64')}`,
      },
      body: JSON.stringify({
        ticket: {
          subject: `Craft Market - Support: ${channelName || listingId}`,
          comment: {
            body: `
Usuario: ${userName} (${userId})
Publicación: ${listingId}
Canal de chat: ${channelId}

Mensaje del usuario:
${message}

---
This ticket was automatically created from the Craft Market chat.
            `.trim(),
          },
          requester: {
            name: userName,
            email: `${userId}@marketplace.craftmarket.com`,
          },
          priority: 'normal',
          tags: ['craftmarket', 'chat-escalation', 'marketplace', listingId],
          custom_fields: [
            { id: 'channel_id', value: channelId },
            { id: 'listing_id', value: listingId },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Zendesk API error: ${response.status}`);
  }

  const result = await response.json();
  return result.ticket;
  */

  // ==========================================================================
  // DEMO: Simulated ticket creation
  // ==========================================================================
  const ticketId = Math.floor(Math.random() * 90000) + 10000;

  console.log('\n📝 Creating Zendesk ticket (simulated):');
  console.log(`   Subject: Craft Market - Support: ${channelName || listingId}`);
  console.log(`   Requester: ${userName}`);
  console.log(`   Channel: ${channelId}`);
  console.log(`   Listing: ${listingId}`);
  console.log(`   Message: ${message}`);

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    id: ticketId,
    url: `https://${ZENDESK_SUBDOMAIN}.zendesk.com/tickets/${ticketId}`,
    subject: `Craft Market - Support: ${channelName || listingId}`,
    status: 'new',
    created_at: new Date().toISOString(),
  };
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

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      ticketUrl: ticket.url,
      message: `Ticket #${ticket.id} created successfully`,
    });
  } catch (error) {
    console.error('❌ Error processing support request:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// HEALTH CHECK (GET)
// =============================================================================
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Craft Market Support Webhook',
    timestamp: new Date().toISOString(),
    endpoints: {
      POST: '/api/webhooks/support - Create support ticket',
    },
  });
}
