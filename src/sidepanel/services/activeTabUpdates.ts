export function shouldReloadActiveTab(
  activeTab: { id: number; url: string } | null,
  tabId: number,
  changeInfo: { url?: string; status?: string },
  navigationUrls: readonly string[] = [],
): boolean {
  if (!activeTab || tabId !== activeTab.id) return false;

  // Keep the mounted explorer while moving within its displayed catalog.
  // This also handles the later completion event, which may omit the URL.
  const previousPage = getPageKey(activeTab.url);
  const nextPage = getPageKey(changeInfo.url ?? activeTab.url);
  const catalogPages = new Set(navigationUrls.map(getPageKey).filter(Boolean));
  if (
    previousPage &&
    nextPage &&
    catalogPages.has(previousPage) &&
    catalogPages.has(nextPage)
  ) {
    return false;
  }

  // URL updates can arrive before the new content script can return page data.
  if (changeInfo.status === 'complete') return true;
  if (!changeInfo.url) return false;

  try {
    const previous = new URL(activeTab.url);
    const next = new URL(changeInfo.url);
    return (
      previous.origin !== next.origin ||
      previous.pathname !== next.pathname ||
      previous.hash !== next.hash
    );
  } catch {
    return activeTab.url !== changeInfo.url;
  }
}

function getPageKey(url: string): string | null {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname.replace(/\/$/, '')}`;
  } catch {
    return null;
  }
}
