export class Artist {
  constructor(
    public readonly names: string[],
    public readonly joins: string[] = [],
  ) {}

  toString(): string {
    return this.toArray().join(' ');
  }

  toArray(): string[] {
    const result: string[] = [];
    for (let i = 0; i < this.names.length; i++) {
      result.push(this.names[i]);
      if (i < this.joins.length) {
        result.push(this.joins[i]);
      }
    }
    return result;
  }
}
