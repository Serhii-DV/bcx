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
let expandedBiography = $state(false);
const componentId = $props.id();
const biographyId = `${componentId}-biography`;
const BIOGRAPHY_PREVIEW_LENGTH = 220;
let biography = $derived(profile?.biography?.trim());
let longBiography = $derived(
  (biography?.length ?? 0) > BIOGRAPHY_PREVIEW_LENGTH,
);
let biographyPreview = $derived(
  biography
    ?.slice(0, BIOGRAPHY_PREVIEW_LENGTH)
    .replace(/\s+\S*$/, '')
    .trimEnd(),
);
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
  {#if profile?.albumCount !== undefined || profile?.trackReleaseCount !== undefined || profile?.artistCount || catalogYears || profile?.currency || profile?.createdDate}
    <dl class="band-metadata">
      {#if profile?.albumCount !== undefined}<div><dt>Saved albums</dt><dd>{profile.albumCount}</dd></div>{/if}
      {#if profile?.trackReleaseCount !== undefined}<div><dt>Saved track releases</dt><dd>{profile.trackReleaseCount}</dd></div>{/if}
      {#if profile?.artistCount}<div><dt>Artists in catalog</dt><dd>{profile.artistCount}</dd></div>{/if}
      {#if catalogYears}<div><dt>Release years</dt><dd>{catalogYears}</dd></div>{/if}
      {#if profile?.currency}<div><dt>Currency</dt><dd>{profile.currency}</dd></div>{/if}
      {#if profile?.createdDate}<div><dt>Bandcamp page created</dt><dd><time datetime={profile.createdDate}>{profile.createdDate}</time></dd></div>{/if}
    </dl>
  {/if}
  {#if biography}
    <div class="band-biography">
      <h4>Biography</h4>
      <p id={biographyId}>{expandedBiography || !longBiography ? biography : `${biographyPreview}…`}</p>
      {#if longBiography}<button type="button" aria-expanded={expandedBiography} aria-controls={biographyId} onclick={() => { expandedBiography = !expandedBiography; }}>{expandedBiography ? 'Show less' : 'Read more'}</button>{/if}
    </div>
  {/if}
  {#if links.length}
    <section class="band-links" aria-label="Band links">
      <h4>Links</h4>
      <ul>
        {#each links as link}<li><BcxPreviewLink url={link.url} name={link.label} plain={true} title={`Open ${link.label}`} /></li>{/each}
      </ul>
    </section>
  {/if}
  {#each messages as message}{#if message.label}<p class="band-message">{message.label}</p>{/if}{/each}
  </div>
{/snippet}

<BcxItemDetailsLayout
  image={profile?.image}
  imageAlt={`${profile?.name ?? 'Band'} profile`}
  heading={profile?.name ?? about.label ?? 'Band'}
  subheading={location}
  subheadingPrefix={flagCode ? locationFlag : undefined}
  compactImage={true}
  details={bandInformation}
  detailsLabel="Detailed band information"
  {loading}
  loadingMessage="Loading saved band details…"
  {error}
>
  {#if profile?.following}<span class="following-badge">Following</span>{/if}
</BcxItemDetailsLayout>

<style>
.location-flag { --CountryFlagIcon-height: 1.25rem; flex-shrink: 0; }
.following-badge { display: block; width: fit-content; margin-top: 0.375rem; border-radius: 0.25rem; padding: 0.125rem 0.375rem; background: #293548; color: #a7f3d0; }
.band-information { padding: 0 1rem 1rem; font-size: 0.8125rem; line-height: 1.5; }
.band-metadata { display: flex; flex-wrap: wrap; gap: 0.375rem 1.25rem; margin: 0 0 1rem; }
.band-metadata div { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.band-metadata dt { color: #9ca3af; }
.band-metadata dd { margin: 0; color: #d1d5db; }
.band-information h4 { margin: 0 0 0.375rem; font-size: inherit; font-weight: 600; color: #d1d5db; }
.band-biography, .band-links { margin-top: 0.75rem; }
.band-links ul { display: flex; flex-wrap: wrap; gap: 0.375rem 1rem; margin: 0; padding: 0; list-style: none; }
.band-links li { min-width: 0; max-width: 100%; }
.band-message { margin: 0.75rem 0 0; color: #9ca3af; }
.band-biography p { margin: 0; white-space: pre-line; overflow-wrap: anywhere; }
.band-biography button { margin-top: 0.25rem; padding: 0; border: 0; background: transparent; color: #7dd3fc; cursor: pointer; }
.band-biography button:focus-visible { outline: 1px solid #38bdf8; outline-offset: 2px; }
</style>
