<script lang="ts">
/**
 * BCX Main Command Dialog Component
 * Main command palette for the BCX extension
 */

import SettingsIcon from '@lucide/svelte/icons/settings';
import UserIcon from '@lucide/svelte/icons/user';
import type { Dialog as DialogPrimitive } from 'bits-ui';
import { ListMusicIcon } from 'lucide-svelte';
import * as Command from '$lib/components/ui/command/index.js';

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

function handleSearchArtistAlbum() {
  console.log('🎵 BCX: Search Artist/Album selected');
  if (onSearchArtistAlbum) {
    onSearchArtistAlbum();
  }
  open = false;
}

function handleProfileSelect() {
  console.log('👤 BCX: Profile selected');
  if (onProfileSelect) {
    onProfileSelect();
  }
  open = false;
}

function handleSettingsSelect() {
  console.log('⚙️ BCX: Settings selected');
  if (onSettingsSelect) {
    onSettingsSelect();
  }
  open = false;
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open = false;
  }
}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Main Command Dialog -->
<Command.Dialog bind:open={open} {portalProps}>
  <Command.Input placeholder="Type a command or search..." />
  <Command.List>
    <Command.Empty>No results found.</Command.Empty>
    <Command.Group heading="Suggestions">
      <Command.Item onSelect={handleSearchArtistAlbum}>
        <ListMusicIcon class="mr-2 size-4" />
        <span>Search Artist/Album</span>
        <Command.Shortcut>⌘A</Command.Shortcut>
      </Command.Item>
    </Command.Group>
    <Command.Separator />
    <Command.Group heading="Settings">
      <Command.Item onSelect={handleProfileSelect}>
        <UserIcon class="mr-2 size-4" />
        <span>Profile</span>
        <Command.Shortcut>⌘P</Command.Shortcut>
      </Command.Item>
      <Command.Item onSelect={handleSettingsSelect}>
        <SettingsIcon class="mr-2 size-4" />
        <span>Settings</span>
        <Command.Shortcut>⌘S</Command.Shortcut>
      </Command.Item>
    </Command.Group>
  </Command.List>
</Command.Dialog>

<style>
  /* BCX Main Command Dialog Styles */
</style>
