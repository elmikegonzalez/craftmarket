import MarketplaceChat from '@/components/MarketplaceChat';

export default function Home() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Craft Market</h1>
          <span className="text-sm opacity-75">|</span>
          <span className="text-sm">Purchase Chat</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="bg-yellow-300 px-3 py-1 rounded-full text-xs font-medium">
            Demo - Stream Chat Integration
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <MarketplaceChat />
      </main>
    </div>
  );
}
