import 'stream-chat';

declare module 'stream-chat' {
  interface CustomChannelData {
    name?: string;
    image?: string;
    listing_id?: string;
    listing_price?: string;
  }
}
