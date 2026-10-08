<script lang="ts">
import 'country-flag-icons/3x2/flags.css';
import { releaseLink } from 'src/bandcamp/domain/album/releaseNotes';
import { Url } from 'src/core/url';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import { countryFlagCodeFromLocation } from 'src/features/treeview/utils/countryFlag';
import BcxItemDetailsLayout from './BcxItemDetailsLayout.svelte';
import BcxPreviewLink from './BcxPreviewLink.svelte';

let {
  about,
  fallbackLocation,
  loading = false,
  error = '',
}: {
  about: TreeItem;
  fallbackLocation?: string;
  bandUrl?: string;
  loading?: boolean;
  error?: string;
} = $props();
let profile = $derived(about.aboutProfile);
let biography = $derived(
  profile?.biography
    ?.trim()
    .split(/\n\s*\n/)
    .filter((paragraph) => paragraph.trim()) ?? [],
);
let createdDate = $derived.by(() => {
  if (!profile?.createdDate) return undefined;
  const date = new Date(profile.createdDate);
  return Number.isFinite(date.getTime())
    ? { dateTime: date.toISOString(), label: profile.createdDate }
    : undefined;
});
let location = $derived(profile?.location || fallbackLocation);
let flagCode = $derived(
  countryFlagCodeFromLocation(location) ??
    countryFlagCodeFromLocation(fallbackLocation),
);
let links = $derived(
  (
    about.children?.find((item) => item.label === 'Links')?.children ?? []
  ).flatMap((item) => {
    const href = releaseLink(item.href);
    return href ? [{ label: item.label || href, url: Url.create(href) }] : [];
  }),
);
let messages = $derived(
  about.children?.filter((item) => item.label !== 'Links') ?? [],
);
let catalogYears = $derived(
  profile?.releaseYears?.length
    ? profile.releaseYears.length === 1
      ? String(profile.releaseYears[0])
      : `${profile.releaseYears[0]}–${profile.releaseYears[profile.releaseYears.length - 1]}`
    : undefined,
);
</script>

{#snippet locationFlag()}
  {#if flagCode}
    <span class={'flag:' + flagCode + ' location-flag'} aria-hidden="true"></span>
  {/if}
{/snippet}

{#snippet bandInformation()}
  <div class="band-information">
  {#if links.length}
    <section class="band-links" aria-label="Band links">
      <h4>Links</h4>
      <ul>
        {#each links as link}<li><BcxPreviewLink url={link.url} name={link.label} plain={true} title={`Open ${link.label}`} /></li>{/each}
      </ul>
    </section>
  {/if}
  {#if biography.length}
    <div class="band-biography">
      <h4>Biography</h4>
      {#each biography as paragraph}<p>{paragraph}</p>{/each}
    </div>
  {/if}
  {#if profile?.currency || createdDate || profile?.trackReleaseCount}
    <details class="band-secondary-details">
      <summary>Details</summary>
      <dl class="band-metadata">
        {#if profile?.trackReleaseCount}<div><dt>Saved track releases</dt><dd>{profile.trackReleaseCount}</dd></div>{/if}
        {#if profile?.currency}<div><dt>Currency</dt><dd>{profile.currency}</dd></div>{/if}
        {#if createdDate}<div><dt>Bandcamp page created</dt><dd><relative-time datetime={createdDate.dateTime} format="relative" precision="day" title={createdDate.label}>{createdDate.label}</relative-time></dd></div>{/if}
      </dl>
    </details>
  {/if}
  {#each messages as message}{#if message.label}<p class="band-message">{message.label}</p>{/if}{/each}
  </div>
{/snippet}

<BcxItemDetailsLayout
  image={profile?.image}
  imageAlt={`${profile?.name ?? 'Band'} profile`}
  heading={profile?.name ?? about.label ?? 'Band'}
  headingSize={2}
  subheading={location}
  subheadingSize={1}
  subheadingPrefix={flagCode ? locationFlag : undefined}
  compactImage={true}
  details={bandInformation}
  detailsLabel="Detailed band information"
  {loading}
  loadingMessage="Loading saved band details…"
  {error}
>
  {#if catalogYears}<p class="band-catalog-years">Release years {catalogYears}</p>{/if}
  {#if profile?.following}<span class="following-badge">Following</span>{/if}
</BcxItemDetailsLayout>

<style>
.location-flag { --CountryFlagIcon-height: 0.875rem; flex-shrink: 0; }
.following-badge { display: block; width: fit-content; margin-top: 0.375rem; border-radius: 0.25rem; padding: 0.125rem 0.375rem; background: #293548; color: #a7f3d0; }
.band-information { padding: 0 1rem 1rem; font-size: 0.8125rem; line-height: 1.5; }
.band-catalog-years { margin: 0.5rem 0 0; color: #9ca3af; }
.band-secondary-details { margin-top: 1rem; color: #9ca3af; }
.band-secondary-details summary { cursor: pointer; width: fit-content; }
.band-secondary-details summary:focus-visible { outline: 1px solid #38bdf8; outline-offset: 2px; border-radius: 0.25rem; }
.band-secondary-details .band-metadata { margin: 0.5rem 0 0; }
.band-metadata { display: flex; flex-wrap: wrap; gap: 0.375rem 1.25rem; margin: 0 0 1rem; }
.band-metadata div { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.band-metadata dt { color: #9ca3af; }
.band-metadata dd { margin: 0; color: #d1d5db; }
.band-information h4 { margin: 0 0 0.375rem; font-size: inherit; font-weight: 600; color: #d1d5db; }
.band-biography, .band-links { margin-top: 0.75rem; }
.band-links ul { display: flex; flex-wrap: wrap; gap: 0.375rem 1rem; margin: 0; padding: 0; list-style: none; }
.band-links li { min-width: 0; max-width: 100%; }
.band-message { margin: 0.75rem 0 0; color: #9ca3af; }
.band-biography p { margin: 0; white-space: pre-line; overflow-wrap: anywhere; font-weight: 400; line-height: 1.65; color: #d1d5db; }
.band-biography p + p { margin-top: 0.75rem; }
</style>
