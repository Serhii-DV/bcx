<script lang="ts">
import {
  type BandPreview,
  createBandAboutFallback,
  loadBandDetails,
} from 'src/features/treeview/BandPreview';
import type { TreeData } from 'src/features/treeview/TreeData';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import BcxBandPanel from './BcxBandPanel.svelte';

let { band }: { band: BandPreview } = $props();
let about = $state<TreeItem>();
let treeData = $state<TreeData>();
let loading = $state(false);
let error = $state('');

$effect(() => {
  const selected = band;
  let cancelled = false;
  about = undefined;
  treeData = undefined;
  loading = true;
  error = '';
  void loadBandDetails(selected)
    .then((details) => {
      if (!cancelled) {
        about = details.about;
        treeData = details.treeData;
      }
    })
    .catch(() => {
      if (!cancelled) error = 'Could not read saved band details.';
    })
    .finally(() => {
      if (!cancelled) loading = false;
    });
  return () => {
    cancelled = true;
  };
});
</script>

<BcxBandPanel {treeData} about={about ?? createBandAboutFallback(band)} fallbackLocation={band.location} bandUrl={band.url} {loading} {error} />
