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
.sidebar { --sidebar-motion-duration: 180ms; --sidebar-motion-easing: cubic-bezier(0.2, 0, 0, 1); position: relative; flex: 0 0 var(--sidebar-width-icon); min-height: 0; transition: flex-basis var(--sidebar-motion-duration) var(--sidebar-motion-easing); }
.sidebar[data-state='expanded'][data-overlay='false'] { flex-basis: var(--sidebar-width); }
.sidebar-container { position: absolute; inset: 0 auto 0 0; box-sizing: border-box; display: flex; flex-direction: column; width: var(--sidebar-width-icon); min-height: 0; overflow: hidden; z-index: 20; transition: width var(--sidebar-motion-duration) var(--sidebar-motion-easing), box-shadow var(--sidebar-motion-duration) var(--sidebar-motion-easing); border-right: 1px solid #4b5563; background: #111827; color: #d1d5db; }
.sidebar[data-state='expanded'] .sidebar-container { width: var(--sidebar-width); }
.sidebar[data-overlay='true'] .sidebar-container { box-shadow: 4px 0 12px rgb(0 0 0 / 25%); }
.sidebar-container :global([data-sidebar-label]) { opacity: 1; visibility: visible; transition: opacity 120ms ease-out 40ms, visibility 0s; }
.sidebar-container :global([data-sidebar='menu-button'] [data-sidebar-label]) { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.sidebar[data-collapsible='icon'] :global([data-sidebar-label]) { opacity: 0; visibility: hidden; transition: opacity 80ms ease-out, visibility 0s linear 80ms; }
.sidebar-container :global([data-sidebar-action]) { animation: sidebar-action-reveal 120ms ease-out 60ms both; }
.sidebar[data-collapsible='icon'] :global([data-sidebar='separator']) { width: 24px; margin-inline: auto; }
@keyframes sidebar-action-reveal {
  from { opacity: 0; }
  to { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .sidebar, .sidebar-container, .sidebar-container :global([data-sidebar-label]), .sidebar[data-collapsible='icon'] :global([data-sidebar-label]) { transition: none; }
  .sidebar-container :global([data-sidebar-action]) { animation: none; }
}
</style>
