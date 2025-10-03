import type { HasStorageObject, StorageObject } from 'src/core/storage';

export class Price implements HasStorageObject {
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

  toStorageObject(): StorageObject {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }

  static fromStorageObject(data: StorageObject): Price {
    return Price.create(data.amount, data.currency);
  }
}
