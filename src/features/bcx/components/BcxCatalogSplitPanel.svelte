<script lang="ts">
import type { TreeItem } from 'src/features/treeview/TreeItem';
import type { Snippet } from 'svelte';
import BcxCatalogSplitLayout from './BcxCatalogSplitLayout.svelte';
import BcxTreePanel from './BcxTreePanel.svelte';

let {
  root,
  groupLabel,
  itemLabel = 'Releases',
  emptyMessage,
  groups: groupBrowser,
  items,
}: {
  root: TreeItem;
  groupLabel: string;
  itemLabel?: string;
  emptyMessage: string;
  groups: Snippet<[(group: TreeItem) => void, string | undefined]>;
  items?: Snippet<[TreeItem]>;
} = $props();
let selection = $state.raw<{ root: TreeItem; group: TreeItem }>();
const selectedGroup = $derived(
  selection?.root === root ? selection.group : undefined,
);

function selectGroup(group: TreeItem) {
  if (selectedGroup?.path !== group.path) selection = { root, group };
}
</script>

<BcxCatalogSplitLayout {groupLabel} {itemLabel}>
  {#snippet groups()}
    {@render groupBrowser(selectGroup, selectedGroup?.path)}
  {/snippet}
  {#if selectedGroup}
    {#key selectedGroup}
      {#if items}
        {@render items(selectedGroup)}
      {:else}
        <BcxTreePanel root={selectedGroup} showFilter={false} autoSelectPreview={false} />
      {/if}
    {/key}
  {:else}
    <p>{emptyMessage}</p>
  {/if}
</BcxCatalogSplitLayout>

<style>
p { margin: 0; overflow-wrap: anywhere; color: #9ca3af; font-size: 0.875rem; }
</style>
