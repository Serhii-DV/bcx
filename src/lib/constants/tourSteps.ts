/**
 * Tour steps configuration for BCX onboarding tour
 */
export const tourSteps = [
  {
    id: 'welcome',
    title: '🎉 Welcome to BCX!',
    message:
      "Welcome to BCX - Bandcamp Explorer! Let's take a quick tour of the main features.",
  },
  {
    id: 'drawer-button',
    targetElement: '#bcx-drawer-button',
    title: '📂 Side Panel',
    message:
      'This button opens the side panel where you can explore your music collection. You can also use <kbd>Alt+X</kbd> to toggle it.',
    useShadowRoot: true,
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
];
