import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import { Band } from 'src/bandcamp/domain/band/band';
import {
  type AvailabilityList,
  availabilityKey,
  type FanDataset,
  type FanItem,
  fanStorage,
  itemId,
  readLibrary,
  readSavedItems,
  unavailableKey,
} from 'src/bandcamp/domain/fanData/library';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { BandTreeItemFactory } from '../factories/BandTreeItemFactory';
import { TREE_ITEM_LAYOUT, type TreeItem } from '../TreeItem';
import { link } from '../TreeItemBuilder';

function archiveItem(
  item: FanItem,
  current: boolean,
  note?: string,
  fanId?: number,
): TreeItem {
  let tree: TreeItem;
  if ('tralbum_id' in item) {
    tree = AlbumTreeItemFactory.createWithPreview(
      AlbumFactory.fromBandcampItem(item),
      fanId,
    );
  } else if ('band_id' in item) {
    tree = BandTreeItemFactory.createWithPreview(
      Band.create(
        item.band_id,
        item.name,
        BandcampUrlFactory.generateBandUrlFromSubdomain(
          item.url_hints.subdomain,
        ),
        item.image_id ?? item.art_id,
      ),
      { following: current, location: item.location ?? undefined },
    );
  } else
    tree = link(
      item.name,
      new URL(item.tag_page_url, 'https://bandcamp.com').href,
    ).build();
  return { ...tree, hint: note };
}
function archiveRoot(label: string, children: TreeItem[]): TreeItem {
  return {
    label,
    children,
    childrenCount: children.length,
    childrenLoaded: true,
    hasChildren: true,
    itemPreview: true,
    layout: TREE_ITEM_LAYOUT.BROWSER,
  };
}

export async function appendFanArchive(
  tree: TreeItem,
  fanId: number | undefined,
  dataset: FanDataset,
): Promise<TreeItem> {
  const storage = fanStorage();
  const library = fanId ? await readLibrary(fanId) : undefined;
  const list = library?.lists[dataset];
  const results =
    (fanId
      ? await storage.getByKey<AvailabilityList>(availabilityKey(fanId))
      : undefined) ?? {};
  const unavailable =
    (fanId
      ? await storage.getByKey<AvailabilityList>(unavailableKey(fanId))
      : undefined) ?? {};
  const current = new Set(list?.current ?? []);
  const entries = (await readSavedItems(dataset, fanId)).map(
    (item): [string, FanItem] => [itemId(item), item],
  );
  const makeItems = (records: typeof entries) =>
    records.map(([id, item]) =>
      archiveItem(
        item,
        current.has(id),
        unavailable[id]
          ? `Unavailable: ${unavailable[id].reason} · ${unavailable[id].checkedAt}`
          : list?.syncedAt && !current.has(id)
            ? dataset === 'following-genres'
              ? 'No longer followed.'
              : `No longer listed. ${results[id]?.reason ?? 'Availability check pending.'}`
            : undefined,
        fanId,
      ),
    );
  const roots = [...(tree.children ?? [])];
  if (dataset !== 'following-genres')
    roots.push(
      archiveRoot(
        'Unavailable',
        makeItems(entries.filter(([id]) => unavailable[id])),
      ),
    );
  roots.push(
    archiveRoot(
      'No longer listed',
      makeItems(
        entries.filter(
          ([id]) => list?.syncedAt && !current.has(id) && !unavailable[id],
        ),
      ),
    ),
  );
  if (dataset === 'following-genres')
    roots.push(archiveRoot('All saved', makeItems(entries)));
  return { ...tree, children: roots, childrenCount: roots.length };
}
