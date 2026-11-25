import type { RawAlbumData } from 'src/bandcamp/domain/album/data';
import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import {
  localCalendarDay,
  publishedDay,
} from 'src/bandcamp/domain/releaseDate';
import { requestMusicLibrary } from 'src/bandcamp/domain/storage/musicLibrary';
import type { RawTrackData } from 'src/bandcamp/domain/track/data';
import { TrackFactory } from 'src/bandcamp/domain/track/factory';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { TrackTreeItemFactory } from '../factories/TrackTreeItemFactory';
import type { TreeItem } from '../TreeItem';

function createCalendarReleaseItem(
  release: RawAlbumData | RawTrackData,
  today: string,
): TreeItem {
  let item: TreeItem;
  if ('bandId' in release) {
    item = AlbumTreeItemFactory.createWithPreview(
      AlbumFactory.fromRawData(release),
    );
  } else {
    const track = TrackFactory.fromRawData(release);
    item = {
      ...TrackTreeItemFactory.createWithPreview(track),
      label: track.toString(),
      image: track.artwork.tinySizeUrl,
    };
  }
  const day = publishedDay(release.metadata?.published);
  if (day) {
    item.timestamp = {
      label: day > today ? 'Scheduled for' : 'Released',
      dateTime: day,
      dateOnly: true,
    };
  }
  return item;
}

function compareCalendarReleaseDates(a: TreeItem, b: TreeItem): number {
  return (a.timestamp?.dateTime ?? '').localeCompare(
    b.timestamp?.dateTime ?? '',
  );
}

export async function loadCalendarReleases() {
  const today = localCalendarDay();
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 29);
  const { albums, tracks } = await requestMusicLibrary({
    action: 'find-dated-releases',
    since: start.toISOString().slice(0, 10),
  });
  const upcoming: TreeItem[] = [];
  const recent: TreeItem[] = [];

  for (const release of [...albums, ...tracks]) {
    const item = createCalendarReleaseItem(release, today);
    const day = item.timestamp?.dateTime;
    if (!day) continue;
    (day > today ? upcoming : recent).push(item);
  }

  upcoming.sort(compareCalendarReleaseDates);
  recent.sort((a, b) => compareCalendarReleaseDates(b, a));
  return { upcoming, recent };
}
