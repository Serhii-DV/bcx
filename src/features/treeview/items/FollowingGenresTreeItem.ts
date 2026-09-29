import { readCurrentItems } from 'src/bandcamp/domain/fanData/library';
import type { GenreItem } from 'src/bandcamp/domain/types/CollectionPageData';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { TreeItemButtonFactory } from '../buttons/factory';
import type { TreeItem } from '../TreeItem';
import { link } from '../TreeItemBuilder';
import { ICON_TAG } from '../utils/icon';

export class FollowingGenresTreeItem {
  static async create(username: string, fanId?: number): Promise<TreeItem> {
    const items = await readCurrentItems<GenreItem>('following-genres', fanId);
    return {
      label: 'Following Genres',
      buttons: [
        TreeItemButtonFactory.createExternalLink(
          'Open Following Genres',
          BandcampUrlFactory.generateFollowingGenresUrl(username),
        ),
      ],
      children: items.map((item) =>
        link(item.name, item.tag_page_url).withImage(ICON_TAG).build(),
      ),
    };
  }
}
