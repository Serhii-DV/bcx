import type { BandPage } from 'src/bandcamp/domain/page/BandPage';
import type { Url } from 'src/core/url';
import type { FanData } from '../../types/FanData';
import type { SidePanelSection } from '../SidePanelSection';

export interface PageDataContext {
  data: any;
  fanData: FanData;
}

export type PendingSidePanelSection = Omit<SidePanelSection, 'id'>;

export interface SidePanelSectionsContext {
  album: BandPage['album'] | null;
  albumDetails: BandPage['albumDetails'] | null;
  band: BandPage['band'] | null;
  currentPageUrl: Url;
  includePageData: boolean;
  pageDataContext: PageDataContext | null;
  userKeyPart: string;
}
