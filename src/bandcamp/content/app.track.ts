import { currentPageUrl } from 'src/core/shared';
import { console } from 'src/utils/console';
import { onDOMReady } from 'src/utils/dom';
import { BandcampStorage } from '../core/storage';
import { TrackPage } from '../track/page';

onDOMReady(() => {
  console.log(currentPageUrl);
  if (!currentPageUrl.isTrack) {
    return;
  }

  console.log('Start track page content script setup');

  try {
    const trackPage = new TrackPage();
    BandcampStorage.saveTrack(trackPage.track);
  } catch (error) {
    console.error('Failed to initialize TrackPage:', error);
  }
});
