<script lang="ts">
import { onMount } from 'svelte';
import { Button } from '$lib/components/ui/button/index.js';

onMount(() => {
  console.log('✅ BCX extension injected at:', new Date().toLocaleTimeString());
});

function handleButtonClick() {
  alert('🎵 BCX Extension Alert!\nButton clicked');
}
</script>

<div class="bcx-extension">
  <Button variant="destructive" onclick={handleButtonClick}>Test Button</Button>
  <p>BCX extension injected into Bandcamp page</p>
</div>

<style>

</style>
