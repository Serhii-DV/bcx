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
import type {
  PageDataContext,
  PendingSidePanelSection,
  SidePanelSectionsContext,
} from '../sections/types';
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

    const userKeyPart = getUserKeyPart(includePageData, pageDataContext);
    const context: SidePanelSectionsContext = {
      album,
      albumDetails,
      band,
      currentPageUrl,
      includePageData,
      pageDataContext,
      userKeyPart,
    };
    const sections: PendingSidePanelSection[] = [];

    function addSection(section?: PendingSidePanelSection | null) {
      if (!section) {
        return;
      }

      sections.push(section);
    }

    function addSections(nextSections: PendingSidePanelSection[]) {
      nextSections.forEach(addSection);
    }

    addSection(AlbumSidePanelSection.create(context));
    addSection(BandSidePanelSection.create(context));
    addSections(createPageDataSections(context));
    addSection(HistorySidePanelSection.create());

    const sidePanelSections = sections.map((section, index) => ({
      ...section,
      id: createSectionId(section.label, index),
    }));

    console.timeEnd(logLabel);

    return sidePanelSections;
  }
}

function createPageDataSections(
  context: SidePanelSectionsContext,
): PendingSidePanelSection[] {
  if (!context.includePageData || !context.pageDataContext) {
    return [];
  }

  return [
    FanSidePanelSection.create(context),
    FollowingBandsSidePanelSection.create(context),
    FollowingGenresSidePanelSection.create(context),
    CollectionSidePanelSection.create(context),
    WishlistSidePanelSection.create(context),
  ].filter((section): section is PendingSidePanelSection => !!section);
}

function getUserKeyPart(
  includePageData: boolean,
  pageDataContext: PageDataContext | null,
): string {
  if (!includePageData) {
    return 'anonymous';
  }

  return String(
    pageDataContext?.fanData?.username ||
      pageDataContext?.fanData?.fan_id ||
      'anonymous',
  );
}

function createSectionId(label: string, index: number): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `${slug || 'section'}-${index}`;
}
