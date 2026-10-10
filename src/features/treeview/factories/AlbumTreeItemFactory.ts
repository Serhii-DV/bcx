import type { Album } from 'src/bandcamp/domain/album/album';
import { AlbumDetails } from 'src/bandcamp/domain/album/details';
import { groupAlbumsByArtist } from 'src/bandcamp/domain/album/helper';
import { ArtworkSize } from 'src/bandcamp/domain/artwork/artworkSize';
import { readCurrentLists } from 'src/bandcamp/domain/fanData/library';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { openUrlInActiveTab } from 'src/core/extensionActions';
import { TreeItemButtonFactory } from '../buttons/factory';
import { ArtistTreeItem } from '../items/ArtistTreeItem';
import {
  createReleaseDetailsTree,
  createReleaseInformation,
  ReleasePreview,
  releaseCollectionStatus,
} from '../ReleasePreview';
import { TreeData } from '../TreeData';
import { type TreeItem } from '../TreeItem';
import {
  builder,
  copyable,
  item,
  items,
  linkOpen,
  linkOrText,
  list,
  searchQuery,
  TreeItemBuilder,
  text,
} from '../TreeItemBuilder';
import {
  ICON_BUILDING,
  ICON_CALENDAR_DAYS,
  ICON_CLIPBOARD,
  ICON_DISC,
  ICON_FUNNEL,
  ICON_LINK,
  ICON_LIST_MUSIC,
  ICON_MIC,
  ICON_TAG,
  ICON_TAGS,
} from '../utils/icon';
import { TrackTreeItemFactory } from './TrackTreeItemFactory';

export class AlbumTreeItemFactory {
  static create(album: Album): TreeItem {
    return linkOrText(album.toString(), album.url?.toString())
      .withImage(album.artwork.tinySizeUrl)
      .withKeywords(album.artistNames)
      .build();
  }

  static createWithPreview(
    album: Album,
    fanId?: number,
    options: { showReleaseDate?: boolean; releaseDate?: string } = {},
  ): TreeItem {
    const information = createReleaseInformation(album);
    const releaseDate = options.releaseDate ?? information.date;
    const published = releaseDate ? new Date(releaseDate) : undefined;
    return {
      ...this.create(album),
      entityId: album.id,
      timestamp:
        options.showReleaseDate &&
        published &&
        Number.isFinite(published.getTime())
          ? { label: 'Released', dateTime: published.toISOString() }
          : undefined,
      previewImage:
        album.artwork.id > 0
          ? (album.artwork.getUrl(ArtworkSize.LARGE) ?? undefined)
          : undefined,
      previewInformation: information,
      actionIcon: undefined,
      buttons: [
        {
          ...TreeItemButtonFactory.createExternalLink(
            `Open\n${album.url}`,
            album.url.toString(),
          ),
          onClick: () => {
            void openUrlInActiveTab(album.url.toString()).then((opened) => {
              if (!opened) window.location.assign(album.url.toString());
            });
          },
        },
      ],
      loadPreview: async () => {
        const [[stored], lists] = await Promise.all([
          BandcampStorage.getAlbumsRawDataByIds([album.id]).then((saved) =>
            saved.length ? BandcampStorage.getAlbums([album], saved) : [],
          ),
          readCurrentLists(['collection', 'wishlist'], fanId),
        ]);
        const information = createReleaseInformation(stored ?? album);
        const baseTree = new TreeData(
          stored
            ? [
                items(
                  'Tracks',
                  TrackTreeItemFactory.createMany(stored.tracks),
                ).build(),
              ]
            : [],
        );
        information.collectionStatus = releaseCollectionStatus(
          album,
          lists.collection,
          lists.wishlist,
        );
        return new ReleasePreview(
          createReleaseDetailsTree(baseTree, information, album.url.toString()),
          information,
        );
      },
    };
  }

