'use client';

import { useEffect, useState } from 'react';
import type { Channel as StreamChannel, User } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageInput,
  MessageList,
  Thread,
  Window,
  useCreateChatClient,
  Attachment,
  useMessageContext,
} from 'stream-chat-react';
import type { AttachmentProps } from 'stream-chat-react';

import 'stream-chat-react/dist/css/v2/index.css';

// =============================================================================
// STREAM CREDENTIALS - Replace with your own from dashboard.getstream.io
// =============================================================================
const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || 'YOUR_API_KEY';
const userToken = process.env.NEXT_PUBLIC_STREAM_USER_TOKEN || 'YOUR_USER_TOKEN';

// =============================================================================
// USERS - Buyer and Seller for Craft Market scenario
// =============================================================================
const users = {
  buyer: {
    id: 'buyer-carlos',
    name: 'Carlos (Comprador)',
    image: 'https://getstream.io/random_png/?name=Carlos',
  },
  seller: {
    id: 'seller-maria',
    name: 'María (Vendedora)',
    image: 'https://getstream.io/random_png/?name=Maria',
  },
};

// =============================================================================
// CRAFT MARKET PRODUCT LISTING
// =============================================================================
const productListing = {
  id: 'CM-123456789',
  title: 'Handmade Ceramic Vase Set - Baja Blue',
  price: '$89.99',
  originalPrice: '$120.00',
  image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400',
  description: 'Handcrafted ceramic vase set. Each piece is unique. Free shipping included.',
  seller: users.seller,
  location: 'Baja California, Mexico',
  rating: 4.9,
  sales: 2847,
};

