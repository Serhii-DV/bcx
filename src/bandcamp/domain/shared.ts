import { BandcampPageData } from './pageData';

export const bandcampPageData = BandcampPageData.fromJson(
  document.getElementById('pagedata')?.dataset.blob ?? '{}',
);
