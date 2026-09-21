import { releaseLink } from 'src/bandcamp/domain/album/releaseNotes';
import { BandcampStorage } from 'src/bandcamp/domain/storage';

export interface BandPreview {
  id?: number;
  following?: boolean;
  name: string;
  url: string;
  image?: string;
  location?: string;
  cached: boolean;
  biography?: string;
  tags?: string[];
  albumCount?: number;
  trackReleaseCount?: number;
  links?: { label: string; url: string }[];
}

export async function loadBandPreview(
  fallback: BandPreview,
): Promise<BandPreview> {
  if (fallback.id === undefined) return fallback;
  const [band] = await BandcampStorage.getBands([fallback.id]);
  if (!band) return fallback;
  const metadata = band.metadata;
  return {
    ...fallback,
    name: band.name,
    image: band.artwork.id > 0 ? band.artwork.mediumSizeUrl : fallback.image,
    cached: true,
    location: metadata.location || fallback.location,
    biography: metadata.biography,
    tags: metadata.keywords,
    albumCount: metadata.albums.length,
    trackReleaseCount: metadata.trackReleases.length,
    links: metadata.links.flatMap((link) => {
      const url = releaseLink(link.url);
      return url ? [{ label: link.label, url }] : [];
    }),
  };
}
