export function shouldReloadActiveTab(
  activeTab: { id: number; url: string } | null,
  tabId: number,
  changeInfo: { url?: string; status?: string },
): boolean {
  if (!activeTab || tabId !== activeTab.id) return false;

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
