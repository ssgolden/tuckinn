interface SumUpCardWidget {
  mount(config: {
    checkoutId: string;
    onResponse?: (type: 'sent' | 'invalid' | 'auth-screen' | 'success' | 'fail' | 'error', body: unknown) => void;
    onLoad?: () => void;
    showSubmitButton?: boolean;
    showEmail?: boolean;
    email?: string;
    locale?: string;
    amount?: string;
    currency?: string;
  }): { submit(): void; unmount(): void; update(config: Record<string, unknown>): void };
  unmount(): void;
}

declare global {
  interface Window {
    SumUpCard: SumUpCardWidget;
  }
}

export {};
