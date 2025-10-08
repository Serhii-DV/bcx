<script lang="ts">
import { Moon, Sun } from 'lucide-svelte';
import { ModeWatcher, toggleMode } from 'mode-watcher';
import { console } from 'src/utils/console';
import { Button } from '$lib/components/ui/button/index.js';
import * as Dialog from '$lib/components/ui/dialog/index.js';

console.log('Running popup');
</script>

<ModeWatcher />
<main>
  <div class="content">
  <Button onclick={toggleMode} variant="outline" size="icon">
    <Sun class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 !transition-all dark:-rotate-90 dark:scale-0" />
    <Moon class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 !transition-all dark:rotate-0 dark:scale-100" />
    <span class="sr-only">Toggle theme</span>
  </Button>
    <h1>Google Chrome Extension</h1>
    <p>Rsbuild with Svelte</p>
    <Button variant="destructive">Destructive</Button>

<Dialog.Root>
 <Dialog.Trigger>Open</Dialog.Trigger>
 <Dialog.Content>
  <Dialog.Header>
   <Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
   <Dialog.Description>
    This action cannot be undone. This will permanently delete your account
    and remove your data from our servers.
   </Dialog.Description>
  </Dialog.Header>
 </Dialog.Content>
</Dialog.Root>

  </div>
</main>

<style>
.content {
  display: flex;
  min-height: 100vh;
  line-height: 1.1;
  text-align: center;
  flex-direction: column;
  justify-content: center;
}

.content h1 {
  font-size: 3.6rem;
  font-weight: 700;
}

.content p {
  font-size: 1.2rem;
  font-weight: 400;
  opacity: 0.5;
}
</style>
