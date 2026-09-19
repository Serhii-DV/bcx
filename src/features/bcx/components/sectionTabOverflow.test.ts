import { describe, expect, it } from '@rstest/core';
import { getVisibleSectionTabIds } from './sectionTabOverflow';

const tabs = [
  { id: 'bands', width: 120 },
  { id: 'collection', width: 100 },
  { id: 'history', width: 80 },
  { id: 'info', width: 100 },
];

describe('getVisibleSectionTabIds', () => {
  it('shows every tab when they fit, without reserving a menu button', () => {
    expect(getVisibleSectionTabIds(tabs, 'bands', 412, 32)).toEqual(
      tabs.map((tab) => tab.id),
    );
  });

  it('reserves space for More and preserves the original order', () => {
    expect(getVisibleSectionTabIds(tabs, 'bands', 260, 32)).toEqual([
      'bands',
      'collection',
    ]);
  });

  it('promotes a selected overflow tab into the visible row', () => {
    expect(getVisibleSectionTabIds(tabs, 'info', 260, 32)).toEqual([
      'bands',
      'info',
    ]);
  });

  it('keeps the active tab even when it must be truncated', () => {
    expect(getVisibleSectionTabIds(tabs, 'collection', 90, 32)).toEqual([
      'collection',
    ]);
  });

  it('uses remaining space for a shorter tab', () => {
    expect(getVisibleSectionTabIds(tabs, 'bands', 240, 32)).toEqual([
      'bands',
      'history',
    ]);
  });

  it('falls back to the first tab when selection is stale', () => {
    expect(getVisibleSectionTabIds(tabs, 'removed', 100, 32)).toEqual([
      'bands',
    ]);
    expect(getVisibleSectionTabIds([], 'removed', 100, 32)).toEqual([]);
  });
});