  static createWithSummary(album: Album): TreeItem {
    const builder = this.builder(album)
      .withId(album.url.toString())
      .withoutLink()
      .withoutChildrenCount()
      .asTree();
    const artistNames = [...album.artistNames].sort();
    const keywords = [...(album.metadata?.keywords || [])].sort();
    const displayTitle = album.toString();

    builder.add(
      linkOpen(`Open release: ${displayTitle}`, album.url.toString()),
      text('Filter')
        .add(
          ...artistNames.map((artistName) => searchQuery(artistName)),
          searchQuery(displayTitle),
          album.metadata ? searchQuery(String(album.metadata.year)) : undefined,
          ...keywords.map((keyword) => searchQuery(keyword)),
        )
        .withImage(ICON_FUNNEL),
      text('Copy')
        .add(
          ...artistNames.map((artistName) =>
            copyable(`Artist name: ${artistName}`, artistName),
          ),
          copyable(`Release title: ${album.title}`, album.title),
          copyable(`Release full title: ${displayTitle}`, displayTitle),
          copyable(`Release URL: ${album.url}`, album.url.toString()).withImage(
            ICON_LINK,
          ),
        )
        .withImage(ICON_CLIPBOARD),
    );

    if (artistNames.length) {
      builder.add(
        items(
          'Artists',
          artistNames.map((artistName) => searchQuery(artistName)),
        )
          .withImage(ICON_MIC)
          .build(),
      );
    }

    if (album.metadata) {
      builder.add(
        searchQuery(String(album.metadata.year)).withImage(ICON_CALENDAR_DAYS),
      );
    }

    if (keywords.length) {
      builder.add(
        items(
          'Tags',
          keywords.map((keyword) => searchQuery(keyword).withImage(ICON_TAG)),
        )
          .withImage(ICON_TAGS)
          .build(),
      );
    }

    return builder.build();
  }

  static fromAlbums(albums: Album[], withSummary: boolean = false): TreeItem[] {
    return albums.map((album) =>
      withSummary
        ? this.createWithSummary(album)
        : this.createWithPreview(album),
    );
  }

  static fromAlbumsByArtistReleases(
    albums: Album[],
    withSummary: boolean = false,
  ): TreeItem[] {
    return [...groupAlbumsByArtist(albums)].map(([artist, releases]) =>
      items(artist, this.fromAlbums(releases, withSummary)).build(),
    );
  }

  static createArtistsTreeItem(
    albums: Album[],
    withSummary: boolean = false,
  ): TreeItem {
    return items(
      'Artists',
      this.fromAlbumsByArtistReleases(albums, withSummary),
    )
      .withImage(ICON_MIC)
      .withChildrenImage(ICON_MIC)
      .build();
  }

  static createReleasesTreeItem(
    albums: Album[],
    withSummary: boolean = false,
  ): TreeItem {
    return items('Releases', this.fromAlbums(albums, withSummary))
      .withImage(ICON_DISC)
      .build();
  }

  static async createWithDetails(details: AlbumDetails): Promise<TreeItem> {
    const builder = this.detailsBuilder(details);
    const artistItems = await ArtistTreeItem.createTreeItems(details.artist);

    builder.add(
      text('Copy')
        .add(
          copyable(`Artist name: ${details.artist}`, details.artist.toString()),
          copyable(`Release title: ${details.title}`, details.title),
          copyable(
            `Release full title: ${details.displayTitle}`,
            details.displayTitle,
          ),
          copyable(`Release URL: ${details.url}`, details.url).withImage(
            ICON_LINK,
          ),
        )
        .withImage(ICON_CLIPBOARD),
    );
    builder.add(items(`${details.artist}`, artistItems).withImage(ICON_MIC));

    if (details.releaseMetadata.artistNames?.length) {
      builder.add(
        list('Parsed artists', details.releaseMetadata.artistNames).withImage(
          ICON_MIC,
        ),
      );
    }

    if (details.publisher) {
      builder.add(
        items(`Publisher: ${details.publisher}`, [
          text(details.publisher).makeCopyable(),
        ]).withImage(ICON_BUILDING),
      );
    }

    const year = details.year;

    if (year) {
      builder.add(
        items(`${year}`, [
          text(`Published Date: ${details.publishedDate}`).withImage(
            ICON_CALENDAR_DAYS,
          ),
          text(`Modified Date: ${details.modifiedDate}`).withImage(
            ICON_CALENDAR_DAYS,
          ),
        ]).withImage(ICON_CALENDAR_DAYS),
      );
    }

    if (details.releaseMetadata.catalogNumber) {
      builder.add(text(`Catalog: ${details.releaseMetadata.catalogNumber}`));
    }

    if (details.releaseMetadata.releaseType) {
      builder.add(text(`Type: ${details.releaseMetadata.releaseType}`));
    }

    builder.add(
      items(
        'Tracks',
        TrackTreeItemFactory.createMany(details.tracks),
      ).withImage(ICON_LIST_MUSIC),
    );

    builder.add(
      list('Tags', details.tags)
        .withImage(ICON_TAGS)
        .withChildrenImage(ICON_TAG),
    );

    return builder.asTree().build();
  }

  private static builder(album: Album): TreeItemBuilder {
    return builder(this.createWithPreview(album));
  }

  private static detailsBuilder(details: AlbumDetails): TreeItemBuilder {
    return item(details.displayTitle)
      .withImage(details.artwork.tinySizeUrl)
      .withKeywords(details.artist.names);
  }
}
