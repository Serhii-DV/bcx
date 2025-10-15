import { currentPageUrl } from 'src/core/shared';
import { console } from 'src/utils/console';
import { onDOMReady } from 'src/utils/dom';
import { BandcampStorage } from '../domain/storage';
import { TrackPage } from '../domain/track/page';

onDOMReady(() => {
  if (!currentPageUrl.isTrack) {
    return;
  }

  console.log('[app.track]', 'Start content script setup');

  try {
    const trackPage = new TrackPage();
    BandcampStorage.saveTrack(trackPage.track);
  } catch (error) {
    console.error('[app.track]', 'Failed to initialize TrackPage:', error);
  }
});
