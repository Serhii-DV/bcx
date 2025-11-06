<script lang="ts">
/**
 * BCX Main Command Dialog Component
 * Main command palette for the BCX extension
 */

import type { Dialog as DialogPrimitive } from 'bits-ui';
import { ListMusic, Settings, User } from 'lucide-svelte';
import {
  getMenuBarCollectionButton,
  getMenuBarFeedButton,
} from 'src/bandcamp/domain/page/menuBar';
import { console } from 'src/utils/console';
import { onMount } from 'svelte';
import * as Command from '$lib/components/ui/command/index.js';
import BCXDevCommandDialog from './BCXDevCommandDialog.svelte';

let {
  open = $bindable(false),
  portalProps,
  onSearchArtistAlbum = null,
  onProfileSelect = null,
  onSettingsSelect = null,
}: {
  open?: boolean;
  portalProps?: DialogPrimitive.PortalProps;
  onSearchArtistAlbum?: (() => void) | null;
  onProfileSelect?: (() => void) | null;
  onSettingsSelect?: (() => void) | null;
} = $props();

let devDialogOpen = $state(false);
let commandInput = $state('');

onMount(() => {
  console.log('[BCXMainCommandDialog]', 'Mounted');
});

function handleSearchArtistAlbum() {
  console.log('[BCXMainCommandDialog]', '🎵 Search Artist/Album selected');
  if (onSearchArtistAlbum) {
    onSearchArtistAlbum();
  }
  open = false;
}

function handleFeedSelect() {
  open = false;
  getMenuBarFeedButton()?.click();
}

function handleCollectionSelect() {
  open = false;
  getMenuBarCollectionButton()?.click();
}

function handleProfileSelect() {
  console.log('[BCXMainCommandDialog]', '👤 Profile selected');
  if (onProfileSelect) {
    onProfileSelect();
  }
  open = false;
}

function handleSettingsSelect() {
  console.log('[BCXMainCommandDialog]', '⚙️ Settings selected');
  if (onSettingsSelect) {
    onSettingsSelect();
  }
  open = false;
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open = false;
  }
  if (event.key === 'Enter' && commandInput.trim() === '/dev') {
    open = false;
    devDialogOpen = true;
    commandInput = '';
  }
}

function handleDevDialogBack() {
  devDialogOpen = false;
  open = true;
}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Main Command Dialog -->
<Command.Dialog bind:open={open} {portalProps}>
  <Command.Input
    placeholder="Type a command or search..."
    bind:value={commandInput}
  />
  <Command.List>
    <Command.Empty>No results found.</Command.Empty>

    <Command.Group heading="Suggestions">
      <Command.Item onSelect={handleSearchArtistAlbum}>
        <ListMusic class="mr-2 size-4" />
        <span>Search by artist or album on the page</span>
        <Command.Shortcut>Ctrl+M | ⌘M</Command.Shortcut>
      </Command.Item>
    </Command.Group>
    <Command.Separator />

    <Command.Group heading="Bandcamp">
      <Command.Item onSelect={handleFeedSelect}>
        <User class="mr-2 size-4" />
        <span>Feed</span>
        <Command.Shortcut>⌘E</Command.Shortcut>
      </Command.Item>
      <Command.Item onSelect={handleCollectionSelect}>
        <Settings class="mr-2 size-4" />
        <span>Collection</span>
        <Command.Shortcut>⌘C</Command.Shortcut>
      </Command.Item>
    </Command.Group>

    <Command.Group heading="BCX Extension">
      <Command.Item onSelect={handleProfileSelect}>
        <User class="mr-2 size-4" />
        <span>Profile</span>
        <Command.Shortcut>⌘P</Command.Shortcut>
      </Command.Item>
      <Command.Item onSelect={handleSettingsSelect}>
        <Settings class="mr-2 size-4" />
        <span>Settings</span>
        <Command.Shortcut>⌘S</Command.Shortcut>
      </Command.Item>
    </Command.Group>

  </Command.List>
</Command.Dialog>

<!-- Developer Command Dialog -->
<BCXDevCommandDialog
  bind:open={devDialogOpen}
  {portalProps}
  onBack={handleDevDialogBack}
/>

<style>
  /* BCX Main Command Dialog Styles */
</style>
