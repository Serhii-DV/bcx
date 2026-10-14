<script lang="ts">
import 'country-flag-icons/3x2/flags.css';
import { releaseLink } from 'src/bandcamp/domain/album/releaseNotes';
import { Url } from 'src/core/url';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import { countryFlagCodeFromLocation } from 'src/features/treeview/utils/countryFlag';
import BcxItemDetailsLayout from './BcxItemDetailsLayout.svelte';
import BcxPreviewLink from './BcxPreviewLink.svelte';
import { createItemUrl } from './itemUrl';

let {
  about,
  fallbackLocation,
  bandUrl,
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
let pageUrl = $derived(createItemUrl(bandUrl ?? profile?.url));
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
    ? {
        dateTime: date.toISOString(),
        label: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'UTC',
        }),
      }
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
  imageScale={2}
  details={bandInformation}
  detailsLabel="Detailed band information"
  {loading}
  loadingMessage="Loading saved band details…"
  {error}
>
  {#if pageUrl}<p class="band-metadata"><BcxPreviewLink url={pageUrl} plain={true} title={`Open ${profile?.name ?? 'band'} on Bandcamp in the current tab`} /></p>{/if}
  {#if createdDate}<p class="band-metadata"><strong>Bandcamp page created on <time datetime={createdDate.dateTime}>{createdDate.label}</time></strong> (<relative-time datetime={createdDate.dateTime} format="relative" tense="past" precision="day" format-style="long" title={createdDate.label}>{createdDate.label}</relative-time>)</p>{/if}
  {#if catalogYears}<p class="band-metadata">Release years {catalogYears}</p>{/if}
  {#if profile?.currency}<p class="band-metadata">Currency {profile.currency}</p>{/if}
  {#if profile?.following}<span class="following-badge">Following</span>{/if}
</BcxItemDetailsLayout>

<style>
.location-flag { --CountryFlagIcon-height: 0.875rem; flex-shrink: 0; }
.following-badge { display: block; width: fit-content; margin-top: 0.375rem; border-radius: 0.25rem; padding: 0.125rem 0.375rem; background: #293548; color: #a7f3d0; }
.band-information { padding: 0 1rem 1rem; font-size: 0.8125rem; line-height: 1.5; }
.band-metadata { margin: 0.5rem 0 0; color: #9ca3af; }
.band-metadata strong { font-weight: 600; color: #d1d5db; }
.band-information h4 { margin: 0 0 0.375rem; font-size: inherit; font-weight: 600; color: #d1d5db; }
.band-biography, .band-links { margin-top: 0.75rem; }
.band-links ul { display: flex; flex-wrap: wrap; gap: 0.375rem 1rem; margin: 0; padding: 0; list-style: none; }
.band-links li { min-width: 0; max-width: 100%; }
.band-message { margin: 0.75rem 0 0; color: #9ca3af; }
.band-biography p { margin: 0; white-space: pre-line; overflow-wrap: anywhere; font-weight: 400; line-height: 1.65; color: #d1d5db; }
.band-biography p + p { margin-top: 0.75rem; }
</style>
