import type { Album } from '../album/album';
import type { AlbumDetails } from '../album/details';
import type { Band } from '../band/band';

export interface BandPage {
  readonly band: Band | null;
  readonly album: Album | null;
  readonly albumDetails: AlbumDetails | null;
}
