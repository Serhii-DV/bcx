<script lang="ts">
import { Tooltip } from 'bits-ui';
import { onMount } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import { cn, type WithElementRef } from '$lib/utils.js';
import { setSidebar } from './context.svelte.js';

let {
  ref = $bindable(null),
  open = $bindable(false),
  onOpenChange = () => {},
  class: className,
  children,
  ...restProps
}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = $props();

let overlay = $state(true);
setSidebar({
  open: () => open,
  overlay: () => overlay,
  setOpen: (value) => {
    open = value;
    onOpenChange(value);
  },
});

// The extension keeps its icon rail at narrow widths instead of switching to a sheet.
onMount(() => {
  if (!ref) return;
  overlay = ref.getBoundingClientRect().width < 700;
  const observer = new ResizeObserver(([entry]) => {
    if (entry) overlay = entry.contentRect.width < 700;
  });
  observer.observe(ref);
  return () => observer.disconnect();
});
</script>

<Tooltip.Provider delayDuration={250}>
  <div bind:this={ref} data-slot="sidebar-wrapper" class={cn('sidebar-wrapper', className)} {...restProps}>
    {@render children?.()}
  </div>
</Tooltip.Provider>

<style>
.sidebar-wrapper { --sidebar-width: 220px; --sidebar-width-icon: 48px; position: relative; display: flex; flex: 1 1 0%; min-height: 0; min-width: 0; }
</style>
