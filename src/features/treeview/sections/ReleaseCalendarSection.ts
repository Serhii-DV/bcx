import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import { localCalendarDay } from 'src/bandcamp/domain/releaseDate';
import { requestMusicLibrary } from 'src/bandcamp/domain/storage/musicLibrary';
import { TrackFactory } from 'src/bandcamp/domain/track/factory';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { TrackTreeItemFactory } from '../factories/TrackTreeItemFactory';
import type { SidePanelSection } from '../SidePanelSection';
import type { TreeItem } from '../TreeItem';
import { ICON_CALENDAR_DAYS, ICON_HISTORY } from '../utils/icon';
import { createTreeDataFromTreeItemChildren } from './treeDataFactory';

export const RELEASE_CALENDAR_ID = 'release-calendar';

export const releaseCalendarSection: SidePanelSection = {
  id: RELEASE_CALENDAR_ID,
  label: 'Release Calendar',
  image: ICON_CALENDAR_DAYS,
  rootNavigation: 'tabs',
  createTreeData: async () => {
    const today = localCalendarDay();
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - 29);
    const { albums, tracks } = await requestMusicLibrary({
      action: 'find-dated-releases',
      since: start.toISOString().slice(0, 10),
    });
    const releases = [
      ...albums.map((raw) =>
        AlbumTreeItemFactory.createWithPreview(AlbumFactory.fromRawData(raw)),
      ),
      ...tracks.map((raw) => {
        const track = TrackFactory.fromRawData(raw);
        return {
          ...TrackTreeItemFactory.createWithPreview(track),
          label: track.toString(),
          image: track.artwork.tinySizeUrl,
        };
      }),
    ];
    const upcoming: TreeItem[] = [];
    const recent: TreeItem[] = [];

    for (const release of releases) {
      const day = release.previewInformation?.date;
      if (!day) continue;
      const isUpcoming = day > today;
      (isUpcoming ? upcoming : recent).push({
        ...release,
        timestamp: {
          label: isUpcoming ? 'Scheduled for' : 'Released',
          dateTime: day,
          dateOnly: true,
        },
      });
    }

    const byDate = (a: TreeItem, b: TreeItem) =>
      (a.timestamp?.dateTime ?? '').localeCompare(b.timestamp?.dateTime ?? '');
    upcoming.sort(byDate);
    recent.sort((a, b) => byDate(b, a));

    return createTreeDataFromTreeItemChildren({
      children: [
        {
          label: 'Upcoming',
          image: ICON_CALENDAR_DAYS,
          hasChildren: true,
          children: upcoming,
        },
        {
          label: 'Recently Released',
          image: ICON_HISTORY,
          hasChildren: true,
          children: recent,
        },
      ],
    });
  },
};
