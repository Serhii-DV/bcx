<script lang="ts">
import { Separator } from 'bits-ui';
import type { ComponentProps } from 'svelte';
import { cn } from '$lib/utils.js';

let { class: className, ...restProps }: ComponentProps<typeof Separator.Root> =
  $props();
</script>

<Separator.Root data-sidebar="separator" class={cn('my-2 h-px shrink-0 bg-gray-600', className)} {...restProps} />
