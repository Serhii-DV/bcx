<script lang="ts">
import BcxTreeFilterInput from './BcxTreeFilterInput.svelte';

interface Props {
  value: string;
  suggestions: string[];
  visibleCount?: number;
  totalCount?: number;
  onArrowDown?: () => void;
  onUnmatchedSubmit?: (value: string) => void | Promise<void>;
}

let {
  value = $bindable(''),
  suggestions,
  visibleCount,
  totalCount,
  onArrowDown,
  onUnmatchedSubmit,
}: Props = $props();
let filterInput: BcxTreeFilterInput;
const instanceId = $props.id();
const id = `bcx-tree-browser-filter-${instanceId}`;

export function focus() {
  filterInput?.focus();
}
</script>

<BcxTreeFilterInput
  bind:this={filterInput}
  {id}
  bind:value
  {suggestions}
  {visibleCount}
  {totalCount}
  placeholder="Filter browser items..."
  {onArrowDown}
  {onUnmatchedSubmit}
/>
