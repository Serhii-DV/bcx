export function getVisibleSectionTabIds(
  tabs: ReadonlyArray<{ id: string; width: number }>,
  activeId: string,
  availableWidth: number,
  moreWidth: number,
  gap = 4,
): string[] {
  if (!tabs.length) return [];

  const totalWidth =
    tabs.reduce((total, tab) => total + tab.width, 0) + gap * (tabs.length - 1);
  if (totalWidth <= availableWidth) return tabs.map((tab) => tab.id);

  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  const visible = new Set([active.id]);
  let remaining = availableWidth - moreWidth - gap - active.width;

  for (const tab of tabs) {
    if (tab.id === active.id) continue;
    if (tab.width + gap <= remaining) {
      visible.add(tab.id);
      remaining -= tab.width + gap;
    }
  }

  return tabs.filter((tab) => visible.has(tab.id)).map((tab) => tab.id);
}
