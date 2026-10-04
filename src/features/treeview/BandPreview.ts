import { releaseLink } from 'src/bandcamp/domain/album/releaseNotes';
import { ArtworkSize } from 'src/bandcamp/domain/artwork/artworkSize';
import { Band } from 'src/bandcamp/domain/band/band';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import type { Url } from 'src/core/url';
import { BandTreeItem } from './items/BandTreeItem';
import { createBandTreeData } from './sections/BandSidePanelSection';
import type { TreeData } from './TreeData';
import type { TreeItem } from './TreeItem';
import { items, linkOpen, text } from './TreeItemBuilder';

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

export async function loadBandDetails(
  fallback: BandPreview,
): Promise<{ about: TreeItem; treeData?: TreeData }> {
  if (fallback.id !== undefined) {
    const [band] = await BandcampStorage.getBands([fallback.id]);
    if (band) {
      const about = BandTreeItem.createBandAbout(band);
      return {
        about: {
          ...about,
          aboutProfile: {
            ...about.aboutProfile,
            name: band.name,
            following: fallback.following,
          },
        },
        treeData: createBandTreeData(band),
      };
    }
  }

  return { about: createBandAboutFallback(fallback) };
}

export async function loadBandAbout(fallback: BandPreview): Promise<TreeItem> {
  return (await loadBandDetails(fallback)).about;
}

export function createBandAboutFallback(fallback: BandPreview): TreeItem {
  return {
    ...items('About', [
      ...(fallback.links?.length
        ? [
            items(
              'Links',
              fallback.links.map((link) => linkOpen(link.label, link.url)),
            ),
          ]
        : []),
      ...(!fallback.cached
        ? [
            text(
              'No saved band details yet. Open the band’s Bandcamp page to explore its catalog.',
            ),
          ]
        : []),
    ])
      .asTree()
      .build(),
    aboutProfile: {
      name: fallback.name,
      url: fallback.url,
      image: fallback.image,
      location: fallback.location,
      biography: fallback.biography,
      following: fallback.following,
    },
  };
}

export async function loadBandLinkProfile(
  url: Url,
): Promise<Pick<BandPreview, 'name' | 'image'> | undefined> {
  const [band] = await BandcampStorage.getByUuids([
    BandcampUrlFactory.createBandUrl(url).uuid,
  ]);
  if (!(band instanceof Band)) return undefined;
  return {
    name: band.name,
    image:
      band.artwork.id > 0
        ? (band.artwork.getUrl(ArtworkSize.SMALL) ?? undefined)
        : undefined,
  };
}
