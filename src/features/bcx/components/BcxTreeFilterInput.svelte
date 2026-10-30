<script lang="ts">
interface Props {
  id: string;
  value: string;
  suggestions: string[];
  placeholder: string;
  clearLabel?: string;
  visibleCount?: number;
  totalCount?: number;
  onArrowDown?: () => void;
  onUnmatchedSubmit?: (value: string) => void | Promise<void>;
}

let {
  id,
  value = $bindable(''),
  suggestions,
  placeholder,
  clearLabel = 'Clear filter',
  visibleCount,
  totalCount,
  onArrowDown,
  onUnmatchedSubmit,
}: Props = $props();

let filterInput: HTMLInputElement;
let datalistId = $derived(`${id}-datalist`);

export function focus() {
  filterInput?.focus();
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    const normalizedValue = value.trim().toLocaleLowerCase();
    const matchesSuggestion = suggestions.some(
      (suggestion) => suggestion.trim().toLocaleLowerCase() === normalizedValue,
    );

    if (normalizedValue && !matchesSuggestion && onUnmatchedSubmit) {
      event.preventDefault();
      void onUnmatchedSubmit(value.trim());
    }
    return;
  }

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

<div class="bcx-tree-filter">
  <div class="bcx-tree-filter-field">
  <input
    bind:this={filterInput}
    {id}
    type="text"
    {placeholder}
    bind:value
    onkeydown={handleKeyDown}
    list={datalistId}
    class="bcx-tree-filter-input"
    class:has-value={Boolean(value)}
  />
  {#if value}
    <button
      type="button"
      aria-label={clearLabel}
      class="bcx-tree-filter-clear"
      onclick={clearFilter}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
  {/if}
  </div>
  {#if value.trim() && visibleCount !== undefined && totalCount !== undefined}
    <span class="bcx-tree-filter-count" role="status" aria-label={`${visibleCount} of ${totalCount} items visible`} title={`${visibleCount} of ${totalCount} items visible`}>{visibleCount} / {totalCount}</span>
  {/if}
</div>
<datalist id={datalistId}>
  {#each suggestions as suggestion}
    <option value={suggestion}></option>
  {/each}
</datalist>

<style>
.bcx-tree-filter {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  width: 100%;
}

.bcx-tree-filter-field { position: relative; flex: 1 1 0%; min-width: 0; }
.bcx-tree-filter-count { flex: none; margin-left: 0.375rem; padding: 0.125rem 0.5rem; border-radius: 9999px; background: rgb(255 255 255 / 10%); color: #d1d5db; font-size: 0.75rem; line-height: 1.25rem; font-variant-numeric: tabular-nums; white-space: nowrap; }

.bcx-tree-filter-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background-color: oklch(37.3% 0.034 259.733);
  color: #fff;
  font-size: 0.875rem;
  line-height: 1.25rem;
  opacity: 0.5;
}

.bcx-tree-filter-input.has-value {
  padding-right: 2rem;
}

.bcx-tree-filter-input::placeholder {
  color: oklch(70.7% 0.022 261.325);
}

.bcx-tree-filter-input:focus {
  outline-style: none;
  box-shadow: 0 0 0 2px oklch(70.7% 0.165 254.624);
}

.bcx-tree-filter-clear {
  position: absolute;
  right: 0.5rem;
  top: 25%;
  translate: 0 -50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 9px 0 0;
  padding: 0;
  background-color: transparent;
  color: oklch(70.7% 0.022 261.325);
  cursor: pointer;
}

.bcx-tree-filter-clear:hover {
  color: #fff;
}
</style>
