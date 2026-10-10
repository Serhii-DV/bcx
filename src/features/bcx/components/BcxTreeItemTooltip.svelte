<script lang="ts">
import { Tooltip } from 'bits-ui';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import type { Snippet } from 'svelte';
import { pinnedPageDestination } from '../pinnedNavigation';

let {
  item,
  hint = item.hint,
  artist = false,
  disabled = false,
  portal,
  children,
}: {
  item: TreeItem;
  hint?: string;
  artist?: boolean;
  disabled?: boolean;
  portal?: Element;
  children: Snippet<[{ props: Record<string, unknown> }]>;
} = $props();

const destination = $derived(
  pinnedPageDestination(item.bandPreview?.url ?? item.href ?? item.id ?? ''),
);
const showTooltip = $derived(
  !disabled &&
    (artist || destination?.kind === 'release' || destination?.kind === 'band'),
);
</script>

{#if showTooltip}
  <Tooltip.Root ignoreNonKeyboardFocus>
    <Tooltip.Trigger>
      {#snippet child({ props })}{@render children({ props })}{/snippet}
    </Tooltip.Trigger>
    <Tooltip.Portal to={portal}>
      <Tooltip.Content class="sidebar-tooltip" side="bottom" align="start" sideOffset={8} collisionPadding={8} strategy="fixed">
        <strong>{item.label}</strong>
        {#each hint?.split('\n') ?? [] as line}<p>{line}</p>{/each}
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
{:else}
  {@render children({ props: { title: hint } })}
{/if}
