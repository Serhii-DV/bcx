export const treeFilterContext = Symbol('treeFilter');

export interface TreeFilterContext {
  enabled: () => boolean;
  setQuery: (query: string) => void;
}
