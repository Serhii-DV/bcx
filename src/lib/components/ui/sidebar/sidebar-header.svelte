<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';
import { cn, type WithElementRef } from '$lib/utils.js';

let {
  ref = $bindable(null),
  class: className,
  children,
  ...restProps
}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div bind:this={ref} data-slot="sidebar-header" data-sidebar="header" class={cn('flex shrink-0 flex-col p-[5px]', className)} {...restProps}>
  {@render children?.()}
</div>
