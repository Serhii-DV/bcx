import type { Band } from 'src/bandcamp/domain/band/band';
import { isBandcampMusicUrl } from 'src/bandcamp/domain/url/helper';
import type { Url } from 'src/core/url';
import { BandTreeItemFactory } from '../factories/BandTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import {
  items,
  linkOpen,
  linkOpenPage,
  searchQuery,
  TreeItemBuilder,
} from '../TreeItemBuilder';
import { ICON_INFO, ICON_TAG, ICON_TAGS } from '../utils/icon';
import { withReleaseCatalog } from './releaseCatalog';

export class BandTreeItem {
  static create(
    band: Band,
    currentPageUrl: Url,
    options: { catalogPlaceholders?: boolean } = {},
  ): TreeItem {
    const showAlbumsWithSummary = isBandcampMusicUrl(currentPageUrl);
    const builder = new TreeItemBuilder(
      BandTreeItemFactory.createWithPreview(band),
    );
    builder.withOpen(showAlbumsWithSummary).withoutHref();

    builder.add(linkOpenPage(band.name, band.url.toString()));

    if (band.hasReleases) {
      builder.add(
        items('Artists', []),
        items('Releases', []),
        items('Years', []),
      );
    }
    builder.add(this.createBandTags(band), this.createBandAbout(band));

    const item = builder.build();
    return options.catalogPlaceholders || !band.hasReleases
      ? item
      : withReleaseCatalog(item, band.metadata.releases, { groupByYear: true });
  }

  static createBandTags(band: Band): TreeItem {
    const releasesByTag = new Map<string, Set<string>>();
    const releases = [
      ...band.metadata.albums.map((album) => ({
        key: `album:${album.id}`,
        tags: album.metadata?.keywords ?? [],
      })),
      ...band.metadata.trackReleases.map((track) => ({
        key: `track:${track.id}`,
        tags: track.metadata?.keywords ?? [],
      })),
    ];
    for (const release of releases) {
      for (const tag of release.tags) {
        const matches = releasesByTag.get(tag) ?? new Set<string>();
        matches.add(release.key);
        releasesByTag.set(tag, matches);
      }
    }
    return {
      ...items(
        'Tags',
        [...releasesByTag.keys()].sort().map((tag) => ({
          ...searchQuery(tag).build(),
          childrenCount: releasesByTag.get(tag)?.size ?? 0,
        })),
      )
        .withImage(ICON_TAGS)
        .withChildrenImage(ICON_TAG)
        .asTree()
        .build(),
      hasChildren: true,
    };
  }

  static createBandAbout(band: Band): TreeItem {
    const metadata = band.metadata;
    const about = items('About', [
      ...(metadata.links.length
        ? [
            items(
              'Links',
              metadata.links.map((link) => linkOpen(link.label, link.url)),
            ),
          ]
        : []),
    ])
      .asTree()
      .withImage(ICON_INFO)
      .withoutChildrenCount()
      .build();
    return {
      ...about,
      aboutProfile: {
        id: band.id,
        name: band.name,
        url: band.url.toString(),
        image: band.artwork.id > 0 ? band.artwork.mediumSizeUrl : undefined,
        location: metadata.location || undefined,
        biography: metadata.biography || undefined,
        albumCount: metadata.albums.length,
        trackReleaseCount: metadata.trackReleases.length,
        artistCount: metadata.artistNames.length,
        releaseYears: metadata.years,
        currency: metadata.currency || undefined,
        createdDate: Number.isFinite(metadata.created.getTime())
          ? metadata.created.toISOString().split('T')[0]
          : undefined,
      },
    };
  }
}
