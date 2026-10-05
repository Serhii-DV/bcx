<script lang="ts">
import type { SVGAttributes } from 'svelte/elements';

let {
  size = 24,
  ...restProps
}: SVGAttributes<SVGSVGElement> & { size?: number | string } = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  {...restProps}
>
  <path d="M0 18.6 7.2 5.4H24l-7.2 13.2Z" />
</svg>
