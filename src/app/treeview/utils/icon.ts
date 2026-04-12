import { ExternalLink, Funnel } from '@lucide/svelte';

export const ICON_EXTERNAL_LINK = 'external-link';
export const ICON_FUNNEL = 'funnel';

export function makeIcon(icon?: string): any {
  switch (icon) {
    case ICON_EXTERNAL_LINK:
      return ExternalLink;
    case ICON_FUNNEL:
      return Funnel;
    default:
      return undefined;
  }
}
