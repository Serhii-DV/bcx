import { MainSidePanelSections } from 'src/app/treeview/items/MainSidePanelSections';
import type { SidePanelSection } from 'src/app/treeview/SidePanelSection';
import type { FanData } from 'src/app/types/FanData';
import { Album } from 'src/bandcamp/domain/album/album';
import { AlbumDetails } from 'src/bandcamp/domain/album/details';
import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import type { Band } from 'src/bandcamp/domain/band/band';
import { BandFactory } from 'src/bandcamp/domain/band/factory';
import type { BandPage } from 'src/bandcamp/domain/page/BandPage';
import type { MusicAlbumSchema } from 'src/bandcamp/domain/page/schema';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import {
  isBandcampAlbumUrl,
  isBandcampMusicUrl,
} from 'src/bandcamp/domain/url/helper';
import { MessageType } from 'src/core/message';
import { Url } from 'src/core/url';

export interface ActiveBandcampTab {
  id: number;
  url: string;
  title?: string;
  windowId: number;
}

interface ActiveBandcampTabResponse {
  tab?: ActiveBandcampTab | null;
  error?: string;
}

interface ActiveBandcampPageDataResponse {
  pageData?: ActiveBandcampPageData | null;
  error?: string;
}

interface ActiveBandcampPageData {
  data: any;
  fanData: FanData;
  albumSchema?: MusicAlbumSchema | null;
}

const pageDataByHostname = new Map<string, ActiveBandcampPageData>();

export async function getActiveBandcampTab(): Promise<ActiveBandcampTab | null> {
  const response = (await chrome.runtime.sendMessage({
    type: MessageType.GET_ACTIVE_BANDCAMP_TAB,
  })) as ActiveBandcampTabResponse;

  if (response?.error) {
    throw new Error(response.error);
  }

  return response?.tab ?? null;
}

export async function createActiveTabSidePanelSections(
  tab: ActiveBandcampTab,
): Promise<SidePanelSection[]> {
  const currentPageUrl = Url.create(tab.url);
  const pageData = await getActiveBandcampPageData(currentPageUrl);
  const page = await createBandPage(currentPageUrl, pageData);

  return MainSidePanelSections.create(currentPageUrl, page, {
    includePageData: !!pageData,
    pageData,
  });
}

async function getActiveBandcampPageData(
  currentPageUrl: Url,
): Promise<ActiveBandcampPageData | null> {
  const response = (await chrome.runtime.sendMessage({
    type: MessageType.GET_ACTIVE_BANDCAMP_PAGE_DATA,
  })) as ActiveBandcampPageDataResponse;

  if (response?.error) {
    console.warn('Failed to load Bandcamp page data:', response.error);
  }

  if (response?.pageData) {
    pageDataByHostname.set(currentPageUrl.hostname, response.pageData);
    return response.pageData;
  }

  return pageDataByHostname.get(currentPageUrl.hostname) ?? null;
}

async function createBandPage(
  currentPageUrl: Url,
  pageData: ActiveBandcampPageData | null,
): Promise<BandPage | null> {
  if (isBandcampAlbumUrl(currentPageUrl) && pageData?.albumSchema) {
    const album = AlbumFactory.createFromSchema(pageData.albumSchema);
    const [band] = await BandcampStorage.getBands([album.bandId]);

    return {
      album,
      albumDetails: AlbumDetails.fromMusicAlbumSchema(pageData.albumSchema),
      band: band ?? BandFactory.fromMusicAlbumSchema(pageData.albumSchema),
    };
  }

  const entities = await BandcampStorage.getByUuids(
    getStoredEntityUrlUuids(currentPageUrl),
  );
  const album = entities.find(
    (entity): entity is Album => entity instanceof Album,
  );

  if (album && isBandcampAlbumUrl(currentPageUrl)) {
    const [hydratedAlbum] = await BandcampStorage.getAlbums([album]);
    const [band] = await BandcampStorage.getBands([album.bandId]);

    return {
      album: hydratedAlbum ?? album,
      albumDetails: null,
      band: band ?? null,
    };
  }

  if (isBandcampMusicUrl(currentPageUrl)) {
    const band = await findBandForUrl(currentPageUrl, entities);

    if (band) {
      return {
        album: null,
        albumDetails: null,
        band,
      };
    }
  }

  return null;
}

function getStoredEntityUrlUuids(currentPageUrl: Url): string[] {
  return Array.from(
    new Set([
      currentPageUrl.uuid,
      currentPageUrl.withoutSearch.uuid,
      currentPageUrl.withoutSearchAndHash.uuid,
      currentPageUrl.withoutPathAndSearchAndHash.uuid,
    ]),
  );
}

async function findBandForUrl(
  currentPageUrl: Url,
  entities: Array<Band | Album>,
): Promise<Band | null> {
  const entityBand = entities.find(
    (entity): entity is Band => !(entity instanceof Album),
  );

  if (entityBand) {
    const [hydratedBand] = await BandcampStorage.getBands([entityBand.id]);
    return hydratedBand ?? entityBand;
  }

  const bands = await BandcampStorage.getBands();
  return bands.find((band) => band.url.hasSameHostname(currentPageUrl)) ?? null;
}
