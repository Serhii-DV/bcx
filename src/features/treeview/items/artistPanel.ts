import { loadSavedBandLinkProfiles } from '../BandPreview';
import type { TreeItem } from '../TreeItem';
import { ICON_MIC } from '../utils/icon';

export async function loadCatalogArtistRows(
  root: TreeItem,
): Promise<TreeItem[]> {
  const [loaded, profiles] = await Promise.all([
    root.loadChildren && !root.childrenLoaded ? root.loadChildren() : root,
    loadSavedBandLinkProfiles(),
  ]);
  const artists = Array.isArray(loaded) ? loaded : (loaded?.children ?? []);
  const normalize = (name: string) => name.trim().toLowerCase();
  return artists.map((artist) => {
    const profile = profiles.find(
      (band) => normalize(band.name) === normalize(artist.label ?? ''),
    );
    return {
      ...artist,
      query: undefined,
      image:
        profile?.image ??
        (artist.image === ICON_MIC ? undefined : artist.image),
      showArtwork: true,
      hasChildren: true,
      href: profile?.url.toString(),
      bandPreview: profile
        ? {
            name: profile.name,
            url: profile.url.toString(),
            image: profile.image,
            cached: false,
          }
        : undefined,
      hint: `Browse releases by ${artist.label ?? 'this artist'} in this catalog.`,
    };
  });
}
