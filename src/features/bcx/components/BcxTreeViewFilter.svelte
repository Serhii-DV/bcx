<script lang="ts">
import BcxTreeFilterInput from './BcxTreeFilterInput.svelte';

interface Props {
  value: string;
  suggestions: string[];
  visibleCount?: number;
  totalCount?: number;
  onArrowDown?: () => void;
}

let {
  value = $bindable(''),
  suggestions,
  visibleCount,
  totalCount,
  onArrowDown,
}: Props = $props();
let filterInput: BcxTreeFilterInput;

export function focus() {
  filterInput?.focus();
}
</script>

<BcxTreeFilterInput
  bind:this={filterInput}
  id="bcx-tree-view-filter"
  bind:value
  {suggestions}
  {visibleCount}
  {totalCount}
  placeholder="Filter items..."
  {onArrowDown}
/>
