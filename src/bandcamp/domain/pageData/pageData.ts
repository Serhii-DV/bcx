import type { FanData } from 'src/app/types/FanData';
import { currentPageUrl } from 'src/core/shared';
import type { Url } from 'src/core/url';
import {
  isBandcampAlbumUrl,
  isBandcampDiscoverUrl,
  isBandcampFeedUrl,
  isBandcampMusicUrl,
  isBandcampTrackUrl,
} from '../url/helper';

export class BandcampPageData {
  constructor(public data: any = null) {
    console.log('[BandcampPageData]', this.data);
  }

  /** Returns the album ID if available */
  get albumId(): number | null {
    return this.data?.album_id ?? null;
  }

  /** Optional: returns the track ID */
  get trackId(): number | null {
    return this.data?.id ?? null;
  }

  /** Optional: returns the title */
  get title(): string | null {
    return this.data?.title ?? null;
  }

  get fanData(): FanData {
    return detectFanDataFromPageData(this, currentPageUrl);
  }

  static fromPageDataDomElement(): BandcampPageData {
    const jsonString =
      document.getElementById('pagedata')?.dataset.blob ?? '{}';
    const data = JSON.parse(jsonString);
    return new BandcampPageData(data);
  }

  static fromDiscoverAppDomElement(): BandcampPageData {
    const jsonString =
      document.getElementById('DiscoverApp')?.dataset.blob ?? '{}';
    const data = JSON.parse(jsonString);
    return new BandcampPageData(data);
  }

  static load(): BandcampPageData {
    if (isBandcampDiscoverUrl(currentPageUrl)) {
      return BandcampPageData.fromDiscoverAppDomElement();
    }

    return BandcampPageData.fromPageDataDomElement();
  }
}

function detectFanDataFromPageData(
  pageData: BandcampPageData,
  currentPageUrl: Url,
): FanData {
  const data = pageData.data;
  let username: string;
  let name: string;
  let fan_id: number;

  if (isBandcampDiscoverUrl(currentPageUrl)) {
    // We are on the discover page
    username = data.pageContext?.identity?.fanUsername;
    name = username;
    fan_id = data.pageContext?.identity?.fanId;
  } else if (
    isBandcampMusicUrl(currentPageUrl) ||
    isBandcampAlbumUrl(currentPageUrl) ||
    isBandcampTrackUrl(currentPageUrl)
  ) {
    // We are on the music page
    username = data.identities?.fan.username;
    name = data.identities?.fan.name;
    fan_id = data.identities?.fan.fan_id;
  } else if (isBandcampFeedUrl(currentPageUrl)) {
    // We are on the feed page
    username = data.fan_info?.username;
    name = data.fan_info?.name;
    fan_id = data.fan_info?.fan_id;
  } else if (data.active_tab) {
    // We are on the personal user page
    username = data.current_fan?.username;
    name = username;
    fan_id = data.current_fan?.fan_id;
  } else {
    // We are on a regular page
    username = data.fan_data?.username;
    name = data.fan_name;
    fan_id = data.fan_data?.fan_id;
  }

  return { username, name, fan_id };
}
