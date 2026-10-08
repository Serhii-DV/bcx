<script lang="ts">
import { mergeProps, Tooltip } from 'bits-ui';
import type { Snippet } from 'svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';
import { cn, type WithElementRef } from '$lib/utils.js';
import { useSidebar } from './context.svelte.js';

let {
  ref = $bindable(null),
  class: className,
  children,
  child,
  isActive = false,
  tooltipContent,
  tooltipDisabled = false,
  tooltipPortal,
  ...restProps
}: WithElementRef<HTMLButtonAttributes, HTMLButtonElement> & {
  isActive?: boolean;
  child?: Snippet<[{ props: Record<string, unknown> }]>;
  tooltipContent?: Snippet;
  tooltipDisabled?: boolean;
  tooltipPortal?: Element;
} = $props();

const sidebar = useSidebar();
let tooltipOpen = $state(false);
$effect(() => {
  if (sidebar.open || tooltipDisabled) tooltipOpen = false;
});
const buttonProps = $derived({
  type: 'button' as const,
  'data-slot': 'sidebar-menu-button',
  'data-sidebar': 'menu-button',
  'data-active': isActive,
  class: cn('sidebar-menu-button', className),
  ...restProps,
});
</script>

{#snippet button(props: Record<string, unknown>)}
  {@const mergedProps = mergeProps(buttonProps, props)}
  {#if child}
    {@render child({ props: mergedProps })}
  {:else}
    <button bind:this={ref} {...mergedProps}>{@render children?.()}</button>
  {/if}
{/snippet}

{#if tooltipContent}
  <Tooltip.Root bind:open={tooltipOpen} disabled={sidebar.open || tooltipDisabled} ignoreNonKeyboardFocus>
    <Tooltip.Trigger>
      {#snippet child({ props })}{@render button(props)}{/snippet}
    </Tooltip.Trigger>
    <Tooltip.Portal to={tooltipPortal}>
      <Tooltip.Content class="sidebar-tooltip" side="right" align="start" sideOffset={8} collisionPadding={8} strategy="fixed">
        {@render tooltipContent()}
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
{:else}
  {@render button({})}
{/if}

<style>
:global(.sidebar-menu-button) { position: relative; display: flex; align-items: center; gap: 8px; box-sizing: border-box; width: 100%; min-height: 36px; padding: 8px 10px; border: 0; border-radius: 6px; background: transparent; color: #d1d5db; text-align: left; font-size: 0.875rem; cursor: pointer; }
:global(.sidebar-menu-button > svg) { flex-shrink: 0; }
:global(.sidebar-menu-button:hover), :global(.sidebar-menu-button[data-active='true']), :global(.sidebar-menu-button[data-state='open']) { background: #374151; color: #f9fafb; }
:global(.sidebar-menu-button[data-active='true']) { box-shadow: inset 2px 0 #38bdf8; }
:global(.sidebar-menu-button:focus-visible) { outline: 2px solid #04b1fe; outline-offset: -2px; }
:global(.sidebar-tooltip) { z-index: 1000000; box-sizing: border-box; width: 260px; max-width: calc(100vw - 64px); padding: 12px; border: 1px solid #4b5563; border-radius: 8px; background: #111827; color: #f9fafb; font-size: 0.875rem; box-shadow: 0 4px 12px rgb(0 0 0 / 25%); overflow-wrap: anywhere; }
:global(.sidebar-tooltip strong) { display: block; font-weight: 600; }
:global(.sidebar-tooltip p) { margin: 4px 0 0; color: #9ca3af; font-size: 0.75rem; line-height: 1.5; }
@media (pointer: coarse) { :global(.sidebar-menu-button) { min-height: 44px; } }
</style>
