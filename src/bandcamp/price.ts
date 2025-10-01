import type { HasStorageObject, StorageObject } from 'src/core/storage';

export class Price implements HasStorageObject {
  constructor(
    public amount: number,
    public currency: string,
  ) {}

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
    return new Price(data.amount, data.currency);
  }
}
