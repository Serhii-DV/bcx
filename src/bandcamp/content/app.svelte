<script lang="ts">
import { currentPageUrl, storage } from 'src/core/shared';
import { console } from 'src/utils/console';
import { onMount } from 'svelte';
import { BCXTour } from '$lib/components/bcx';
import { musicPageTourSteps } from '$lib/constants/tourSteps';
import { TOUR_COMPLETE_KEY } from '../domain/storageKey';
import { isBandcampMusicUrl } from '../domain/url/helper';

let hasCompletedTour = $state(true);
let mainTourCompleted = $state(false);

onMount(() => {
  storage
    .getBooleanByKey(TOUR_COMPLETE_KEY)
    .then((completed) => {
      hasCompletedTour = completed ?? false;
    })
    .catch((error) => {
      console.warn('BCX: Failed to load tour state:', error);
      hasCompletedTour = false;
    });
});
</script>

{#if isBandcampMusicUrl(currentPageUrl)}
  <BCXTour
    steps={musicPageTourSteps}
    autoStart={true}
    hasCompleted={hasCompletedTour || mainTourCompleted}
    completionStorageKey={TOUR_COMPLETE_KEY}
    onTourComplete={() => {
      mainTourCompleted = true;
      console.log('Tour completed');
    }}
    onTourSkipped={() => {
      mainTourCompleted = true;
      console.log('Tour skipped');
    }}
  />
{/if}
