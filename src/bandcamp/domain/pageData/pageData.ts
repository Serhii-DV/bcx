import type { FanData } from 'src/app/types/FanData';
import { currentPageUrl } from 'src/core/shared';
import type { Url } from 'src/core/url';
import { getJsonFromElementDataAttr } from 'src/utils/utils';
import type { CollectionPageData } from '../types/CollectionPageData';
import type { MusicPageData } from '../types/MusicPageData';
import {
  isBandcampAlbumUrl,
  isBandcampDiscoverUrl,
  isBandcampFeedUrl,
  isBandcampMusicUrl,
  isBandcampTrackUrl,
} from '../url/helper';

export class BandcampPageData {
  private pageData: MusicPageData | CollectionPageData | any = null;

  constructor() {}

  get data(): MusicPageData | CollectionPageData | any {
    return this.load().pageData;
  }

  private load(): this {
    if (this.pageData !== null) {
      return this;
    }

    if (isBandcampDiscoverUrl(currentPageUrl)) {
      this.pageData = getJsonFromElementDataAttr('#DiscoverApp', 'blob');
    } else {
      this.pageData = getJsonFromElementDataAttr(
        '#pagedata',
        'blob',
      ) as MusicPageData;
    }

    console.log('[BandcampPageData] Page Data Loaded:', this.pageData);

    return this;
  }

  get fanData(): FanData {
    this.load();
    return detectFanDataFromPageData(this, currentPageUrl);
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
