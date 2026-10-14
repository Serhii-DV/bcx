export interface RawPriceData {
  amount: number;
  currency: string;
}

export class Price {
  constructor(
    public amount: number,
    public currency: string,
  ) {}

  static create(amount: string | number, currency: string): Price {
    if (typeof amount === 'string') {
      amount = parseFloat(amount);
    }
    return new Price(amount, currency);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  toString(): string {
    return `${this.amount} ${this.currency}`;
  }

  toRawData(): RawPriceData {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }

  static fromRawData(rawData: RawPriceData): Price {
    return Price.create(rawData.amount, rawData.currency);
  }
}
