import { loadCalendarReleases } from '../items/calendarReleases';
import type { SidePanelSection } from '../SidePanelSection';
import { ICON_CALENDAR_DAYS, ICON_HISTORY } from '../utils/icon';
import { createTreeDataFromTreeItemChildren } from './treeDataFactory';

export const RELEASE_CALENDAR_ID = 'release-calendar';

export const releaseCalendarSection: SidePanelSection = {
  id: RELEASE_CALENDAR_ID,
  label: 'Release Calendar',
  image: ICON_CALENDAR_DAYS,
  rootNavigation: 'tabs',
  createTreeData: async () => {
    const { upcoming, recent } = await loadCalendarReleases();

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
