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
import { BandTreeItem } from 'src/app/treeview/band/BandTreeItem';
import { CollectionTreeItem } from 'src/app/treeview/collection/CollectionTreeItem';
import { FollowingBandsTreeItem } from 'src/app/treeview/following/FollowingBandsTreeItem';
import { FollowingFansTreeItem } from 'src/app/treeview/following/FollowingFansTreeItem';
import { FollowingGenresTreeItem } from 'src/app/treeview/following/FollowingGenresTreeItem';
import { HistoryTreeItem } from 'src/app/treeview/history/HistoryTreeItem';
import { TreeData } from 'src/app/treeview/TreeData';
import { TreeItemFactory } from 'src/app/treeview/TreeItemFactory';
import { WishlistTreeItem } from 'src/app/treeview/wishlist/WishlistTreeItem';
import type { Band } from '../domain/band/band';
import { PageAlbum } from '../domain/page/pageAlbum';
import { bandcampPageData } from '../domain/shared';
import {
  isBandcampAlbumUrl,
  isBandcampMusicUrl,
  isBandcampUrl,
} from '../domain/url/helper';

onDOMReady(async () => {
  if (!isBandcampUrl(currentPageUrl)) {
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

    if (isBandcampMusicUrl(currentPageUrl)) {
      const pageMusic = await PageMusic.init();
      band = pageMusic.band;
    } else if (isBandcampAlbumUrl(currentPageUrl)) {
      const pageAlbum = await PageAlbum.init();
      const bands = await BandcampStorage.getBands([pageAlbum.album.bandId]);
      band = bands[0];
    }

    const treeData = await createTreeData(band);

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

async function createTreeData(band: Band | null): Promise<TreeData> {
  const treeData = new TreeData();

  if (band) {
    const bandReleasesTreeItem = BandTreeItem.create(band);
    treeData.add(bandReleasesTreeItem);
  }

  const fanData = bandcampPageData.fanData;

  if (bandcampPageData) {
    if (fanData.fan_id !== bandcampPageData.data?.fan_data?.fan_id) {
      const fanPageDataTreeItem =
        await TreeItemFactory.fromBandcampFanPageData(bandcampPageData);
      if (fanPageDataTreeItem) {
        treeData.add(fanPageDataTreeItem);
      }
    }

    treeData.add(await FollowingBandsTreeItem.create(fanData.username || ''));
    treeData.add(await FollowingFansTreeItem.create(fanData.username || ''));
    treeData.add(await FollowingGenresTreeItem.create(fanData.username || ''));
    treeData.add(await CollectionTreeItem.create(fanData.username || ''));
    treeData.add(await WishlistTreeItem.create(fanData.username || ''));
  }

  treeData.add(await HistoryTreeItem.create());

  return treeData;
}
