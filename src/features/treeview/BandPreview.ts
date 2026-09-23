import { releaseLink } from 'src/bandcamp/domain/album/releaseNotes';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { BandTreeItem } from './items/BandTreeItem';
import type { TreeItem } from './TreeItem';
import { copyable, items, linkOpenPage, text } from './TreeItemBuilder';

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

export async function loadBandAbout(fallback: BandPreview): Promise<TreeItem> {
  if (fallback.id !== undefined) {
    const [band] = await BandcampStorage.getBands([fallback.id]);
    if (band) {
      const about = BandTreeItem.createBandAbout(band);
      return {
        ...about,
        aboutProfile: {
          ...about.aboutProfile,
          name: band.name,
          following: fallback.following,
        },
      };
    }
  }

  return createBandAboutFallback(fallback);
}

export function createBandAboutFallback(fallback: BandPreview): TreeItem {
  return {
    ...items('About', [
      ...(fallback.location ? [text(`Location: ${fallback.location}`)] : []),
      linkOpenPage('Open Bandcamp catalog', fallback.url),
      copyable('Copy Bandcamp URL', fallback.url),
      text(
        'No saved band details yet. Open the band’s Bandcamp page to explore its catalog.',
      ),
    ])
      .asTree()
      .build(),
    aboutProfile: {
      name: fallback.name,
      image: fallback.image,
      location: fallback.location,
      following: fallback.following,
    },
  };
}
