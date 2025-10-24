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

export interface Compressor {
  compress(data: RawData): CompressedData;
  decompress(data: CompressedData): RawData;
}

export interface Compressable {
  readonly compressor: Compressor;
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
  compressor: Compressor,
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
