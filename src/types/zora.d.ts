declare module '@zoralabs/coins-sdk' {
    export function setApiKey(apiKey: string): void;
    
    // Add other exports you might use from the SDK
    // You can expand this as you discover more functions/types
    export const coins: any;
    export const wallet: any;
    
    // Generic catch-all for any other exports
    export * from '@zoralabs/coins-sdk';
  }