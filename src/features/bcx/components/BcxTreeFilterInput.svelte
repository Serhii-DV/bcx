<script lang="ts">
interface Props {
  id: string;
  value: string;
  suggestions: string[];
  placeholder: string;
  clearLabel?: string;
  onArrowDown?: () => void;
}

let {
  id,
  value = $bindable(''),
  suggestions,
  placeholder,
  clearLabel = 'Clear filter',
  onArrowDown,
}: Props = $props();

let filterInput: HTMLInputElement;
let datalistId = $derived(`${id}-datalist`);

export function focus() {
  filterInput?.focus();
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key !== 'ArrowDown') {
    return;
  }

  event.preventDefault();
  onArrowDown?.();
}

function clearFilter() {
  value = '';
  focus();
}
</script>

<div class="relative w-full flex items-center">
  <input
    bind:this={filterInput}
    {id}
    type="text"
    {placeholder}
    bind:value
    onkeydown={handleKeyDown}
    list={datalistId}
    class="px-3 py-2 bg-gray-700 text-white text-sm opacity-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full {value ? 'pr-8' : ''}"
  />
  {#if value}
    <button
      type="button"
      aria-label={clearLabel}
      class="absolute right-2 top-1/4 -translate-y-1/2 text-gray-400 hover:text-white bg-transparent p-0 m-0 flex items-center justify-center cursor-pointer"
      onclick={clearFilter}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
  {/if}
</div>
<datalist id={datalistId}>
  {#each suggestions as suggestion}
    <option value={suggestion}></option>
  {/each}
</datalist>
