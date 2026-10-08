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

<div bind:this={ref} data-slot="sidebar-content" data-sidebar="content" class={cn('flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-[5px] py-2', className)} {...restProps}>
  {@render children?.()}
</div>
