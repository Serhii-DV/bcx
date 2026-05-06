<script lang="ts">
import iconUrl from 'src/assets/icons/icon-48.png';

interface Props {
  sidePanelOpen: boolean;
  onToggle: () => void;
}

let { sidePanelOpen, onToggle }: Props = $props();

function handleToggle() {
  onToggle();
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onToggle();
  }
}
</script>

<div
  id="bcx-drawer-button"
  class="bcx-drawer-button"
  role="button"
  tabindex="0"
  aria-label="Toggle BCX side panel"
  aria-pressed={sidePanelOpen}
  title="Open BCX side panel (Ctrl+Shift+X)"
  onclick={handleToggle}
  onkeydown={handleKeyDown}
>
  <span class="drawer-icon" aria-hidden="true">
    <img src={iconUrl} alt="" />
  </span>
</div>

<style>
  /* Bcx drawer button styles */
  :global(.bcx-drawer-button) {
    position: fixed;
    right: 16px;
    bottom: 16px;
    height: 52px;
    width: 52px;
    border: 0;
    color: #f9fafb;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
    background: rgb(6 15 27 / 92%);
    border-radius: 50%;
    box-shadow:
      0 12px 28px rgb(0 0 0 / 28%),
      0 0 0 1px rgb(255 255 255 / 10%);
    transition:
      background-color 180ms ease,
      box-shadow 180ms ease,
      transform 180ms ease;
    z-index: 999999;
  }

  :global(.bcx-drawer-button:hover),
  :global(.bcx-drawer-button:focus-visible) {
    background: rgb(6 15 27);
    box-shadow:
      0 16px 34px rgb(0 0 0 / 34%),
      0 0 0 2px rgb(4 177 254 / 45%);
    color: #04b1fe;
    outline: none;
    transform: translateY(-1px);
  }

  :global(.bcx-drawer-button .drawer-icon) {
    align-items: center;
    display: inline-flex;
    height: 34px;
    justify-content: center;
    opacity: 1;
    width: 34px;
  }

  :global(.bcx-drawer-button .drawer-icon img) {
    display: block;
    height: 34px;
    width: 34px;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.bcx-drawer-button) {
      transition: none;
    }
  }
</style>
