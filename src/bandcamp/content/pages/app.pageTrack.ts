import { currentPageUrl } from 'src/core/shared';
import { console } from 'src/utils/console';
import { onDOMReady } from 'src/utils/dom';
import { PageTrack } from '../../domain/page/pageTrack';
import { BandcampStorage } from '../../domain/storage';
import { isBandcampTrackUrl } from '../../domain/url/helper';

onDOMReady(() => {
  if (!isBandcampTrackUrl(currentPageUrl)) {
    return;
  }

  console.log('[app.track]', 'Start content script setup');

  try {
    const trackPage = new PageTrack();
    BandcampStorage.saveTrack(trackPage.track);
  } catch (error) {
    console.error('[app.track]', 'Failed to initialize TrackPage:', error);
  }
});
