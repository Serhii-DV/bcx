import type { BandPage } from 'src/bandcamp/domain/page/BandPage';
import type { MusicRecordingSchema } from 'src/bandcamp/domain/page/schema';
import {
  isBandcampAlbumUrl,
  isBandcampMusicUrl,
  isBandcampTrackUrl,
} from 'src/bandcamp/domain/url/helper';
import type { Url } from 'src/core/url';

export interface SidePanelHeader {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  band?: { name: string; href: string; imageUrl?: string };
}

export function createSidePanelHeader(
  url: Url,
  page: BandPage | null,
  track?:
    | (Pick<
        MusicRecordingSchema,
        'mainEntityOfPage' | 'name' | 'byArtist' | 'image'
      > & {
        publisher?: Pick<MusicRecordingSchema['publisher'], 'name' | 'image'>;
      })
    | null,
): SidePanelHeader | null {
  if (
    isBandcampTrackUrl(url) &&
    track?.mainEntityOfPage === url.withoutSearchAndHash.toString()
  ) {
    return {
      title: track.name,
      subtitle: track.byArtist.name,
      imageUrl: track.image || undefined,
      band: track.publisher
        ? {
            name: track.publisher.name,
            href: url.withoutPathAndSearchAndHash.toString(),
            imageUrl: track.publisher.image || undefined,
          }
        : undefined,
    };
  }
  const album = page?.album;
  if (
    isBandcampAlbumUrl(url) &&
    album?.url.withoutSearchAndHash.toString() ===
      url.withoutSearchAndHash.toString()
  ) {
    return {
      title: album.title,
      subtitle: album.artist.toString(),
      imageUrl: album.artwork.id > 0 ? album.artwork.smallSizeUrl : undefined,
      band: page?.band
        ? {
            name: page.band.name,
            href: url.withoutPathAndSearchAndHash.toString(),
            imageUrl:
              page.band.artwork.id > 0
                ? page.band.artwork.smallSizeUrl
                : undefined,
          }
        : undefined,
    };
  }
  const band = page?.band;
  if (isBandcampMusicUrl(url) && band?.url.hasSameHostname(url)) {
    return {
      title: band.name,
      imageUrl: band.artwork.id > 0 ? band.artwork.smallSizeUrl : undefined,
    };
  }
  return null;
}
