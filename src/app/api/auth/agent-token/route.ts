import { NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';

// =============================================================================
// GENERATE AGENT TOKEN
// =============================================================================
export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Stream Chat credentials not configured' },
        { status: 500 }
      );
    }

    const serverClient = StreamChat.getInstance(apiKey, apiSecret);
    const token = serverClient.createToken('agent-support');

    return NextResponse.json({
      token,
      userId: 'agent-support',
    });
  } catch (error) {
    console.error('Error generating agent token:', error);
    return NextResponse.json(
      { error: 'Failed to generate agent token' },
      { status: 500 }
    );
  }
}
