export interface RawData {
  [key: string]:
    | string
    | string[]
    | number
    | number[]
    | boolean
    | RawData
    | RawData[]
    | undefined;
}

export interface CompressedData {
  [key: string]:
    | string
    | string[]
    | number
    | number[]
    | boolean
    | CompressedData
    | CompressedData[]
    | undefined;
}

export interface Compressor<T, U> {
  compress(value: T): U;
  decompress(value: U): T;
}

export interface RawDataCompressor
  extends Compressor<RawData, CompressedData> {}
export interface StringCompressor extends Compressor<string, string> {}

export interface Compressable {
  get compressor(): RawDataCompressor;
  toRawData(): RawData;
}

export function compress(compressable: Compressable): CompressedData {
  const compressedData = compressable.compressor.compress(
    compressable.toRawData(),
  );
  return removeUndefined(compressedData);
}

export function decompress(
  compressedData: CompressedData,
  compressor: RawDataCompressor,
): RawData {
  return compressor.decompress(compressedData);
}

// Remove undefined values recursively
function removeUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined).filter((item) => item !== undefined);
  }

  if (obj && typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        const cleanedValue = removeUndefined(value);
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return cleaned;
  }

  return obj;
}
