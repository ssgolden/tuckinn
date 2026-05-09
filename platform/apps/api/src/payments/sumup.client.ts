export interface SumUpCheckout {
  id: string;
  checkout_reference: string;
  amount: number;
  currency: string;
  merchant_code: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  redirect_url?: string;
  description?: string;
}

export class SumUpClient {
  private readonly baseUrl = 'https://api.sumup.com/v0.1';

  constructor(private readonly apiKey: string) {}

  async createCheckout(params: {
    checkout_reference: string;
    amount: number;
    currency: string;
    merchant_code: string;
    description?: string;
    redirect_url?: string;
  }): Promise<SumUpCheckout> {
    const response = await fetch(`${this.baseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`SumUp createCheckout ${response.status}: ${body}`);
    }

    return response.json() as Promise<SumUpCheckout>;
  }

  async getCheckout(id: string): Promise<SumUpCheckout> {
    const response = await fetch(`${this.baseUrl}/checkouts/${id}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`SumUp getCheckout ${response.status}: ${body}`);
    }

    return response.json() as Promise<SumUpCheckout>;
  }
}
