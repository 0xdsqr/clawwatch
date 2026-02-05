export {};

declare global {
  interface Window {
    __CLAWATCH_CONFIG__?: {
      convexUrl?: string;
    };
  }
}
