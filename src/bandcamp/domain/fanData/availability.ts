import type { Availability, FanItem } from './library';
import { itemUrl } from './library';

export async function checkAvailability(
  item: FanItem,
  signal: AbortSignal,
): Promise<Availability> {
  const url = itemUrl(item);
  const result: Availability = {
    state: 'unknown',
    checkedAt: new Date().toISOString(),
    url,
    reason: 'Could not verify this page; retry later.',
  };
  const target = new URL(url);
  if (
    target.protocol !== 'https:' ||
    !/(^|\.)bandcamp\.com$/.test(target.hostname)
  ) {
    return {
      ...result,
      reason: 'This URL is outside the extension’s Bandcamp access.',
    };
  }
  try {
    const response = await fetch(url, {
      credentials: 'include',
      cache: 'no-store',
      signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
    });
    // A redirected error may belong to another page or a login/challenge flow.
    const finalUrl = new URL(response.url);
    if (
      finalUrl.origin !== target.origin ||
      finalUrl.pathname !== target.pathname
    ) {
      await response.body?.cancel();
      return {
        ...result,
        reason: 'Page redirected; availability needs another check.',
      };
    }
    if (response.status === 404 || response.status === 410) {
      await response.body?.cancel();
      return {
        ...result,
        state: 'unavailable',
        reason: `HTTP ${response.status}`,
      };
    }
    if (response.ok) {
      const html = await response.text();
      if (
        /data-tralbum=|id=["']band-name-location["']/.test(html) &&
        !/id=["']challenge-form["']|cf-chl-|<title>[^<]*(?:captcha|just a moment)/i.test(
          html,
        )
      ) {
        return {
          ...result,
          state: 'available',
          reason: 'Bandcamp page is accessible.',
        };
      }
    } else {
      await response.body?.cancel();
    }
    return {
      ...result,
      reason: `Unverified response (HTTP ${response.status}); retry later.`,
    };
  } catch {
    signal.throwIfAborted();
    return result;
  }
}
