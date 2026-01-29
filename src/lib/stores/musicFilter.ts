/**
 * Global state manager for music filter communication
 */

type FilterState = {
  searchQuery: string;
  timestamp: number;
};

const filterState: FilterState = {
  searchQuery: '',
  timestamp: 0,
};

const subscribers = new Set<(state: FilterState) => void>();

export const musicFilterStore = {
  subscribe: (callback: (state: FilterState) => void) => {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  },

  setSearchQuery: (query: string) => {
    filterState.searchQuery = query;
    filterState.timestamp = Date.now();
    subscribers.forEach((callback) => callback({ ...filterState }));
  },

  getState: () => ({ ...filterState }),

  getSubscribersCount: () => subscribers.size,
};
