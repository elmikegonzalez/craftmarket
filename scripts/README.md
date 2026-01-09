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
