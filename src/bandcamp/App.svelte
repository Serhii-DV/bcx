<script lang="ts">
import { onMount } from 'svelte';
import { Button } from '$lib/components/ui/button/index.js';

let dialogOpen = $state(false);
let shadowContainer: HTMLElement | null = null;

function handleKeydown(e: KeyboardEvent) {
  if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    dialogOpen = !dialogOpen;
  }
}

onMount(() => {
  console.log('✅ BCX extension injected at:', new Date().toLocaleTimeString());
});

function handleButtonClick() {
  alert('🎵 BCX Extension Alert!\nButton clicked');
}

// Get the shadow DOM container
const bcxElement = document.querySelector('#bcx-app');
if (bcxElement?.shadowRoot) {
  const portalContainer = document.createElement('div');
  portalContainer.id = 'bcx-portal-container';
  portalContainer.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 999999;
    pointer-events: none;
  `;
  bcxElement.shadowRoot.appendChild(portalContainer);
  shadowContainer = portalContainer;
}
</script>

<svelte:document onkeydown={handleKeydown} />

<div class="bcx-extension">
  <Button variant="destructive" onclick={handleButtonClick}>Test Button</Button>
  <p>BCX extension injected into Bandcamp page</p>
</div>

<style>

</style>
