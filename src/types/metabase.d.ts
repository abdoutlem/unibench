// TypeScript declarations for Metabase web components

declare namespace JSX {
  interface IntrinsicElements {
    'metabase-dashboard': {
      token: string;
      'with-title'?: string | boolean;
      'with-downloads'?: string | boolean;
      style?: React.CSSProperties;
    };
  }
}

declare global {
  interface Window {
    metabaseConfig?: {
      theme?: {
        preset?: string;
      };
      isGuest?: boolean;
      instanceUrl?: string;
    };
    defineMetabaseConfig?: (config: Window['metabaseConfig']) => void;
  }
}

export {};
