export {};

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (el?: Element) => void;
        createTimeline: (
          source: { sourceType: string; screenName: string },
          target: Element,
          options?: Record<string, unknown>
        ) => Promise<Element>;
      };
    };
  }
}
