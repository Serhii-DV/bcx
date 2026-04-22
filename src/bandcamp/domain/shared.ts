import { AlbumDataCompressor } from './album/compressor';
import { BandDataCompressor } from './band/compressor';
import { BandMetadataCompressor } from './band/metadataCompressor';
import { MetadataCompressor } from './metadataCompressor';
import { BandcampPageData } from './pageData/pageData';
import { PriceDataCompressor } from './priceCompressor';
import { TrackDataCompressor } from './track/compressor';
import { UrlCompressor } from './url/compressor';

export const bandcampPageData = new BandcampPageData();
export const urlCompressor = new UrlCompressor();
export const priceDataCompressor = new PriceDataCompressor();
export const metadataCompressor = new MetadataCompressor(priceDataCompressor);
export const bandMetadataCompressor = new BandMetadataCompressor();
export const bandDataCompressor = new BandDataCompressor(
  urlCompressor,
  bandMetadataCompressor,
);
export const albumDataCompressor = new AlbumDataCompressor(
  urlCompressor,
  metadataCompressor,
);
export const trackDataCompressor = new TrackDataCompressor(
  urlCompressor,
  metadataCompressor,
);
