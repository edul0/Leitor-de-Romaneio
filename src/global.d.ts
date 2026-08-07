export {};

declare global {
  interface Window {
    __globalLastDispatched: number;
  }
}
