# Setup Scripts for Craft Market Chat

These scripts help you quickly set up and reset Stream Chat users for demos and SE (Sales Engineering) work.

## Quick Start

### Setup All Users (Recommended for First Time)

This creates both buyer and seller users and generates their tokens:

```bash
npm run setup-users
```

Or with environment variables:

```bash
NEXT_PUBLIC_STREAM_API_KEY=your_key STREAM_API_SECRET=your_secret npm run setup-users
```

**What it does:**
- ✅ Creates/updates `buyer-carlos` and `seller-maria` users in Stream Chat
- ✅ Generates tokens for both users
- ✅ Verifies users exist
- ✅ Outputs ready-to-copy `.env.local` configuration

### Generate Token for Specific User

Generate a token for a single user:

```bash
npm run generate-token buyer-carlos
# or
npm run generate-token seller-maria
```

## For SE Demos

### Quick Reset Between Demos

**Clean messages and tickets (recommended for between demos):**

```bash
npm run clean-demo
```

This will:
- ✅ Delete all messages from the channel
- ✅ Remove agent from channel (resets escalation button)
- ✅ Delete all Zendesk tickets with "craftmarket" tag
- ✅ Send fresh initial message from seller
- ✅ Keep users and channel structure intact

**Full cleanup (complete reset):**

```bash
npm run full-cleanup
```

This will:
- ✅ Delete Stream Chat channel
- ✅ Delete Stream Chat users (buyer, seller, agent)
- ✅ Delete all Zendesk tickets with "craftmarket" tag
- ⚠️  Requires running `npm run setup-users` after to recreate users

### Seed Conversation Scenarios

**Add realistic conversation messages to the channel:**

```bash
npm run seed-scenario empty      # Just initial message (empty chat)
npm run seed-scenario active     # Active buyer-seller conversation
npm run seed-scenario issue      # Buyer has a problem (good for escalation demo)
```

**Available scenarios:**
- `empty` - Just the initial seller message (fresh conversation)
- `active` - Realistic buyer-seller conversation about the product
- `issue` - Buyer has a problem, good for demonstrating escalation

**Usage:**
1. Run `npm run clean-demo` to reset the channel
2. Run `npm run seed-scenario <scenario-name>` to add conversation
3. Open the app to see the seeded conversation

### Reset Users (Clean Slate)

To reset users for a fresh demo:

```bash
npm run setup-users
```

This will:
- Recreate users (upsert - safe to run multiple times)
- Generate fresh tokens
- Give you clean output to copy

### Switch Between Users

1. Run `npm run setup-users` to get both tokens
2. Copy the buyer token to `.env.local` for buyer view
3. Copy the seller token to `.env.local` for seller view
4. Restart dev server: `npm run dev`

## Environment Variables

The scripts use these environment variables (with defaults for local dev):

- `NEXT_PUBLIC_STREAM_API_KEY` - Your Stream API Key
- `STREAM_API_SECRET` - Your Stream API Secret (server-side only)
- `ZENDESK_SUBDOMAIN` - Your Zendesk subdomain (for ticket deletion)
- `ZENDESK_EMAIL` - Your Zendesk admin email (for ticket deletion)
- `ZENDESK_API_TOKEN` - Your Zendesk API token (for ticket deletion)

## Troubleshooting

**Error: "users don't exist"**
- Run `npm run setup-users` to create them

**Error: "Invalid token"**
- Run `npm run setup-users` to generate fresh tokens
- Make sure you copied the full token to `.env.local`

**Need to test with different users?**
- Modify `scripts/setup-users.js` to add more users
- Run `npm run setup-users` again

## Files

- `setup-users.js` - Creates users and generates tokens (main script)
- `generate-token.js` - Generates token for a single user
- `clean-demo.js` - Quick reset: clears messages and tickets (keeps users/channel)
- `full-cleanup.js` - Complete reset: deletes everything (users, channel, tickets)
- `seed-scenario.js` - Seeds channel with realistic conversation scenarios
