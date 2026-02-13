export type PageContext = {
  env: string;
  colorScheme: string;
  identity: {
    userId: number;
    adminLevel: number;
    fanId: number;
    fanUsername: string;
    isFanPrivate: boolean;
    isFanVerified: boolean;
    isImpersonating: boolean;
    isLoggedIn: boolean;
    isAdmin: boolean;
  };
  isMobile: boolean;
  pageBand: any; // Use a more specific type if available
  recaptchaPublicKey: string;
  sentryConfig: string;
  fanId: number;
  isAdmin: boolean;
  userId: number;
  isLoggedIn: boolean;
  languages: Record<string, string>;
  bcStrings: any; // Use a more specific type if available
  pageFan: {
    pageFanId: number;
    pageFanUsername: string;
    isCurrentUserPageFan: boolean;
  };
  isPageMobilized: boolean;
  [key: string]: unknown; // For any additional properties
};
