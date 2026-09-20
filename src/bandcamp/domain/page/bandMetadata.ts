import type { BandMetadata } from '../band/metadata';

/** Read only the public profile sidebar, including collapsed biography text. */
export function readBandMetadata(
  document: Document,
  baseUrl: string,
): Pick<BandMetadata, 'location' | 'biography' | 'links'> | undefined {
  if (!document.querySelector('#band-name-location')) return undefined;

  const biography = document.querySelector('#bio-text')?.cloneNode(true);
  if (biography instanceof Element) {
    biography
      .querySelectorAll('.peekaboo-link, script, style')
      .forEach((node) => node.remove());
  }
  const clean = (value: string | null | undefined) =>
    value?.replace(/\s+/g, ' ').trim() || undefined;
  const links: BandMetadata['links'] = [];
  const seen = new Set<string>();
  for (const anchor of Array.from(
    document.querySelectorAll('#band-links a[href]'),
  )) {
    try {
      const url = new URL(anchor.getAttribute('href') ?? '', baseUrl);
      if (!['https:', 'http:'].includes(url.protocol) || seen.has(url.href))
        continue;
      seen.add(url.href);
      links.push({
        label: clean(anchor.textContent) ?? url.hostname,
        url: url.href,
      });
    } catch {
      // A malformed publisher link should not hide the rest of the profile.
    }
  }
  return {
    location: clean(
      document.querySelector('#band-name-location .location')?.textContent,
    ),
    biography: clean(biography?.textContent),
    links,
  };
}
