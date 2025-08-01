<script lang="ts">
import { onMount } from 'svelte';

onMount(() => {
  console.log('✅ BCX extension injected at:', new Date().toLocaleTimeString());
});
</script>

<div class="bcx-extension">
  <p>BCX extension injected into Bandcamp page</p>
</div>

<style>
  .bcx-extension {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #148105;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
</style>
