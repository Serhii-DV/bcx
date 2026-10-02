<script lang="ts">
import iconUrl from 'src/assets/icons/icon-48.png';
import { version } from '../../../../package.json';
</script>

<section class="extension-info" aria-labelledby="extension-info-heading">
  <header>
    <div class="branding">
      <img class="logo" src={iconUrl} alt="BCX logo" width="40" height="40" />
      <div class="identity">
        <h2 id="extension-info-heading">BCX</h2>
        <p>Your Bandcamp companion</p>
      </div>
    </div>
    <span class="version" aria-label={`Version ${version}`}>v{version}</span>
  </header>

  <ul class="features">
    <li>
      <h3>Discover</h3>
      <p>Search, filter, and preview releases.</p>
    </li>
    <li>
      <h3>Collect</h3>
      <p>Your collection, wishlist, and follows in one place.</p>
    </li>
    <li>
      <h3>Rediscover</h3>
      <p>Return to music from your browsing history.</p>
    </li>
  </ul>

  <div class="shortcut">
    <span>Toggle panel</span>
    <kbd>Ctrl+Shift+X</kbd>
  </div>
</section>

<style>
  .extension-info { flex-shrink: 0; width: calc(100% - 32px); max-width: 400px; margin: 24px auto; color: #9ca3af; font-size: 0.75rem; line-height: 1.65; text-align: left; }
  header { padding: 16px 12px 24px; }
  .branding { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .logo { display: block; flex-shrink: 0; border-radius: 4px; object-fit: cover; }
  .identity { flex: 1; min-width: 0; }
  h2 { margin: 0; color: #f9fafb; font-size: 1.125rem; font-weight: 600; line-height: 1.75rem; }
  .identity p { color: #d1d5db; font-size: 0.875rem; line-height: 1.25rem; }
  p { margin: 0; text-wrap: pretty; }
  .version { display: inline-block; max-width: 100%; margin-top: 12px; padding: 2px 10px; border: 1px solid #164e63; border-radius: 999px; background: #083344; color: #a5f3fc; font-size: 0.6875rem; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .features { margin: 0; padding: 0; border-top: 1px solid #374151; border-bottom: 1px solid #374151; list-style: none; }
  li { padding: 14px 12px; }
  li + li { padding-top: 0; }
  h3 { margin: 0 0 3px; color: #e5e7eb; font-size: inherit; font-weight: 600; }
  .shortcut { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 20px 12px 0; font-size: 0.6875rem; }
  kbd { padding: 3px 10px; border: 1px solid #4b5563; border-bottom-width: 2px; border-radius: 5px; background: #1f2937; color: #e5e7eb; font-family: monospace; font-size: inherit; }
</style>
