import { Album } from 'src/bandcamp/domain/album/album';
import type { RawAlbumData } from 'src/bandcamp/domain/album/compressor';
import { AlbumDetails } from 'src/bandcamp/domain/album/details';
import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import { Band } from 'src/bandcamp/domain/band/band';
import { BandFactory } from 'src/bandcamp/domain/band/factory';
import { BandMetadata } from 'src/bandcamp/domain/band/metadata';
import type { BandPage } from 'src/bandcamp/domain/page/BandPage';
import type {
  MusicAlbumSchema,
  MusicRecordingSchema,
} from 'src/bandcamp/domain/page/schema';
import { urlCompressor } from 'src/bandcamp/domain/shared';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import type { RawTrackData } from 'src/bandcamp/domain/track/compressor';
import { TrackFactory } from 'src/bandcamp/domain/track/factory';
import { Track } from 'src/bandcamp/domain/track/track';
import type { FanData } from 'src/bandcamp/domain/types/FanData';
import {
  isBandcampAlbumUrl,
  isBandcampMusicUrl,
} from 'src/bandcamp/domain/url/helper';
import { MessageType } from 'src/core/message';
import { Url } from 'src/core/url';
import {
  createSidePanelHeader,
  type SidePanelHeader,
} from 'src/features/bcx/sidePanelHeader';
import { MainSidePanelSections } from 'src/features/treeview/items/MainSidePanelSections';
import type { SidePanelSection } from 'src/features/treeview/SidePanelSection';
import { AlbumSidePanelSection } from 'src/features/treeview/sections/AlbumSidePanelSection';
import { TrackSidePanelSection } from 'src/features/treeview/sections/TrackSidePanelSection';
import type { PageDataContext } from 'src/features/treeview/sections/types';

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
  bandProfile?: Pick<BandMetadata, 'location' | 'biography' | 'links'>;
  data: any;
  fanData: FanData;
  albumSchema?: MusicAlbumSchema | null;
  trackSchema?: MusicRecordingSchema | null;
  musicBand?: ActiveMusicBandData | null;
}

interface ActiveMusicBandData {
  id: number;
  name: string;
  url: string;
  artworkId: number;
  metadata: {
    created: string;
    currency: string;
  };
  albums: RawAlbumData[];
  tracks: RawTrackData[];
}

const pageDataByHostname = new Map<string, ActiveBandcampPageData>();
let lastFanPageContext: PageDataContext | null = null;

export async function getActiveBandcampTab(): Promise<ActiveBandcampTab | null> {
  const response = (await chrome.runtime.sendMessage({
    type: MessageType.GET_ACTIVE_BANDCAMP_TAB,
  })) as ActiveBandcampTabResponse;

  if (response?.error) {
    throw new Error(response.error);
  }

  return response?.tab ?? null;
}

export async function createActiveTabSidePanelData(
  tab: ActiveBandcampTab | null,
): Promise<{ sections: SidePanelSection[]; header: SidePanelHeader | null }> {
  const currentPageUrl = Url.create(tab?.url ?? 'https://bandcamp.com/');
  const pageData = tab ? await getActiveBandcampPageData(currentPageUrl) : null;
  const page = tab ? await createBandPage(currentPageUrl, pageData) : null;
  if (page?.band && pageData?.bandProfile) {
    Object.assign(page.band.metadata, pageData.bandProfile);
  }

  // Fan sections belong to the user, whereas album/band data belongs to the page.
  // Keep the former available while a new hostname's content script starts.
  if (pageData) {
    lastFanPageContext = { data: pageData.data, fanData: pageData.fanData };
  }
  const fanPageContext = pageData ??
    (tab ? lastFanPageContext : null) ?? {
      data: {},
      fanData: lastFanPageContext?.fanData ?? {
        username: '',
        name: '',
        fan_id: 0,
      },
    };

  return {
    sections: await MainSidePanelSections.create(currentPageUrl, page, {
      pageData: fanPageContext,
    }),
    header: createSidePanelHeader(currentPageUrl, page, pageData?.trackSchema),
  };
}

export async function getActiveTabHeader(
  tab: ActiveBandcampTab,
): Promise<SidePanelHeader | null> {
  return (await getActiveTabPageContext(tab)).header;
}

export async function getActiveTabPageContext(tab: ActiveBandcampTab): Promise<{
  header: SidePanelHeader | null;
  releaseSection: SidePanelSection | null;
}> {
  const url = Url.create(tab.url);
  const pageData = await getActiveBandcampPageData(url);
  const page = await createBandPage(url, pageData);
  return {
    header: createSidePanelHeader(url, page, pageData?.trackSchema),
    releaseSection:
      AlbumSidePanelSection.create(
        page?.album ?? null,
        page?.albumDetails ?? null,
      ) ?? (await TrackSidePanelSection.create(url, pageData?.trackSchema)),
  };
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
  if (
    isBandcampAlbumUrl(currentPageUrl) &&
    pageData?.albumSchema?.mainEntityOfPage ===
      currentPageUrl.withoutSearchAndHash.toString()
  ) {
    const album = AlbumFactory.createFromSchema(pageData.albumSchema);
    const [band] = await BandcampStorage.getBands([album.bandId]);

    return {
      album,
      albumDetails: AlbumDetails.fromMusicAlbumSchema(pageData.albumSchema),
      band: band ?? BandFactory.fromMusicAlbumSchema(pageData.albumSchema),
    };
  }

  if (isBandcampMusicUrl(currentPageUrl) && pageData?.musicBand) {
    return {
      album: null,
      albumDetails: null,
      band: createBandFromActiveMusicData(pageData.musicBand),
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

function createBandFromActiveMusicData(data: ActiveMusicBandData): Band {
  const albums = data.albums.map((album) => AlbumFactory.fromRawData(album));
  const tracks = data.tracks.map((track) => TrackFactory.fromRawData(track));

  return Band.create(
    data.id,
    data.name,
    data.url,
    data.artworkId,
    BandMetadata.create(
      data.metadata.created,
      data.metadata.currency,
      albums,
      tracks,
    ),
  );
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
  entities: Array<Band | Album | Track>,
): Promise<Band | null> {
  const entityBand = entities.find(
    (entity): entity is Band => entity instanceof Band,
  );

  if (entityBand) {
    const [hydratedBand] = await BandcampStorage.getBands([entityBand.id]);
    return hydratedBand ?? entityBand;
  }

  const bands = await BandcampStorage.getAllCompressedBandData();
  const match = bands.find((band) => {
    if (typeof band.u !== 'string') return false;
    try {
      return Url.create(urlCompressor.decompress(band.u)).hasSameHostname(
        currentPageUrl,
      );
    } catch {
      return false;
    }
  });
  if (!match || !Number.isSafeInteger(match.i) || match.i <= 0) return null;
  return (await BandcampStorage.getBands([match.i]))[0] ?? null;
}
