# 🛒 Craft Market Chat Demo

Stream Chat integration for marketplace buyer-seller communication with support escalation to Zendesk.

**Stack:** Next.js 15 + App Router + Tailwind CSS + Stream Chat React SDK

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js App (Vercel)                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    app/page.tsx                           │  │
│  │                   (Server Component)                      │  │
│  │                         │                                 │  │
│  │                         ▼                                 │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │         components/MarketplaceChat.tsx             │  │  │
│  │  │              (Client Component)                     │  │  │
│  │  │                                                     │  │  │
│  │  │  • Stream Chat React SDK                           │  │  │
│  │  │  • Custom ProductAttachment                        │  │  │
│  │  │  • Custom Message Component                        │  │  │
│  │  │  • Escalation Button                               │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              app/api/webhooks/support/route.ts            │  │
│  │                    (API Route)                            │  │
│  │                                                           │  │
│  │  • Receives escalation requests                          │  │
│  │  • Creates Zendesk tickets                               │  │
│  │  • Returns ticket confirmation                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Stream Chat API                            │
│  • Real-time messaging     • Channel management                 │
│  • Typing indicators       • Read receipts                      │
│  • Custom attachments      • User presence                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Zendesk API                              │
│  POST /api/v2/tickets.json                                      │
│  • Creates support ticket with chat context                     │
│  • Tags: craftmarket, chat-escalation, listing-id              │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
# Stream Chat
NEXT_PUBLIC_STREAM_API_KEY=your_api_key
NEXT_PUBLIC_STREAM_USER_TOKEN=your_user_token
STREAM_API_SECRET=your_api_secret

# Zendesk (for support escalation)
ZENDESK_SUBDOMAIN=your-subdomain
ZENDESK_EMAIL=admin@example.com
ZENDESK_API_TOKEN=your_zendesk_api_token
```

Get Stream credentials from [dashboard.getstream.io](https://dashboard.getstream.io)

Get Zendesk credentials:
1. Go to Zendesk Admin → Apps and integrations → APIs → Zendesk API
2. Enable Token Access
3. Generate a new API token
4. Copy your subdomain from your Zendesk URL (e.g., `company.zendesk.com` → `company`)

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo at [vercel.com](https://vercel.com)

## Project Structure

```
src/
├── app/
│   ├── page.tsx                      # Main page (server component)
│   ├── layout.tsx                    # Root layout
│   ├── globals.css                   # Tailwind + Stream overrides
│   └── api/
│       └── webhooks/
│           └── support/
│               └── route.ts          # Zendesk integration endpoint
└── components/
    └── MarketplaceChat.tsx           # Chat UI (client component)
```

## Demo Flow (15 minutes)

### Part 1: Business Context (2 min)

> "Craft Market connects buyers and sellers for unique handmade and artisanal products. Buyer-seller communication is critical for trust and transaction completion. When issues arise, seamless escalation to support prevents disputes and chargebacks."

### Part 2: Live Demo (8 min)

1. **Channel Creation**
   - Show how channel is created with listing context
   - Custom data: `listing_id`, `listing_price`
   - Members: buyer + seller

2. **Product Attachment**
   - Custom `ProductAttachment` component
   - Renders product card inside chat
   - Price, image, description embedded

3. **Real-time Messaging**
   - Send messages as buyer
   - Typing indicators
   - Read receipts

4. **Support Escalation**
   - Click "Escalate to Support"
   - `/support` command sent
   - API route creates Zendesk ticket
   - Confirmation appears in chat

### Part 3: Code Walkthrough (5 min)

**Key files to show:**

1. `MarketplaceChat.tsx` - Client component setup
   ```tsx
   const client = useCreateChatClient({
     apiKey,
     tokenOrProvider: userToken,
     userData: currentUser,
   });
   ```

2. `ProductAttachment` - Custom attachment rendering
   ```tsx
   if (attachment.type === 'product') {
     return <ProductCard data={attachment} />;
   }
   return <Attachment {...props} />;
   ```

3. `api/webhooks/support/route.ts` - Zendesk integration
   ```ts
   export async function POST(request: NextRequest) {
     const body = await request.json();
     const ticket = await createZendeskTicket(body);
     return NextResponse.json({ ticketId: ticket.id });
   }
   ```

## Key Technical Points

### Why Next.js App Router?
- Server Components by default (better performance)
- API routes built-in (no separate backend)
- Vercel deployment is one click
- Industry standard for React in 2024-2025

### Stream Chat SDK Patterns
- `useCreateChatClient` - Singleton pattern, handles connection
- `Channel` component - Context provider for messages
- Custom `Attachment` prop - Override rendering
- Custom `Message` prop - Full control over message UI

### Channel Structure
```javascript
client.channel('messaging', 'listing-CM-123456789', {
  name: 'Handmade Ceramic Vase Set - Baja Blue',
  image: 'https://...',
  members: ['buyer-carlos', 'seller-maria'],
  listing_id: 'CM-123456789',
  listing_price: '$89.99',
});
```

### Zendesk Ticket Schema
```json
{
  "ticket": {
    "subject": "Craft Market - Support: iPhone 14 Pro Max",
    "comment": {
      "body": "User: Carlos\\nListing: CM-123456789\\n..."
    },
    "requester": {
      "name": "Carlos",
      "email": "buyer-carlos@marketplace.craftmarket.com"
    },
    "tags": ["craftmarket", "chat-escalation", "CM-123456789"]
  }
}
```

## Q&A Preparation

**"How would you handle high message volume?"**
> Stream handles this at infrastructure level - they support 1B+ end users. For UI, use `VirtualizedMessageList` component for channels with 1000+ messages.

**"What about message moderation?"**
> Stream has built-in AI moderation, profanity filters, and image moderation. Can configure at channel type level.

**"How do you ensure data privacy between buyer/seller?"**
> Channel membership controls access. Only members can read messages. Can add data masking (hide email/phone until payment confirmed).

**"What if Zendesk is down?"**
> Queue the ticket creation, retry with exponential backoff. Send user a "ticket pending" message. Could also use SNS/SQS for reliability.

**"How would you scale this for Craft Market's volume?"**
> Stream's infrastructure scales automatically. For Zendesk, would batch tickets or use their async API. Consider regional Zendesk instances.

## Resources

- [Stream Chat React Docs](https://getstream.io/chat/docs/sdk/react/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Zendesk Tickets API](https://developer.zendesk.com/api-reference/ticketing/tickets/tickets/)
- [Stream Marketplace Best Practices](https://getstream.io/chat/docs/react/marketplace_best_practices/)
