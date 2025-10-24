import type { StorageObject } from 'src/core/storage';
import { removeInvisibleChars, trim } from 'src/utils/string';
import { Url } from '../url';
import { Band } from './band';
import { BandDataCompressor } from './compressor';
import { BandMetadata } from './metadata';

export class BandFactory {
  static create(
    id: number,
    name: string,
    url: Url,
    metadata: BandMetadata,
  ): Band {
    return new Band(id, name, url, metadata);
  }

  static fromRawData(
    id: string | number,
    name: string,
    url: string | Url,
    metadata: BandMetadata,
  ): Band {
    const bandId = typeof id === 'string' ? parseInt(id, 10) : id;
    const bandName = trim(removeInvisibleChars(name), ' -\n');
    const bandUrl = url instanceof Url ? url : new Url(url);

    return new Band(bandId, bandName, bandUrl, metadata);
  }

  static fromStorage(data: StorageObject): Band {
    const bandData = BandDataCompressor.decompress(data as any);
    return BandFactory.fromRawData(
      bandData.id,
      bandData.name,
      bandData.url,
      BandMetadata.fromStorageObject(bandData.metadata),
    );
  }
}
