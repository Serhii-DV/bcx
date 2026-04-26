/**
 * Tour steps configuration for BCX onboarding tour
 */
export const musicPageTourSteps = [
  {
    id: 'welcome',
    title: '🎉 Welcome to BCX!',
    message:
      "Welcome to BCX - Bandcamp Explorer! Let's take a quick tour of the main features.",
  },
  {
    id: 'music-filter',
    targetElement: '#bcx-filter-input',
    title: '🔍 Smart Search',
    message:
      'Use this search to filter artists, albums, and tracks. It works in real-time as you type!',
    delay: 1000,
  },
  {
    id: 'filter-results',
    targetElement: '.filter-results-count',
    title: '📊 Results Counter',
    message:
      'This shows the number of matching results as you search. It helps you see how many items match your current filter.',
  },
  {
    id: 'drawer-button',
    targetElement: '#bcx-drawer-button',
    title: '📂 Side Panel',
    message:
      'This button opens the side panel where you can explore your music collection. You can also use <kbd>Ctrl+Shift+X</kbd> to toggle it.',
    useShadowRoot: true,
  },
];

export const sidePanelTourSteps = [
  {
    id: 'collection-navigator',
    targetElement: '.bcx-tree-browser',
    title: 'Collection Navigator',
    message:
      'Use the Collection Navigator to browse artists, albums, and tracks without losing your place. Click folders to go deeper, use the breadcrumb to jump back, and open tracks or albums directly from the list.',
  },
  {
    id: 'tree-browser-filter',
    targetElement: '#bcx-tree-browser-filter',
    title: 'Quick Filtering',
    message:
      'Type here to narrow the current level of the navigator. The list updates as you search, and the arrow keys let you move through matching items quickly.',
  },
  {
    id: 'keyboard-shortcuts',
    targetElement: '.bcx-keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    message:
      'Keep this shortcut handy: <kbd>Ctrl+Shift+X</kbd> toggles the panel.',
  },
];
