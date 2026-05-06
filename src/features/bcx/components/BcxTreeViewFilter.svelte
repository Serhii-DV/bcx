<script lang="ts">
import BcxTreeFilterInput from './BcxTreeFilterInput.svelte';

interface Props {
  value: string;
  suggestions: string[];
  onArrowDown?: () => void;
}

let { value = $bindable(''), suggestions, onArrowDown }: Props = $props();
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
  placeholder="Filter items..."
  {onArrowDown}
/>
