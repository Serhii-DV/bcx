import type { MusicRecordingSchema } from 'src/bandcamp/domain/page/schema';
import type { FanData } from 'src/bandcamp/domain/types/FanData';

export interface PageDataContext {
  data: any;
  fanData: FanData;
  trackSchema?: MusicRecordingSchema | null;
}
