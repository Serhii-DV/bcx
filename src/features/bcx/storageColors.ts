const categoryColors: Record<string, string> = {
  'Activity log': '#a3e635',
  Albums: '#38bdf8',
  Bands: '#a78bfa',
  'Fan libraries and sync data': '#34d399',
  'Other data': '#fb923c',
  'Settings and panel state': '#f472b6',
  'Storage history': '#facc15',
  Tracks: '#2dd4bf',
  'URL lookups': '#818cf8',
  'Cached catalogs': '#f87171',
};

export function storageCategoryColor(label: string): string {
  return categoryColors[label] ?? '#cbd5e1';
}
