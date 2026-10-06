<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';
import { cn, type WithElementRef } from '$lib/utils.js';
import { useSidebar } from './context.svelte.js';

let {
  ref = $bindable(null),
  collapsible = 'icon',
  class: className,
  children,
  ...restProps
}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
  collapsible?: 'icon' | 'none';
} = $props();

const sidebar = useSidebar();
const expanded = $derived(collapsible === 'none' || sidebar.open);
</script>

<div bind:this={ref} data-slot="sidebar" data-state={expanded ? 'expanded' : 'collapsed'} data-collapsible={expanded ? '' : 'icon'} data-overlay={sidebar.overlay && expanded} class={cn('sidebar', className)} {...restProps}>
  <div data-slot="sidebar-container" class="sidebar-container">
    {@render children?.()}
  </div>
</div>

<style>
.sidebar { position: relative; flex: 0 0 var(--sidebar-width-icon); min-height: 0; }
.sidebar[data-state='expanded'][data-overlay='false'] { flex-basis: var(--sidebar-width); }
.sidebar-container { position: absolute; inset: 0 auto 0 0; box-sizing: border-box; display: flex; flex-direction: column; width: var(--sidebar-width-icon); min-height: 0; border-right: 1px solid #4b5563; background: #111827; color: #d1d5db; }
.sidebar[data-state='expanded'] .sidebar-container { width: var(--sidebar-width); }
.sidebar[data-overlay='true'] .sidebar-container { z-index: 20; box-shadow: 4px 0 12px rgb(0 0 0 / 25%); }
.sidebar[data-collapsible='icon'] :global([data-sidebar-label]) { display: none; }
.sidebar[data-collapsible='icon'] :global([data-sidebar='menu-button']) { justify-content: center; padding-inline: 0; }
.sidebar[data-collapsible='icon'] :global([data-sidebar='separator']) { width: 24px; margin-inline: auto; }
</style>
