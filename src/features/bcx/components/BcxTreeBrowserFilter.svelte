<script lang="ts">
import BcxTreeFilterInput from './BcxTreeFilterInput.svelte';

interface Props {
  value: string;
  suggestions: string[];
  onArrowDown?: () => void;
}

let { value = $bindable(''), suggestions, onArrowDown }: Props = $props();
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
  placeholder="Filter browser items..."
  {onArrowDown}
/>