// =============================================================================
// CUSTOM PRODUCT ATTACHMENT - Craft Market Style
// =============================================================================
const ProductAttachment = (props: AttachmentProps) => {
  const { attachments } = props;
  const [attachment] = attachments || [];

  if (attachment && 'type' in attachment && attachment.type === 'product') {
    const product = attachment as { type: string; image?: string; title?: string; price?: string; description?: string; originalPrice?: string };
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-sm mt-2 shadow-sm">
        <div className="flex gap-3">
          <img
            src={product.image || ''}
            alt={product.title || 'Product'}
            className="w-24 h-24 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">
              {product.title}
            </h4>
            <p className="text-green-600 font-bold text-lg mt-1">
              {product.price}
            </p>
            {product.originalPrice && (
              <p className="text-gray-400 text-sm line-through">
                {product.originalPrice}
              </p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {product.description}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <Attachment {...props} />;
};

// =============================================================================
// CUSTOM MESSAGE COMPONENT
// =============================================================================
const CustomMessage = () => {
  const { message } = useMessageContext();

  // Support ticket confirmation
  if (message.text?.includes('🎫 Support ticket') || message.text?.includes('Ticket de soporte')) {
    return (
      <div className="mx-4 my-2 p-3 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎫</span>
          <span className="text-green-800 text-sm">{message.text}</span>
        </div>
      </div>
    );
  }

  // Escalation request
  if (message.text?.startsWith('/soporte') || message.text?.startsWith('/support')) {
    return (
      <div className="mx-4 my-2 p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
        <div className="flex items-center gap-2 mb-1">
          <strong className="text-amber-900 text-sm">{message.user?.name}</strong>
          <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
            ⚡ Escalación
          </span>
        </div>
        <p className="text-amber-800 text-sm">
          {message.text.replace(/^\/(soporte|support)\s*/, '') || 'Requested support assistance'}
        </p>
      </div>
    );
  }

  // Regular message
  const isBuyer = message.user?.id === users.buyer.id;
  return (
    <div className={`flex gap-3 mx-4 my-2 ${isBuyer ? 'flex-row-reverse' : ''}`}>
      <img
        src={message.user?.image as string}
        alt={message.user?.name}
        className="w-8 h-8 rounded-full flex-shrink-0"
      />
      <div className={`max-w-xs ${isBuyer ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-600">{message.user?.name}</span>
          <span className="text-xs text-gray-400">
            {new Date(message.created_at || '').toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div
          className={`p-3 rounded-2xl text-sm ${
            isBuyer
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-800 rounded-bl-md'
          }`}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// ESCALATION BUTTON
// =============================================================================
const EscalateButton = ({ channel }: { channel: StreamChannel }) => {
  const [isEscalating, setIsEscalating] = useState(false);
  const [hasEscalated, setHasEscalated] = useState(false);

  // Check if agent is already in the channel or if escalation has happened
  useEffect(() => {
    if (!channel) return;

    // Check if agent-support is a member
    const agentMember = channel.state.members['agent-support'];
    const hasAgent = !!agentMember;

    // Check if there's already a support ticket message
    const hasTicketMessage = channel.state.messages.some(
      (msg) =>
        msg.text?.includes('Support ticket #') ||
        msg.text?.includes('🎫 Support ticket')
    );

    setHasEscalated(hasAgent || hasTicketMessage);

    // Listen for new members (when agent joins)
    const handleMemberAdded = (event: any) => {
      if (event.user?.id === 'agent-support') {
        setHasEscalated(true);
      }
    };

    // Listen for new messages (when ticket confirmation is sent)
    const handleNewMessage = (event: any) => {
      if (
        event.message?.text?.includes('Support ticket #') ||
        event.message?.text?.includes('🎫 Support ticket')
      ) {
        setHasEscalated(true);
      }
    };

    channel.on('member.added', handleMemberAdded);
    channel.on('message.new', handleNewMessage);

    return () => {
      channel.off('member.added', handleMemberAdded);
      channel.off('message.new', handleNewMessage);
    };
  }, [channel]);

  const handleEscalate = async () => {
    setIsEscalating(true);

    try {
      // Send escalation command
      await channel.sendMessage({
        text: '/support I need help - the seller is not responding and I already paid for the product.',
      });

      // Call webhook API route
      const response = await fetch('/api/webhooks/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: channel.id,
          channelName: (channel.data as { name?: string })?.name || channel.id,
          userId: users.buyer.id,
          userName: users.buyer.name,
          listingId: productListing.id,
          message: 'I need help - the seller is not responding and I already paid for the product.',
        }),
      });

      const data = await response.json();

      // Send confirmation
      await channel.sendMessage({
        text: `🎫 Support ticket #${data.ticketId} created. A Craft Market agent will join this conversation shortly.`,
      });

      // Mark as escalated
      setHasEscalated(true);
    } catch (error) {
      console.error('Escalation failed:', error);
    } finally {
      setIsEscalating(false);
    }
  };

  const isDisabled = isEscalating || hasEscalated;

  return (
    <button
      onClick={handleEscalate}
      disabled={isDisabled}
      className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-lg 
                 hover:from-red-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                 shadow-md hover:shadow-lg disabled:hover:from-red-500 disabled:hover:to-orange-500"
      title={
        hasEscalated
          ? 'Support has already been contacted for this conversation'
          : undefined
      }
    >
      {isEscalating
        ? '⏳ Creating ticket...'
        : hasEscalated
          ? '✅ Support Contacted'
          : '🎫 Escalate to Support'}
    </button>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function MarketplaceChat() {
  const [channel, setChannel] = useState<StreamChannel>();
  const [currentUser, setCurrentUser] = useState<User>(users.buyer);
  const [agentToken, setAgentToken] = useState<string | null>(null);
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if we're joining as an agent and fetch token
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    
    if (userParam === 'agent-support') {
      // Fetch agent token from API
      fetch('/api/auth/agent-token')
        .then((res) => res.json())
        .then((data) => {
          if (data.token) {
            setAgentToken(data.token);
            setCurrentUser({
              id: 'agent-support',
              name: 'Craft Market Support',
              image: 'https://getstream.io/random_png/?name=Support',
            });
          }
        })
        .catch((error) => {
          console.error('Failed to get agent token:', error);
        })
        .finally(() => {
          setIsLoadingAgent(false);
        });
    } else {
      // Not an agent, use buyer token immediately
      setIsLoadingAgent(false);
    }
  }, []);

  // Determine which token to use
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isAgent = urlParams?.get('user') === 'agent-support';
  
  // Only create client when we have the right token (wait for agent token if agent)
  const activeToken = isAgent ? agentToken : userToken;
  const tokenReady = !isAgent || (isAgent && agentToken !== null);

  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: tokenReady ? (activeToken || userToken) : userToken, // Use buyer token as fallback
    userData: currentUser,
    options: {
      enableInsights: true,
      enableWSFallback: true,
    },
  });

  useEffect(() => {
    // Don't setup channel if we're waiting for agent token or refreshing
    if (!client || (isAgent && !agentToken) || isRefreshing) return;

    const setupChannel = async () => {
      // Check if we're joining a specific channel from URL (for agents)
      const urlParams = new URLSearchParams(window.location.search);
      const channelParam = urlParams.get('channel');

      let channelId = channelParam || `listing-${productListing.id}`;

      const marketplaceChannel = client.channel('messaging', channelId, {
        name: productListing.title,
        image: productListing.image,
        members: [users.buyer.id, users.seller.id, 'agent-support'],
        listing_id: productListing.id,
        listing_price: productListing.price,
      });

      await marketplaceChannel.watch();

      // Don't send initial message - channel should be empty
      // Maria will respond after Carlos asks something

      setChannel(marketplaceChannel);

      // Listen for channel deletion/disconnection
      const handleChannelDeleted = () => {
        setChannel(undefined);
      };

      marketplaceChannel.on('channel.deleted', handleChannelDeleted);

      return () => {
        marketplaceChannel.off('channel.deleted', handleChannelDeleted);
      };
    };

    setupChannel();
  }, [client, isAgent, agentToken, isRefreshing]);

  if (!client || isLoadingAgent || isRefreshing) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-yellow-400 to-yellow-500">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">{isRefreshing ? '🔄' : '🛒'}</div>
          <h2 className="text-xl font-bold mb-2">Craft Market Chat Demo</h2>
          <p className="text-yellow-100">
            {isRefreshing 
              ? 'Refreshing...' 
              : isLoadingAgent 
                ? 'Loading agent session...' 
                : 'Connecting...'}
          </p>
          <p className="text-yellow-200 text-sm mt-4 max-w-xs">
            {isRefreshing
              ? 'Please wait while the demo environment is updated...'
              : isLoadingAgent
                ? 'Setting up support agent view...'
                : 'Add your Stream API Key in environment variables'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-100">
      {/* Product Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Product Card */}
        <div className="p-4 border-b border-gray-200">
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <img
              src={productListing.image}
              alt={productListing.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
                {productListing.title}
              </h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold text-gray-900">{productListing.price}</span>
              </div>
              <p className="text-gray-400 text-sm line-through">{productListing.originalPrice}</p>
              <p className="text-green-600 text-sm mt-2">Envío gratis</p>
              <p className="text-gray-500 text-xs mt-2">{productListing.description}</p>
            </div>
          </div>

          {/* Seller Info */}
          <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <img
              src={productListing.seller.image}
              alt={productListing.seller.name}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{productListing.seller.name}</p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="text-yellow-500">★</span>
                <span>{productListing.rating}</span>
                <span>•</span>
                <span>{productListing.sales.toLocaleString()} ventas</span>
              </div>
              <p className="text-xs text-gray-400">{productListing.location}</p>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="p-4 mt-auto">
          <div className="bg-amber-50 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-amber-900 text-sm mb-2">Having an issue?</h4>
            <p className="text-amber-700 text-xs mb-3">
              If you have any problems with this transaction, our support team can help you.
            </p>
            {channel && channel.state && !channel.disconnected && !isRefreshing && <EscalateButton channel={channel} />}
          </div>
          <p className="text-xs text-gray-400 text-center">
            Protected Purchase by Craft Market
          </p>
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col">
        <Chat client={client}>
          {channel && channel.state && !channel.disconnected && !client.disconnected ? (
            <Channel channel={channel} Attachment={ProductAttachment} Message={CustomMessage}>
              <Window>
                <ChannelHeader />
                <MessageList />
                <MessageInput />
              </Window>
              <Thread />
            </Channel>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <div className="text-2xl mb-2">🔄</div>
                <p>Channel is being reset...</p>
                <p className="text-sm mt-2">Refreshing page...</p>
              </div>
            </div>
          )}
        </Chat>
      </main>
    </div>
  );
}
