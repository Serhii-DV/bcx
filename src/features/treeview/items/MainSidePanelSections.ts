import type { BandPage } from 'src/bandcamp/domain/page/BandPage';
import { bandcampPageData } from 'src/bandcamp/domain/shared';
import type { Url } from 'src/core/url';
import { console } from 'src/utils/console';
import type { SidePanelSection } from '../SidePanelSection';
import { AlbumSidePanelSection } from '../sections/AlbumSidePanelSection';
import { BandSidePanelSection } from '../sections/BandSidePanelSection';
import { CollectionSidePanelSection } from '../sections/CollectionSidePanelSection';
import { FanSidePanelSection } from '../sections/FanSidePanelSection';
import { FollowingBandsSidePanelSection } from '../sections/FollowingBandsSidePanelSection';
import { FollowingGenresSidePanelSection } from '../sections/FollowingGenresSidePanelSection';
import { HistorySidePanelSection } from '../sections/HistorySidePanelSection';
import type { PageDataContext } from '../sections/types';
import { WishlistSidePanelSection } from '../sections/WishlistSidePanelSection';

export class MainSidePanelSections {
  static async create(
    currentPageUrl: Url,
    page: BandPage | null,
    options: {
      includePageData?: boolean;
      pageData?: PageDataContext | null;
    } = {},
  ): Promise<SidePanelSection[]> {
    const includePageData = options.includePageData ?? true;
    const pageDataContext = options.pageData ?? bandcampPageData;
    const band = page?.band || null;
    const album = page?.album || null;
    const albumDetails = page?.albumDetails || null;
    const logLabel = `[MainSidePanelSections.create]`;
    console.log(logLabel, { currentPageUrl, page, band, album, albumDetails });
    console.time(logLabel);

    const sections: SidePanelSection[] = [];

    function addSection(section?: SidePanelSection | null) {
      if (!section) {
        return;
      }

      sections.push(section);
    }

    function addSections(nextSections: SidePanelSection[]) {
      nextSections.forEach(addSection);
    }

    addSection(AlbumSidePanelSection.create(album, albumDetails));
    addSection(BandSidePanelSection.create(band, currentPageUrl));
    if (includePageData && pageDataContext) {
      addSections(createPageDataSections(pageDataContext));
    }
    addSection(HistorySidePanelSection.create());

    console.timeEnd(logLabel);

    return sections;
  }
}

function createPageDataSections(
  pageDataContext: PageDataContext,
): SidePanelSection[] {
  const userKeyPart = getUserKeyPart(pageDataContext);
  return [
    FanSidePanelSection.create(pageDataContext, userKeyPart),
    FollowingBandsSidePanelSection.create(pageDataContext, userKeyPart),
    FollowingGenresSidePanelSection.create(pageDataContext, userKeyPart),
    CollectionSidePanelSection.create(pageDataContext, userKeyPart),
    WishlistSidePanelSection.create(pageDataContext, userKeyPart),
  ].filter((section): section is SidePanelSection => !!section);
}

function getUserKeyPart(pageDataContext: PageDataContext): string {
  return String(
    pageDataContext?.fanData?.username ||
      pageDataContext?.fanData?.fan_id ||
      'anonymous',
  );
}
