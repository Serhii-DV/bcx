import { mount } from 'svelte';
import App from './app.all.svelte';
import './app.all.css';
import { getExtensionUrl } from 'src/utils/chrome.runtime';
import { injectCssFile, onDOMReady } from 'src/utils/dom';
import 'src/utils/console';
import { currentPageUrl } from 'src/core/shared';
import { arrayPreview, console } from 'src/utils/console';
import { PageMusic } from '../domain/page/pageMusic';
import { BandcampStorage } from '../domain/storage';
import './app.music';
import './app.album';
import './app.track';
import { TreeData } from 'src/app/treeview/treeData';
import { TreeItemFactory } from 'src/app/treeview/treeItemFactory';
import type { Band } from '../domain/band/band';
import { PageAlbum } from '../domain/page/pageAlbum';

onDOMReady(async () => {
  if (!currentPageUrl.isBandcamp) {
    return;
  }

  console.log('[app.all]', 'Start content script setup');

  const container = document.createElement('div');
  container.id = 'bcx-app';
  document.body.appendChild(container);

  const shadowRoot = container.attachShadow({ mode: 'open' });

  try {
    await injectCssFile(getExtensionUrl('bandcamp.page.all.css'), shadowRoot);

    // Load bands data before mounting the app
    const bands = await BandcampStorage.getBands();
    console.log(
      '[app.all]',
      `Loaded ${bands.length} bands from storage`,
      ...arrayPreview(bands),
    );

    let band: Band | null = null;

    if (currentPageUrl.isMusic) {
      const pageMusic = await PageMusic.init();
      band = pageMusic.band;
    } else if (currentPageUrl.isAlbum) {
      const pageAlbum = await PageAlbum.init();
      const bands = await BandcampStorage.getBands([pageAlbum.album.bandId]);
      band = bands[0];
    }

    const treeData = await createTreeDataForBand(band);

    mount(App, {
      target: shadowRoot,
      props: {
        bands,
        treeData,
      },
    });
  } catch (error) {
    console.error('[app.all]', 'Failed to setup content script:', error);
  }
});

async function createTreeDataForBand(band: Band | null): Promise<TreeData> {
  const treeData = new TreeData();

  if (!band) {
    return treeData;
  }

  const bandReleasesTreeItem = TreeItemFactory.fromBrand(band);
  treeData.add(bandReleasesTreeItem);
  treeData.add(await TreeItemFactory.fromHistory());

  return treeData;
}
