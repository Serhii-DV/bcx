<script lang="ts">
/**
 * BCX Developer Command Dialog Component
 * Developer commands and utilities for the BCX extension
 */

import type { Dialog as DialogPrimitive } from 'bits-ui';
import { ArrowLeft, Database } from 'lucide-svelte';
import { storage } from 'src/core/shared';
import { console } from 'src/utils/console';
import * as Command from '$lib/components/ui/command/index.js';

let {
  open = $bindable(false),
  portalProps,
  onBack = null,
}: {
  open?: boolean;
  portalProps?: DialogPrimitive.PortalProps;
  onBack?: (() => void) | null;
} = $props();

async function handleStorageSizeCommand() {
  console.log('📊 BCX Dev: Getting storage size...');
  try {
    const count = await storage.count();
    const size = await storage.getSize();
    console.log(`💾 BCX Storage Size:`, {
      count,
      sizeInBytes: size + ' bytes',
      sizeInKB: (size / 1024).toFixed(2) + ' KB',
      sizeInMB: (size / (1024 * 1024)).toFixed(2) + ' MB',
    });
  } catch (error) {
    console.error('❌ BCX: Failed to get storage size:', error);
  }
  open = false;
}

function handleBack() {
  console.log('⬅️ BCX Dev: Back to main dialog');
  if (onBack) {
    onBack();
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

<!-- Developer Command Dialog -->
<Command.Dialog bind:open={open} {portalProps}>
  <Command.Input placeholder="Type a developer command..." />
  <Command.List>
    <Command.Empty>No developer commands found.</Command.Empty>

    <Command.Group heading="Navigation">
      <Command.Item onSelect={handleBack}>
        <ArrowLeft class="mr-2 size-4" />
        <span>Back to main dialog</span>
        <Command.Shortcut>Esc</Command.Shortcut>
      </Command.Item>
    </Command.Group>
    <Command.Separator />

    <Command.Group heading="Storage & Data">
      <Command.Item onSelect={handleStorageSizeCommand}>
        <Database class="mr-2 size-4" />
        <span>Get local storage size</span>
        <Command.Shortcut>Will log to console</Command.Shortcut>
      </Command.Item>
    </Command.Group>

  </Command.List>
</Command.Dialog>

<style>
  /* BCX Developer Command Dialog Styles */
</style>
